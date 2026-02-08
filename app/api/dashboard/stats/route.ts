/**
 * Dashboard Stats API
 * GET /api/dashboard/stats - Get dashboard statistics for a device
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { Device, DailyLoadProfile, BillingProfile, MonthlyProfile, Alarm } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { Types } from "mongoose"
import { format, subDays, startOfMonth } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

    await connectToDatabase()

    // Verify device ownership
    const device = await Device.findOne({
      deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const now = new Date()
    const todayProfileId = format(now, "yyyy-MM-dd")
    const yesterdayProfileId = format(subDays(now, 1), "yyyy-MM-dd")
    const thisMonthString = format(now, "yyyy-MM")
    const lastMonthString = format(subDays(startOfMonth(now), 1), "yyyy-MM")

    // Get today's data from load profile
    const todayProfile = await DailyLoadProfile.findOne({ deviceId, dayProfileId: todayProfileId })

    // Get yesterday's billing
    const yesterdayBilling = await BillingProfile.findOne({ deviceId, dateString: yesterdayProfileId })

    // Get this month's profile
    const thisMonthProfile = await MonthlyProfile.findOne({ deviceId, monthString: thisMonthString })

    // Get last month's profile
    const lastMonthProfile = await MonthlyProfile.findOne({ deviceId, monthString: lastMonthString })

    // Get unacknowledged alarm count
    const activeAlarms = await Alarm.countDocuments({
      deviceId,
      acknowledged: false,
    })

    // Get latest entry for current readings
    const latestEntry = todayProfile?.entries[todayProfile.entries.length - 1]

    const stats = {
      device: {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        status: device.status,
        lastSeen: device.lastSeen,
        thresholds: device.thresholds,
        relayInfo: device.relayInfo,
      },
      consumption: {
        today: {
          consumptionKwh: (todayProfile?.totalPowerConsumedWh || 0) / 1000,
          entryCount: todayProfile?.entryCount || 0,
        },
        yesterday: {
          consumptionKwh: yesterdayBilling?.powerConsumedKwh || 0,
          entryCount: yesterdayBilling?.entryCount || 0,
        },
        thisMonth: {
          consumptionKwh:
            (thisMonthProfile?.totalConsumptionKwh || 0) + (todayProfile?.totalPowerConsumedWh || 0) / 1000,
          daysRecorded: (thisMonthProfile?.daysRecorded || 0) + (todayProfile ? 1 : 0),
        },
        lastMonth: {
          consumptionKwh: lastMonthProfile?.totalConsumptionKwh || 0,
          daysRecorded: lastMonthProfile?.daysRecorded || 0,
        },
      },
      current: {
        voltage: latestEntry?.avgVoltage || latestEntry?.maxAvgVoltage || 0,
        current: latestEntry?.avgCurrent || latestEntry?.maxAvgCurrent || 0,
        power: latestEntry?.accumulatedAvgPower || 0,
        lastUpdated: latestEntry?.timestamp || null,
      },
      activeAlarms,
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("[API] Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
