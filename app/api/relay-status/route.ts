/**
 * Relay Status API - Lightweight endpoint for ESP32 polling
 * GET /api/relay-status?apiKey=xxx
 *
 * Returns only pending relay commands for fast polling (every 30 seconds)
 * Minimal payload, quick response for responsive relay control
 */

import { type NextRequest, NextResponse } from "next/server"
import { Device } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { DeviceStatus } from "@/lib/enums"

interface RelayCommand {
  id: number
  targetState: boolean
}

// GET - Get pending relay commands (lightweight)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required", commands: [] },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Fetch device - include apiKey to prevent pre-save hook from regenerating it
    const device = await Device.findOne(
      { apiKey },
      { relayInfo: 1, deviceId: 1, status: 1, lastSeen: 1, apiKey: 1 }
    )

    if (!device) {
      return NextResponse.json(
        { error: "Invalid API key", commands: [] },
        { status: 401 }
      )
    }

    // Update last seen (lightweight heartbeat)
    device.lastSeen = new Date()
    if (device.status !== DeviceStatus.ACTIVE) {
      device.status = DeviceStatus.ACTIVE
    }

    // Build relay commands - where target state differs from actual state
    const commands: RelayCommand[] = []

    if (device.relayInfo?.userConfiguredRelays) {
      for (const relay of device.relayInfo.userConfiguredRelays) {
        // Only send commands for verified relays with state mismatch
        if (relay.verified && relay.targetState !== relay.actualState) {
          commands.push({
            id: relay.id,
            targetState: relay.targetState,
          })
        }
      }
    }

    // Save last seen update
    await device.save()

    // Return minimal response
    return NextResponse.json({ commands })

  } catch (error) {
    console.error("[API] Relay status error:", error)
    return NextResponse.json(
      { error: "Internal server error", commands: [] },
      { status: 500 }
    )
  }
}

// POST - Quick relay state acknowledgment from ESP32
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, relayStates } = body

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 })
    }

    if (!relayStates || !Array.isArray(relayStates)) {
      return NextResponse.json({ error: "relayStates required" }, { status: 400 })
    }

    await connectToDatabase()

    const device = await Device.findOne({ apiKey })

    if (!device) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Update actual relay states from ESP32
    let updatedCount = 0
    for (const relayState of relayStates) {
      const relayIndex = device.relayInfo?.userConfiguredRelays?.findIndex(
        (r: { id: number }) => r.id === relayState.id
      )

      if (relayIndex !== undefined && relayIndex >= 0) {
        device.relayInfo.userConfiguredRelays[relayIndex].actualState = relayState.state
        updatedCount++
      }
    }

    device.lastSeen = new Date()
    await device.save()

    return NextResponse.json({
      success: true,
      updated: updatedCount,
    })

  } catch (error) {
    console.error("[API] Relay state update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
