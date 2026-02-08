/**
 * Dashboard Alarms API
 * GET /api/dashboard/alarms - Get alarms for a device
 * POST /api/dashboard/alarms - Acknowledge an alarm
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { Device, Alarm } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { Types } from "mongoose"

// GET - Get alarms
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const unacknowledgedOnly = searchParams.get("unacknowledged") === "true"

    await connectToDatabase()

    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(session.userId),
    }

    if (deviceId) {
      // Verify ownership
      const device = await Device.findOne({
        deviceId,
        userId: new Types.ObjectId(session.userId),
      })

      if (!device) {
        return NextResponse.json({ error: "Device not found" }, { status: 404 })
      }

      query.deviceId = deviceId
    }

    if (unacknowledgedOnly) {
      query.acknowledged = false
    }

    const alarms = await Alarm.find(query).sort({ datetime: -1 }).limit(limit)

    // Get stats
    const total = await Alarm.countDocuments(query)
    const unacknowledged = await Alarm.countDocuments({ ...query, acknowledged: false })

    return NextResponse.json({
      success: true,
      alarms: alarms.map((a) => ({
        id: a._id.toString(),
        deviceId: a.deviceId,
        datetime: a.datetime,
        alarmType: a.alarmType,
        severityCode: a.severityCode,
        message: a.message,
        value: a.value,
        threshold: a.threshold,
        acknowledged: a.acknowledged,
        acknowledgedAt: a.acknowledgedAt,
      })),
      stats: { total, unacknowledged },
    })
  } catch (error) {
    console.error("[API] Get alarms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Acknowledge alarm
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { alarmId, acknowledgeAll, deviceId } = await request.json()

    await connectToDatabase()

    if (acknowledgeAll && deviceId) {
      // Verify ownership
      const device = await Device.findOne({
        deviceId,
        userId: new Types.ObjectId(session.userId),
      })

      if (!device) {
        return NextResponse.json({ error: "Device not found" }, { status: 404 })
      }

      // Acknowledge all alarms for device
      const result = await Alarm.updateMany(
        { deviceId, acknowledged: false },
        {
          $set: {
            acknowledged: true,
            acknowledgedAt: new Date(),
            acknowledgedBy: new Types.ObjectId(session.userId),
          },
        }
      )

      return NextResponse.json({
        success: true,
        acknowledgedCount: result.modifiedCount,
      })
    }

    if (!alarmId) {
      return NextResponse.json({ error: "Alarm ID required" }, { status: 400 })
    }

    // Verify the alarm belongs to user's device
    const alarm = await Alarm.findById(alarmId)

    if (!alarm) {
      return NextResponse.json({ error: "Alarm not found" }, { status: 404 })
    }

    const device = await Device.findOne({
      deviceId: alarm.deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (!device) {
      return NextResponse.json({ error: "Alarm not found" }, { status: 404 })
    }

    // Acknowledge
    alarm.acknowledged = true
    alarm.acknowledgedAt = new Date()
    alarm.acknowledgedBy = new Types.ObjectId(session.userId)
    await alarm.save()

    return NextResponse.json({
      success: true,
      alarm: {
        id: alarm._id.toString(),
        acknowledged: alarm.acknowledged,
        acknowledgedAt: alarm.acknowledgedAt,
      },
    })
  } catch (error) {
    console.error("[API] Acknowledge alarm error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
