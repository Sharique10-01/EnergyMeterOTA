/**
 * Device Relay Control API
 * GET /api/devices/[deviceId]/relays - Get relay configuration
 * POST /api/devices/[deviceId]/relays - Configure relays (add/update names)
 * PUT /api/devices/[deviceId]/relays - Toggle relay state
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { Device } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { Types } from "mongoose"

type RouteContext = {
  params: Promise<{ deviceId: string }>
}

// GET - Get relay configuration
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { deviceId } = await context.params

    await connectToDatabase()

    const device = await Device.findOne({
      deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      relayInfo: device.relayInfo,
    })
  } catch (error) {
    console.error("[API] Get relays error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Configure relays (add/update relay names and count)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { deviceId } = await context.params
    const { relays } = await request.json()

    // relays should be array: [{ id: 1, name: "Bedroom Light" }, ...]
    if (!Array.isArray(relays)) {
      return NextResponse.json({ error: "Relays must be an array" }, { status: 400 })
    }

    await connectToDatabase()

    const device = await Device.findOne({
      deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Build relay configuration
    const userConfiguredRelays = relays.map((relay: { id: number; name: string }, index: number) => {
      const existingRelay = device.relayInfo?.userConfiguredRelays?.find(r => r.id === relay.id)
      const deviceReportedPins = device.relayInfo?.deviceReportedPins || []
      const deviceReportedCount = device.relayInfo?.deviceReportedCount || 0

      return {
        id: relay.id || index + 1,
        name: relay.name || `Relay ${index + 1}`,
        gpioPin: deviceReportedPins[index] || 0,
        targetState: existingRelay?.targetState || false,
        actualState: existingRelay?.actualState || false,
        verified: (index + 1) <= deviceReportedCount,
        lastStateChange: existingRelay?.lastStateChange || null,
      }
    })

    device.relayInfo = {
      ...device.relayInfo,
      userConfiguredRelays,
    }

    await device.save()

    return NextResponse.json({
      success: true,
      relayInfo: device.relayInfo,
      message: `Configured ${relays.length} relay(s)`,
    })
  } catch (error) {
    console.error("[API] Configure relays error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Toggle relay state (set target state)
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { deviceId } = await context.params
    const { relayId, targetState } = await request.json()

    if (typeof relayId !== "number" || typeof targetState !== "boolean") {
      return NextResponse.json({ error: "relayId and targetState required" }, { status: 400 })
    }

    await connectToDatabase()

    const device = await Device.findOne({
      deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Find and update the relay
    const relayIndex = device.relayInfo?.userConfiguredRelays?.findIndex(r => r.id === relayId)

    if (relayIndex === undefined || relayIndex === -1) {
      return NextResponse.json({ error: "Relay not found" }, { status: 404 })
    }

    device.relayInfo.userConfiguredRelays[relayIndex].targetState = targetState
    device.relayInfo.userConfiguredRelays[relayIndex].lastStateChange = new Date()

    await device.save()

    return NextResponse.json({
      success: true,
      relay: device.relayInfo.userConfiguredRelays[relayIndex],
      message: `Relay ${relayId} target state set to ${targetState ? "ON" : "OFF"}`,
    })
  } catch (error) {
    console.error("[API] Toggle relay error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
