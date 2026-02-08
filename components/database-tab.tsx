"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeviceSelector } from "@/components/device-selector"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Download,
  Database,
  TrendingUp,
  Zap,
  FileJson,
  FileText,
  RefreshCw,
} from "lucide-react"
import { format, subDays } from "date-fns"

interface DailyData {
  date: string
  consumptionKwh: number
  maxVoltage: number
  minVoltage: number
  maxCurrent: number
  avgVoltage: number
  avgCurrent: number
}

interface HourlyData {
  hour: number
  label: string
  power: number
  avgPower: number
  maxVoltage: number
  minVoltage: number
  maxCurrent: number
}

interface Alarm {
  id: string
  deviceId: string
  datetime: string
  alarmType: string
  severityCode: number
  message: string
  value: number
  threshold: number
  acknowledged: boolean
  acknowledgedAt: string | null
}

const chartConfig = {
  consumptionKwh: {
    label: "Consumption (kWh)",
    color: "hsl(var(--chart-1))",
  },
  avgPower: {
    label: "Avg Power (W)",
    color: "hsl(var(--chart-2))",
  },
  maxVoltage: {
    label: "Max Voltage (V)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function DatabaseTab() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [chartView, setChartView] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [chartData, setChartData] = useState<DailyData[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"))

  const fetchData = useCallback(async () => {
    if (!selectedDevice) return

    setLoading(true)
    try {
      const [chartRes, hourlyRes, alarmsRes] = await Promise.all([
        fetch(`/api/dashboard/chart?deviceId=${selectedDevice}&type=${chartView}`),
        fetch(`/api/dashboard/chart?deviceId=${selectedDevice}&type=daily&date=${selectedDate}`),
        fetch(`/api/dashboard/alarms?deviceId=${selectedDevice}&limit=20`),
      ])

      const [chartDataRes, hourlyDataRes, alarmsData] = await Promise.all([
        chartRes.json(),
        hourlyRes.json(),
        alarmsRes.json(),
      ])

      if (chartDataRes.data) setChartData(chartDataRes.data)
      if (hourlyDataRes.data) setHourlyData(hourlyDataRes.data)
      if (alarmsData.alarms) setAlarms(alarmsData.alarms)
    } catch (error) {
      console.error("Failed to fetch database data:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedDevice, chartView, selectedDate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async (format: "json" | "csv") => {
    if (!selectedDevice || chartData.length === 0) return

    let content: string
    let filename: string
    let mimeType: string

    if (format === "json") {
      content = JSON.stringify(chartData, null, 2)
      filename = `energy-data-${selectedDevice}-${chartView}.json`
      mimeType = "application/json"
    } else {
      const headers = Object.keys(chartData[0]).join(",")
      const rows = chartData.map((row) => Object.values(row).join(","))
      content = [headers, ...rows].join("\n")
      filename = `energy-data-${selectedDevice}-${chartView}.csv`
      mimeType = "text/csv"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalConsumption = chartData.reduce((sum, d) => sum + d.consumptionKwh, 0)
  const avgDailyConsumption = chartData.length > 0 ? totalConsumption / chartData.length : 0
  const maxConsumptionDay = chartData.reduce(
    (max, d) => (d.consumptionKwh > max.consumptionKwh ? d : max),
    { date: "-", consumptionKwh: 0 }
  )

  const getAlarmTypeBadge = (type: string) => {
    switch (type) {
      case "OVER_VOLTAGE":
        return <Badge className="bg-red-500/10 text-red-600">Over Voltage</Badge>
      case "UNDER_VOLTAGE":
        return <Badge className="bg-orange-500/10 text-orange-600">Under Voltage</Badge>
      case "OVER_CURRENT":
        return <Badge className="bg-yellow-500/10 text-yellow-700">Over Current</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Energy Data & Analytics</h2>
          <p className="text-muted-foreground">Historical consumption and billing data</p>
        </div>
        <div className="flex items-center gap-3">
          <DeviceSelector
            selectedDeviceId={selectedDevice}
            onDeviceSelect={setSelectedDevice}
          />
        </div>
      </div>

      {!selectedDevice ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Device Selected</p>
            <p className="text-sm text-muted-foreground">
              Select a device to view historical data
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
                <Zap className="size-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalConsumption.toFixed(2)} kWh</div>
                <p className="text-xs text-muted-foreground">
                  {chartView === "weekly" ? "Last 7 days" : "Last 30 days"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                <TrendingUp className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgDailyConsumption.toFixed(2)} kWh</div>
                <p className="text-xs text-muted-foreground">Average per day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
                <Calendar className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maxConsumptionDay.consumptionKwh.toFixed(2)} kWh</div>
                <p className="text-xs text-muted-foreground">{maxConsumptionDay.date}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="consumption" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="consumption">Consumption</TabsTrigger>
                <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
                <TabsTrigger value="alarms">Alarm History</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                  disabled={chartData.length === 0}
                >
                  <FileText className="size-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("json")}
                  disabled={chartData.length === 0}
                >
                  <FileJson className="size-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>

            <TabsContent value="consumption" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Daily Consumption</CardTitle>
                      <CardDescription>Power consumption over time</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={chartView === "weekly" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartView("weekly")}
                      >
                        7 Days
                      </Button>
                      <Button
                        variant={chartView === "monthly" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChartView("monthly")}
                      >
                        30 Days
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <RefreshCw className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return format(date, "MMM d")
                          }}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="consumptionKwh"
                          fill="var(--color-consumptionKwh)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      No consumption data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Records</CardTitle>
                  <CardDescription>Daily consumption breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Consumption</TableHead>
                        <TableHead className="text-right">Avg Voltage</TableHead>
                        <TableHead className="text-right">Max Current</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chartData.length > 0 ? (
                        chartData.slice(0, 10).map((row) => (
                          <TableRow key={row.date}>
                            <TableCell className="font-medium">{row.date}</TableCell>
                            <TableCell className="text-right">
                              {row.consumptionKwh.toFixed(3)} kWh
                            </TableCell>
                            <TableCell className="text-right">
                              {row.avgVoltage?.toFixed(1) || "-"} V
                            </TableCell>
                            <TableCell className="text-right">
                              {row.maxCurrent?.toFixed(2) || "-"} A
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Hourly Load Profile</CardTitle>
                      <CardDescription>Power distribution throughout the day</CardDescription>
                    </div>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-[350px] flex items-center justify-center">
                      <RefreshCw className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : hourlyData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                      <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="avgPower"
                          stroke="var(--color-avgPower)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                      No data available for {selectedDate}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alarms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Alarm History</CardTitle>
                  <CardDescription>Recent threshold violations and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alarms.length > 0 ? (
                        alarms.map((alarm) => (
                          <TableRow key={alarm.id}>
                            <TableCell className="font-medium">
                              {format(new Date(alarm.datetime), "MMM d, HH:mm")}
                            </TableCell>
                            <TableCell>{getAlarmTypeBadge(alarm.alarmType)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {alarm.message}
                            </TableCell>
                            <TableCell className="text-right">
                              {alarm.value.toFixed(2)} / {alarm.threshold}
                            </TableCell>
                            <TableCell>
                              {alarm.acknowledged ? (
                                <Badge variant="outline" className="text-green-600">
                                  Acknowledged
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Active</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No alarms recorded
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
