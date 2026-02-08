"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DeviceSelector } from "@/components/device-selector"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Zap, Activity, Gauge, AlertTriangle, RefreshCw, WifiOff, Bell, Power } from "lucide-react"
import { RelayControl } from "@/components/relay-control"
import { format } from "date-fns"

interface RelayConfig {
  id: number
  name: string
  gpioPin: number
  targetState: boolean
  actualState: boolean
  verified: boolean
  lastStateChange: string | null
}

interface RelayInfo {
  userConfiguredRelays: RelayConfig[]
  deviceReportedCount: number
  deviceReportedPins: number[]
  lastVerified: string | null
}

interface Stats {
  device: {
    deviceId: string
    deviceName: string
    status: string
    lastSeen: string | null
    thresholds: {
      minVoltage: number
      maxVoltage: number
      maxCurrent: number
    }
    relayInfo?: RelayInfo
  }
  consumption: {
    today: { consumptionKwh: number; entryCount: number }
    yesterday: { consumptionKwh: number; entryCount: number }
    thisMonth: { consumptionKwh: number; daysRecorded: number }
    lastMonth: { consumptionKwh: number; daysRecorded: number }
  }
  current: {
    voltage: number
    current: number
    power: number
    lastUpdated: string | null
  }
  activeAlarms: number
}

interface ChartDataPoint {
  time: string
  entryNo: number
  power: number
  voltage: number
  current: number
}

interface Alarm {
  id: string
  deviceId: string
  datetime: string
  alarmType: string
  severityCode: number
  message: string
  acknowledged: boolean
}

const chartConfig = {
  voltage: {
    label: "Voltage (V)",
    color: "hsl(var(--chart-1))",
  },
  current: {
    label: "Current (A)",
    color: "hsl(var(--chart-2))",
  },
  power: {
    label: "Power (W)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function MonitoringTab() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    if (!selectedDevice) return

    setLoading(true)
    try {
      const [statsRes, chartRes, alarmsRes] = await Promise.all([
        fetch(`/api/dashboard/stats?deviceId=${selectedDevice}`),
        fetch(`/api/dashboard/chart?deviceId=${selectedDevice}&type=realtime`),
        fetch(`/api/dashboard/alarms?deviceId=${selectedDevice}&limit=5&unacknowledged=true`),
      ])

      const [statsData, chartDataRes, alarmsData] = await Promise.all([
        statsRes.json(),
        chartRes.json(),
        alarmsRes.json(),
      ])

      if (statsData.stats) setStats(statsData.stats)
      if (chartDataRes.data) setChartData(chartDataRes.data)
      if (alarmsData.alarms) setAlarms(alarmsData.alarms)
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedDevice])

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
      case "inactive":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Inactive</Badge>
      case "offline":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Offline</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: number) => {
    switch (severity) {
      case 4:
        return <Badge className="bg-red-500 text-white">Emergency</Badge>
      case 3:
        return <Badge className="bg-orange-500 text-white">Critical</Badge>
      case 2:
        return <Badge className="bg-yellow-500 text-black">Warning</Badge>
      default:
        return <Badge className="bg-blue-500 text-white">Info</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with device selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Real-Time Monitoring</h2>
          <p className="text-muted-foreground">Live power metrics and status</p>
        </div>
        <div className="flex items-center gap-3">
          <DeviceSelector
            selectedDeviceId={selectedDevice}
            onDeviceSelect={setSelectedDevice}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing || !selectedDevice}
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {!selectedDevice ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WifiOff className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Device Selected</p>
            <p className="text-sm text-muted-foreground">
              Select a device to view real-time monitoring data
            </p>
          </CardContent>
        </Card>
      ) : loading && !stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Voltage</CardTitle>
                <Zap className="size-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.current.voltage.toFixed(1)} V</div>
                <p className="text-xs text-muted-foreground">
                  Range: {stats.device.thresholds.minVoltage}V - {stats.device.thresholds.maxVoltage}V
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current</CardTitle>
                <Activity className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.current.current.toFixed(2)} A</div>
                <p className="text-xs text-muted-foreground">
                  Max: {stats.device.thresholds.maxCurrent}A
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Power</CardTitle>
                <Gauge className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.current.power.toFixed(1)} W</div>
                <p className="text-xs text-muted-foreground">
                  Today: {stats.consumption.today.consumptionKwh.toFixed(3)} kWh
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Device Status</CardTitle>
                <AlertTriangle className={`size-4 ${stats.activeAlarms > 0 ? "text-red-500" : "text-green-500"}`} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusBadge(stats.device.status)}
                  {stats.activeAlarms > 0 && (
                    <Badge variant="destructive">{stats.activeAlarms} alarms</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.device.lastSeen
                    ? `Last seen: ${format(new Date(stats.device.lastSeen), "HH:mm:ss")}`
                    : "Never connected"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Relay Controls (Compact) */}
          {stats.device.relayInfo && stats.device.relayInfo.userConfiguredRelays.length > 0 ? (
            <RelayControl
              deviceId={selectedDevice}
              relayInfo={stats.device.relayInfo}
              onRelayUpdate={fetchData}
              compact
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Power className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Relay Controls</p>
                    <p className="text-xs text-muted-foreground">
                      Configure relays in Settings to control them here
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Not configured</Badge>
              </CardContent>
            </Card>
          )}

          {/* Chart and Alarms */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Real-time Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Today's Load Profile</CardTitle>
                <CardDescription>
                  5-minute interval readings ({chartData.length} entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="voltage"
                        orientation="left"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="power"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={["auto", "auto"]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        yAxisId="voltage"
                        type="monotone"
                        dataKey="voltage"
                        stroke="var(--color-voltage)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="power"
                        type="monotone"
                        dataKey="power"
                        stroke="var(--color-power)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available for today
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Alarms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="size-4" />
                  Active Alarms
                </CardTitle>
                <CardDescription>
                  {alarms.length > 0 ? `${alarms.length} unacknowledged` : "No active alarms"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alarms.length > 0 ? (
                  <div className="space-y-3">
                    {alarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          {getSeverityBadge(alarm.severityCode)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(alarm.datetime), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm">{alarm.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-green-500/10 p-3 mb-3">
                      <AlertTriangle className="size-6 text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All clear! No active alarms.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Consumption Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.consumption.today.consumptionKwh.toFixed(3)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.consumption.today.entryCount} readings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Yesterday</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.consumption.yesterday.consumptionKwh.toFixed(3)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.consumption.yesterday.entryCount} readings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.consumption.thisMonth.consumptionKwh.toFixed(2)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.consumption.thisMonth.daysRecorded} days recorded
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {stats.consumption.lastMonth.consumptionKwh.toFixed(2)} kWh
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.consumption.lastMonth.daysRecorded} days recorded
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
