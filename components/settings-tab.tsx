"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CopyButton } from "@/components/copy-button"
import {
  Plus,
  Settings2,
  Trash2,
  Cpu,
  Key,
  Zap,
  Activity,
  Save,
  RefreshCw,
  Edit,
  Power,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { RelayControl } from "@/components/relay-control"

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

interface Device {
  id: string
  deviceId: string
  deviceName: string
  deviceType: string
  firmwareVersion: string
  status: string
  apiKey: string
  lastSeen: string | null
  thresholds: {
    minVoltage: number
    maxVoltage: number
    maxCurrent: number
  }
  relayInfo?: RelayInfo
  location: string
  createdAt: string
}

export function SettingsTab() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedRelayDevice, setSelectedRelayDevice] = useState<string | null>(null)

  // Form state for adding device
  const [newDevice, setNewDevice] = useState({
    deviceId: "",
    deviceName: "",
    location: "",
  })

  // Form state for editing thresholds
  const [thresholds, setThresholds] = useState({
    minVoltage: 207,
    maxVoltage: 253,
    maxCurrent: 20,
  })

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices")
      const data = await res.json()
      if (data.devices) {
        setDevices(data.devices)
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error)
      toast.error("Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  // Auto-select first device for relay configuration
  useEffect(() => {
    if (devices.length > 0 && !selectedRelayDevice) {
      setSelectedRelayDevice(devices[0].deviceId)
    }
  }, [devices, selectedRelayDevice])

  const handleAddDevice = async () => {
    if (!newDevice.deviceId || !newDevice.deviceName) {
      toast.error("Device ID and name are required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      })

      const data = await res.json()

      if (res.ok && data.device) {
        toast.success("Device added successfully")
        setDevices([...devices, data.device])
        setAddDialogOpen(false)
        setNewDevice({ deviceId: "", deviceName: "", location: "" })
      } else {
        toast.error(data.error || "Failed to add device")
      }
    } catch (error) {
      console.error("Failed to add device:", error)
      toast.error("Failed to add device")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDevice = async () => {
    if (!selectedDevice) return

    setSaving(true)
    try {
      const res = await fetch(`/api/devices/${selectedDevice.deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName: selectedDevice.deviceName,
          location: selectedDevice.location,
          thresholds,
        }),
      })

      const data = await res.json()

      if (res.ok && data.device) {
        toast.success("Device updated successfully")
        setDevices(devices.map((d) => (d.deviceId === data.device.deviceId ? data.device : d)))
        setEditDialogOpen(false)
        setSelectedDevice(null)
      } else {
        toast.error(data.error || "Failed to update device")
      }
    } catch (error) {
      console.error("Failed to update device:", error)
      toast.error("Failed to update device")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Device deleted successfully")
        setDevices(devices.filter((d) => d.deviceId !== deviceId))
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to delete device")
      }
    } catch (error) {
      console.error("Failed to delete device:", error)
      toast.error("Failed to delete device")
    }
  }

  const openEditDialog = (device: Device) => {
    setSelectedDevice(device)
    setThresholds(device.thresholds)
    setEditDialogOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings & Configuration</h2>
          <p className="text-muted-foreground">Manage devices, thresholds, and API keys</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>
                Register a new ESP32 energy meter device. An API key will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input
                  id="deviceId"
                  placeholder="e.g., device_001"
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this device (must match ESP32 configuration)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., Main House Meter"
                  value={newDevice.deviceName}
                  onChange={(e) => setNewDevice({ ...newDevice, deviceName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Ground Floor"
                  value={newDevice.location}
                  onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDevice} disabled={saving}>
                {saving ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Plus className="size-4 mr-2" />}
                Add Device
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="size-5" />
            Registered Devices
          </CardTitle>
          <CardDescription>
            {devices.length} device{devices.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.deviceId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{device.deviceName}</p>
                        <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(device.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastSeen
                        ? format(new Date(device.lastSeen), "MMM d, HH:mm")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded max-w-[120px] truncate">
                          {device.apiKey}
                        </code>
                        <CopyButton text={device.apiKey} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(device)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Device</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{device.deviceName}"? This will also
                                delete all associated data including load profiles and alarms.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDevice(device.deviceId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Cpu className="size-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Devices Configured</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first device to start monitoring
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="size-4 mr-2" />
                Add Device
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device settings and alarm thresholds
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-6 py-4">
              {/* Device Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editDeviceName">Device Name</Label>
                  <Input
                    id="editDeviceName"
                    value={selectedDevice.deviceName}
                    onChange={(e) =>
                      setSelectedDevice({ ...selectedDevice, deviceName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Location</Label>
                  <Input
                    id="editLocation"
                    value={selectedDevice.location || ""}
                    onChange={(e) =>
                      setSelectedDevice({ ...selectedDevice, location: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Thresholds */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings2 className="size-4" />
                  Alarm Thresholds
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minVoltage" className="flex items-center gap-1">
                      <Zap className="size-3" />
                      Min Voltage (V)
                    </Label>
                    <Input
                      id="minVoltage"
                      type="number"
                      value={thresholds.minVoltage}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, minVoltage: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxVoltage" className="flex items-center gap-1">
                      <Zap className="size-3" />
                      Max Voltage (V)
                    </Label>
                    <Input
                      id="maxVoltage"
                      type="number"
                      value={thresholds.maxVoltage}
                      onChange={(e) =>
                        setThresholds({ ...thresholds, maxVoltage: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCurrent" className="flex items-center gap-1">
                    <Activity className="size-3" />
                    Max Current (A)
                  </Label>
                  <Input
                    id="maxCurrent"
                    type="number"
                    value={thresholds.maxCurrent}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, maxCurrent: Number(e.target.value) })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  India standard: 230V ±10% (207V-253V), Max current depends on your circuit breaker
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Key className="size-3" />
                  API Key
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted px-3 py-2 rounded overflow-x-auto">
                    {selectedDevice.apiKey}
                  </code>
                  <CopyButton text={selectedDevice.apiKey} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this API key in your ESP32 firmware configuration
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDevice} disabled={saving}>
              {saving ? (
                <RefreshCw className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Relay Configuration - Show for selected device */}
      {devices.length > 0 && (
        <div className="space-y-4">
          {devices.length > 1 && (
            <div className="flex items-center gap-3">
              <Label>Configure relays for:</Label>
              <select
                className="flex h-9 w-auto rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedRelayDevice || ""}
                onChange={(e) => setSelectedRelayDevice(e.target.value)}
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.deviceName} ({device.deviceId})
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedRelayDevice && (
            <RelayControl
              deviceId={selectedRelayDevice}
              relayInfo={devices.find(d => d.deviceId === selectedRelayDevice)?.relayInfo}
              onRelayUpdate={fetchDevices}
            />
          )}
        </div>
      )}

      {/* Quick Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="size-5" />
            API Reference
          </CardTitle>
          <CardDescription>ESP32 integration endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>POST Readings Endpoint</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">
                POST /api/readings
              </code>
              <CopyButton text={`${typeof window !== "undefined" ? window.location.origin : ""}/api/readings`} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Example Payload</Label>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "apiKey": "em_your_api_key_here",
  "deviceInfo": {
    "relayCount": 2,
    "relayPins": [13, 14],
    "firmwareVersion": "1.0.0"
  },
  "relayStates": [
    {"id": 1, "pin": 13, "state": false},
    {"id": 2, "pin": 14, "state": true}
  ],
  "readings": [{
    "offsetSeconds": 0,
    "entryNo": 1,
    "accumulatedAvgPower": 150.5,
    "maxAvgCurrent": 2.1,
    "maxAvgVoltage": 235.2,
    "minAvgVoltage": 228.4
  }]
}`}
            </pre>
          </div>
          <div className="space-y-2">
            <Label>Response (includes relay commands)</Label>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "success": true,
  "serverTime": "2024-01-15T10:30:00.000Z",
  "nextEntryNo": 2,
  "relayCommands": [
    {"id": 1, "targetState": true}
  ]
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
