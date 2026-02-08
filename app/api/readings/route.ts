/**
 * ESP32 Readings API
 * POST /api/readings - Receive readings from ESP32 device
 * GET /api/readings - Get sync status for a device
 */

import { type NextRequest, NextResponse } from "next/server"
import { Device, DailyLoadProfile, Alarm } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { AlarmType, SeverityCode, DeviceStatus } from "@/lib/enums"
import { format, subSeconds } from "date-fns"

interface ReadingData {
  offsetSeconds: number
  entryNo: number
  accumulatedAvgPower: number
  maxAvgCurrent: number
  maxAvgVoltage: number
  minAvgVoltage: number
  avgCurrent?: number
  avgVoltage?: number
}

interface RelayState {
  id: number
  pin: number
  state: boolean
}

interface DeviceInfo {
  relayCount: number
  relayPins: number[]
  firmwareVersion?: string
}

interface ReadingsPayload {
  apiKey: string
  isBatchSync?: boolean
  readings: ReadingData[]
  deviceInfo?: DeviceInfo
  relayStates?: RelayState[]
}

interface RelayCommand {
  id: number
  targetState: boolean
}

// Helper to get day profile ID
function getDayProfileId(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Helper to get start of day
function getStartOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

// Check thresholds and create alarms if needed
async function checkThresholds(
  deviceId: string,
  userId: string,
  reading: ReadingData,
  thresholds: { minVoltage: number; maxVoltage: number; maxCurrent: number },
  timestamp: Date
): Promise<void> {
  const alarms: {
    alarmType: AlarmType
    severityCode: SeverityCode
    message: string
    value: number
    threshold: number
  }[] = []

  // Over voltage
  if (reading.maxAvgVoltage > thresholds.maxVoltage) {
    const percentOver = ((reading.maxAvgVoltage - thresholds.maxVoltage) / thresholds.maxVoltage) * 100
    alarms.push({
      alarmType: AlarmType.OVER_VOLTAGE,
      severityCode: percentOver >= 20 ? SeverityCode.EMERGENCY : percentOver >= 10 ? SeverityCode.CRITICAL : SeverityCode.WARNING,
      message: `Voltage exceeded maximum: ${reading.maxAvgVoltage.toFixed(1)}V (limit: ${thresholds.maxVoltage}V)`,
      value: reading.maxAvgVoltage,
      threshold: thresholds.maxVoltage,
    })
  }

  // Under voltage
  if (reading.minAvgVoltage < thresholds.minVoltage && reading.minAvgVoltage > 0) {
    const percentUnder = ((thresholds.minVoltage - reading.minAvgVoltage) / thresholds.minVoltage) * 100
    alarms.push({
      alarmType: AlarmType.UNDER_VOLTAGE,
      severityCode: percentUnder >= 20 ? SeverityCode.EMERGENCY : percentUnder >= 10 ? SeverityCode.CRITICAL : SeverityCode.WARNING,
      message: `Voltage below minimum: ${reading.minAvgVoltage.toFixed(1)}V (limit: ${thresholds.minVoltage}V)`,
      value: reading.minAvgVoltage,
      threshold: thresholds.minVoltage,
    })
  }

  // Over current
  if (reading.maxAvgCurrent > thresholds.maxCurrent) {
    const percentOver = ((reading.maxAvgCurrent - thresholds.maxCurrent) / thresholds.maxCurrent) * 100
    alarms.push({
      alarmType: AlarmType.OVER_CURRENT,
      severityCode: percentOver >= 20 ? SeverityCode.EMERGENCY : percentOver >= 10 ? SeverityCode.CRITICAL : SeverityCode.WARNING,
      message: `Current exceeded maximum: ${reading.maxAvgCurrent.toFixed(2)}A (limit: ${thresholds.maxCurrent}A)`,
      value: reading.maxAvgCurrent,
      threshold: thresholds.maxCurrent,
    })
  }

  // Create alarms in database
  for (const alarm of alarms) {
    await Alarm.create({
      deviceId,
      userId,
      datetime: timestamp,
      ...alarm,
    })
  }
}

// POST - Receive readings from ESP32
export async function POST(request: NextRequest) {
  const serverTime = new Date()

  try {
    const body: ReadingsPayload = await request.json()

    if (!body.apiKey || !body.readings || !Array.isArray(body.readings)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          serverTime: serverTime.toISOString(),
        },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find device by API key
    const device = await Device.findOne({ apiKey: body.apiKey })

    if (!device) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid API key",
          serverTime: serverTime.toISOString(),
        },
        { status: 401 }
      )
    }

    // Update device last seen and status
    device.lastSeen = serverTime
    device.status = DeviceStatus.ACTIVE

    // Update device info if provided (relay count, pins, firmware)
    if (body.deviceInfo) {
      device.relayInfo = device.relayInfo || {
        userConfiguredRelays: [],
        deviceReportedCount: 0,
        deviceReportedPins: [],
        lastVerified: null,
      }
      device.relayInfo.deviceReportedCount = body.deviceInfo.relayCount || 0
      device.relayInfo.deviceReportedPins = body.deviceInfo.relayPins || []
      device.relayInfo.lastVerified = serverTime

      // Update firmware version if provided
      if (body.deviceInfo.firmwareVersion) {
        device.firmwareVersion = body.deviceInfo.firmwareVersion
      }

      // Update verified status for configured relays
      if (device.relayInfo.userConfiguredRelays) {
        device.relayInfo.userConfiguredRelays = device.relayInfo.userConfiguredRelays.map((relay, index) => ({
          ...relay,
          verified: (index + 1) <= device.relayInfo.deviceReportedCount,
          gpioPin: device.relayInfo.deviceReportedPins[index] || relay.gpioPin,
        }))
      }
    }

    // Update relay actual states if provided
    if (body.relayStates && Array.isArray(body.relayStates)) {
      for (const relayState of body.relayStates) {
        const relayIndex = device.relayInfo?.userConfiguredRelays?.findIndex(r => r.id === relayState.id)
        if (relayIndex !== undefined && relayIndex >= 0) {
          device.relayInfo.userConfiguredRelays[relayIndex].actualState = relayState.state
          device.relayInfo.userConfiguredRelays[relayIndex].gpioPin = relayState.pin
        }
      }
    }

    await device.save()

    const errors: string[] = []
    let processedCount = 0
    let currentDayProfileId = getDayProfileId(serverTime)

    // Process each reading
    for (const reading of body.readings) {
      try {
        // Calculate actual timestamp
        const actualTimestamp = subSeconds(serverTime, reading.offsetSeconds || 0)
        const dayProfileId = getDayProfileId(actualTimestamp)
        const dayStart = getStartOfDay(actualTimestamp)

        // Find or create daily load profile
        let profile = await DailyLoadProfile.findOne({
          deviceId: device.deviceId,
          dayProfileId,
        })

        if (!profile) {
          profile = new DailyLoadProfile({
            deviceId: device.deviceId,
            date: dayStart,
            dayProfileId,
            entries: [],
            totalPowerConsumedWh: 0,
            entryCount: 0,
            isComplete: false,
            lastEntryNo: 0,
          })
        }

        // Create entry
        const entry = {
          entryNo: reading.entryNo,
          timestamp: actualTimestamp,
          accumulatedAvgPower: reading.accumulatedAvgPower,
          maxAvgCurrent: reading.maxAvgCurrent,
          maxAvgVoltage: reading.maxAvgVoltage,
          minAvgVoltage: reading.minAvgVoltage,
          avgCurrent: reading.avgCurrent,
          avgVoltage: reading.avgVoltage,
        }

        // Check if entry already exists
        const existingIndex = profile.entries.findIndex((e) => e.entryNo === reading.entryNo)

        if (existingIndex >= 0) {
          profile.entries[existingIndex] = entry
        } else {
          profile.entries.push(entry)
        }

        // Recalculate totals
        profile.entryCount = profile.entries.length
        profile.totalPowerConsumedWh = profile.entries.reduce((sum, e) => sum + e.accumulatedAvgPower, 0)
        profile.lastEntryNo = Math.max(profile.lastEntryNo, ...profile.entries.map((e) => e.entryNo))

        if (profile.entryCount >= 288) {
          profile.isComplete = true
        }

        await profile.save()

        // Check thresholds and create alarms
        await checkThresholds(device.deviceId, device.userId.toString(), reading, device.thresholds, actualTimestamp)

        processedCount++
        currentDayProfileId = dayProfileId
      } catch (err) {
        errors.push(`Entry ${reading.entryNo}: ${err instanceof Error ? err.message : "Failed"}`)
      }
    }

    // Get next expected entry number
    const currentProfile = await DailyLoadProfile.findOne({
      deviceId: device.deviceId,
      dayProfileId: currentDayProfileId,
    })
    const nextEntryNo = (currentProfile?.lastEntryNo || 0) + 1

    // Build relay commands - where target state differs from actual state
    const relayCommands: RelayCommand[] = []
    if (device.relayInfo?.userConfiguredRelays) {
      for (const relay of device.relayInfo.userConfiguredRelays) {
        if (relay.verified && relay.targetState !== relay.actualState) {
          relayCommands.push({
            id: relay.id,
            targetState: relay.targetState,
          })
        }
      }
    }

    return NextResponse.json({
      success: processedCount > 0,
      serverTime: serverTime.toISOString(),
      currentDayProfileId,
      nextEntryNo,
      readingsProcessed: processedCount,
      relayCommands: relayCommands.length > 0 ? relayCommands : undefined,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[API] Readings POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        serverTime: serverTime.toISOString(),
      },
      { status: 500 }
    )
  }
}

