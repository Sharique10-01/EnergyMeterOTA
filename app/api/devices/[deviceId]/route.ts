/**
 * Single Device API
 * GET /api/devices/[deviceId] - Get device details
 * PUT /api/devices/[deviceId] - Update device
 * DELETE /api/devices/[deviceId] - Delete device
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { Device } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { Types } from "mongoose"

type RouteContext = {
  params: Promise<{ deviceId: string }>
}

// Get device details
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
      device: {
        id: device._id.toString(),
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        firmwareVersion: device.firmwareVersion,
        status: device.status,
        apiKey: device.apiKey,
        lastSeen: device.lastSeen,
        thresholds: device.thresholds,
        relayInfo: device.relayInfo,
        location: device.location,
        createdAt: device.createdAt,
      },
    })
  } catch (error) {
    console.error("[API] Get device error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update device
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { deviceId } = await context.params
    const body = await request.json()

    await connectToDatabase()

    // Build update object
    const updateData: Record<string, unknown> = {}

    if (body.deviceName !== undefined) updateData.deviceName = body.deviceName
    if (body.location !== undefined) updateData.location = body.location
    if (body.status !== undefined) updateData.status = body.status

    // Update thresholds if provided
    if (body.thresholds) {
      if (body.thresholds.minVoltage !== undefined) {
        updateData["thresholds.minVoltage"] = body.thresholds.minVoltage
      }
      if (body.thresholds.maxVoltage !== undefined) {
        updateData["thresholds.maxVoltage"] = body.thresholds.maxVoltage
      }
      if (body.thresholds.maxCurrent !== undefined) {
        updateData["thresholds.maxCurrent"] = body.thresholds.maxCurrent
      }
    }

    const device = await Device.findOneAndUpdate(
      { deviceId, userId: new Types.ObjectId(session.userId) },
      { $set: updateData },
      { new: true }
    )

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      device: {
        id: device._id.toString(),
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        firmwareVersion: device.firmwareVersion,
        status: device.status,
        apiKey: device.apiKey,
        lastSeen: device.lastSeen,
        thresholds: device.thresholds,
        relayInfo: device.relayInfo,
        location: device.location,
        createdAt: device.createdAt,
      },
    })
  } catch (error) {
    console.error("[API] Update device error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete device
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { deviceId } = await context.params

    await connectToDatabase()

    const result = await Device.deleteOne({
      deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Delete device error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
