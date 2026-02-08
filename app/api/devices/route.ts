/**
 * Devices API
 * GET /api/devices - Get all devices for current user
 * POST /api/devices - Register a new device
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { Device } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { Types } from "mongoose"

// Get all devices for current user
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectToDatabase()

    const devices = await Device.find({ userId: new Types.ObjectId(session.userId) }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      devices: devices.map((d) => ({
        id: d._id.toString(),
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        deviceType: d.deviceType,
        firmwareVersion: d.firmwareVersion,
        status: d.status,
        apiKey: d.apiKey,
        lastSeen: d.lastSeen,
        thresholds: d.thresholds,
        relayInfo: d.relayInfo,
        location: d.location,
        createdAt: d.createdAt,
      })),
    })
  } catch (error) {
    console.error("[API] Get devices error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Register a new device
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { deviceId, deviceName, deviceType, location, thresholds } = await request.json()

    if (!deviceId || !deviceName) {
      return NextResponse.json({ error: "Device ID and name are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if device already exists
    const existing = await Device.findOne({ deviceId })
    if (existing) {
      return NextResponse.json({ error: "Device ID already registered" }, { status: 409 })
    }

    // Create new device
    const device = await Device.create({
      deviceId,
      userId: new Types.ObjectId(session.userId),
      deviceName,
      deviceType: deviceType || "single_phase",
      location: location || null,
      thresholds: thresholds || undefined,
    })

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("[API] Create device error:", error)

    const errorMessage = error instanceof Error ? error.message : ""
    if (errorMessage.includes("duplicate") || errorMessage.includes("E11000")) {
      return NextResponse.json({ error: "Device ID already registered" }, { status: 409 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