// GET - Get sync status
export async function GET(request: NextRequest) {
  const serverTime = new Date()

  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key required" }, { status: 400 })
    }

    await connectToDatabase()

    const device = await Device.findOne({ apiKey })

    if (!device) {
      return NextResponse.json({ success: false, error: "Invalid API key" }, { status: 401 })
    }

    const currentDayProfileId = getDayProfileId(serverTime)
    const profile = await DailyLoadProfile.findOne({
      deviceId: device.deviceId,
      dayProfileId: currentDayProfileId,
    })

    const lastReceivedEntryNo = profile?.lastEntryNo ?? 0
    const expectedNextEntryNo = lastReceivedEntryNo + 1

    // Calculate expected entries based on current time
    const hours = serverTime.getHours()
    const minutes = serverTime.getMinutes()
    const expectedEntries = Math.floor((hours * 60 + minutes) / 5)

    // Find missing entries
    const receivedEntries = new Set(profile?.entries.map((e) => e.entryNo) ?? [])
    const missingEntries: number[] = []
    for (let i = 1; i <= expectedEntries; i++) {
      if (!receivedEntries.has(i)) {
        missingEntries.push(i)
      }
    }

    // Build relay commands for this sync request too
    const relayCommands: RelayCommand[] = []
    if (device.relayInfo?.userConfiguredRelays) {
      for (const relay of device.relayInfo.userConfiguredRelays) {
        if (relay.verified && relay.targetState !== relay.actualState) {
          relayCommands.push({
            id: relay.id,
            targetState: relay.targetState,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      serverTime: serverTime.toISOString(),
      currentDayProfileId,
      lastReceivedEntryNo,
      expectedNextEntryNo,
      missingEntries: missingEntries.slice(0, 50), // Limit to 50
      relayCommands: relayCommands.length > 0 ? relayCommands : undefined,
    })
  } catch (error) {
    console.error("[API] Readings GET error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        serverTime: serverTime.toISOString(),
      },
      { status: 500 }
    )
  }
}
