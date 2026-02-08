/**
 * Debug API - List all devices (DEVELOPMENT ONLY)
 * GET /api/debug/devices
 */

import { NextResponse } from "next/server"
import { Device } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    await connectToDatabase()

    const devices = await Device.find({}).lean()

    return NextResponse.json({
      count: devices.length,
      devices: devices.map(d => ({
        deviceId: d.deviceId,
        name: d.deviceName,
        apiKey: d.apiKey,
        status: d.status,
        lastSeen: d.lastSeen,
        relayInfo: d.relayInfo
      }))
    })

  } catch (error) {
    console.error("[DEBUG] Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
