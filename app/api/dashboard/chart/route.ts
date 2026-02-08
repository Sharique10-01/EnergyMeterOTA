/**
 * Dashboard Chart Data API
 * GET /api/dashboard/chart - Get chart data for consumption visualization
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { Device, DailyLoadProfile, BillingProfile } from "@/lib/models"
import connectToDatabase from "@/lib/mongodb"
import { Types } from "mongoose"
import { format, subDays } from "date-fns"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")
    const chartType = searchParams.get("type") || "realtime" // realtime, daily, weekly, monthly
    const days = parseInt(searchParams.get("days") || "7")

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID required" }, { status: 400 })
    }

    await connectToDatabase()

    // Verify ownership
    const device = await Device.findOne({
      deviceId,
      userId: new Types.ObjectId(session.userId),
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    let chartData: unknown[] = []

    switch (chartType) {
      case "realtime": {
        // Get today's 5-minute interval data
        const todayProfileId = format(new Date(), "yyyy-MM-dd")
        const todayProfile = await DailyLoadProfile.findOne({ deviceId, dayProfileId: todayProfileId })

        chartData =
          todayProfile?.entries.map((entry) => ({
            time: format(new Date(entry.timestamp), "HH:mm"),
            entryNo: entry.entryNo,
            power: entry.accumulatedAvgPower,
            voltage: entry.avgVoltage || (entry.maxAvgVoltage + entry.minAvgVoltage) / 2,
            current: entry.avgCurrent || entry.maxAvgCurrent,
            maxVoltage: entry.maxAvgVoltage,
            minVoltage: entry.minAvgVoltage,
          })) || []
        break
      }

      case "daily": {
        // Get hourly aggregation for a specific day
        const dateParam = searchParams.get("date") || format(new Date(), "yyyy-MM-dd")
        const dayProfile = await DailyLoadProfile.findOne({ deviceId, dayProfileId: dateParam })

        if (dayProfile) {
          // Group entries by hour
          const hourlyData: Record<
            number,
            { power: number; count: number; maxV: number; minV: number; maxI: number }
          > = {}

          for (const entry of dayProfile.entries) {
            const hour = new Date(entry.timestamp).getHours()
            if (!hourlyData[hour]) {
              hourlyData[hour] = { power: 0, count: 0, maxV: 0, minV: Infinity, maxI: 0 }
            }
            hourlyData[hour].power += entry.accumulatedAvgPower
            hourlyData[hour].count++
            hourlyData[hour].maxV = Math.max(hourlyData[hour].maxV, entry.maxAvgVoltage)
            hourlyData[hour].minV = Math.min(hourlyData[hour].minV, entry.minAvgVoltage)
            hourlyData[hour].maxI = Math.max(hourlyData[hour].maxI, entry.maxAvgCurrent)
          }

          chartData = Object.entries(hourlyData)
            .map(([hour, data]) => ({
              hour: parseInt(hour),
              label: `${hour.padStart(2, "0")}:00`,
              power: data.power,
              avgPower: data.power / data.count,
              maxVoltage: data.maxV,
              minVoltage: data.minV === Infinity ? 0 : data.minV,
              maxCurrent: data.maxI,
            }))
            .sort((a, b) => a.hour - b.hour)
        }
        break
      }

      case "weekly":
      case "monthly": {
        // Get daily consumption for past days
        const daysToFetch = chartType === "weekly" ? 7 : 30
        const startDate = subDays(new Date(), daysToFetch)

        const billings = await BillingProfile.find({
          deviceId,
          date: { $gte: startDate },
        }).sort({ date: 1 })

        chartData = billings.map((b) => ({
          date: b.dateString,
          consumptionKwh: b.powerConsumedKwh,
          maxVoltage: b.maxVoltage,
          minVoltage: b.minVoltage,
          maxCurrent: b.maxCurrent,
          avgVoltage: b.avgVoltage,
          avgCurrent: b.avgCurrent,
        }))
        break
      }

      default:
        chartData = []
    }

    return NextResponse.json({
      success: true,
      chartType,
      data: chartData,
    })
  } catch (error) {
    console.error("[API] Chart data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
