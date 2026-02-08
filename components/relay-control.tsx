"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Power,
  Plus,
  Settings2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lightbulb,
  Fan,
  Plug,
} from "lucide-react"
import { toast } from "sonner"

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

interface RelayControlProps {
  deviceId: string
  relayInfo?: RelayInfo
  onRelayUpdate?: () => void
  compact?: boolean // For monitoring tab - shows just toggle buttons
}

const RELAY_ICONS: Record<string, React.ReactNode> = {
  light: <Lightbulb className="size-4" />,
  fan: <Fan className="size-4" />,
  default: <Plug className="size-4" />,
}

function getRelayIcon(name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("light") || lowerName.includes("lamp") || lowerName.includes("bulb")) {
    return RELAY_ICONS.light
  }
  if (lowerName.includes("fan") || lowerName.includes("ac") || lowerName.includes("cooler")) {
    return RELAY_ICONS.fan
  }
  return RELAY_ICONS.default
}

export function RelayControl({ deviceId, relayInfo, onRelayUpdate, compact = false }: RelayControlProps) {
  const [relays, setRelays] = useState<RelayConfig[]>(relayInfo?.userConfiguredRelays || [])
  const [deviceReportedCount, setDeviceReportedCount] = useState(relayInfo?.deviceReportedCount || 0)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [newRelayName, setNewRelayName] = useState("")
  const [editingRelays, setEditingRelays] = useState<{ id: number; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [togglingRelay, setTogglingRelay] = useState<number | null>(null)

  useEffect(() => {
    if (relayInfo) {
      setRelays(relayInfo.userConfiguredRelays || [])
      setDeviceReportedCount(relayInfo.deviceReportedCount || 0)
    }
  }, [relayInfo])

  const fetchRelays = useCallback(async () => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/relays`)
      const data = await res.json()
      if (data.relayInfo) {
        setRelays(data.relayInfo.userConfiguredRelays || [])
        setDeviceReportedCount(data.relayInfo.deviceReportedCount || 0)
      }
    } catch (error) {
      console.error("Failed to fetch relays:", error)
    }
  }, [deviceId])

  const handleToggleRelay = async (relayId: number, newState: boolean) => {
    setTogglingRelay(relayId)
    try {
      const res = await fetch(`/api/devices/${deviceId}/relays`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relayId, targetState: newState }),
      })

      const data = await res.json()

      if (res.ok) {
        // Update local state optimistically
        setRelays(relays.map(r =>
          r.id === relayId ? { ...r, targetState: newState } : r
        ))
        toast.success(`${relays.find(r => r.id === relayId)?.name || "Relay"} ${newState ? "ON" : "OFF"}`)
        onRelayUpdate?.()
      } else {
        toast.error(data.error || "Failed to toggle relay")
      }
    } catch (error) {
      console.error("Failed to toggle relay:", error)
      toast.error("Failed to toggle relay")
    } finally {
      setTogglingRelay(null)
    }
  }

  const openConfigDialog = () => {
    setEditingRelays(relays.map(r => ({ id: r.id, name: r.name })))
    setConfigDialogOpen(true)
  }

  const addRelay = () => {
    const newId = editingRelays.length > 0 ? Math.max(...editingRelays.map(r => r.id)) + 1 : 1
    setEditingRelays([...editingRelays, { id: newId, name: newRelayName || `Relay ${newId}` }])
    setNewRelayName("")
  }

  const removeRelay = (id: number) => {
    setEditingRelays(editingRelays.filter(r => r.id !== id))
  }

  const updateRelayName = (id: number, name: string) => {
    setEditingRelays(editingRelays.map(r => r.id === id ? { ...r, name } : r))
  }

  const saveRelayConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/devices/${deviceId}/relays`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relays: editingRelays }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Relay configuration saved")
        setRelays(data.relayInfo?.userConfiguredRelays || [])
        setConfigDialogOpen(false)
        onRelayUpdate?.()
      } else {
        toast.error(data.error || "Failed to save configuration")
      }
    } catch (error) {
      console.error("Failed to save relay config:", error)
      toast.error("Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  // Compact view for monitoring tab
  if (compact) {
    if (relays.length === 0) {
      return null
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Power className="size-4" />
            Relay Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {relays.map((relay) => (
              <div
                key={relay.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  relay.verified
                    ? relay.targetState
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-muted/50"
                    : "bg-red-500/10 border-red-500/20"
                }`}
              >
                {getRelayIcon(relay.name)}
                <span className="text-sm font-medium">{relay.name}</span>
                <Switch
                  checked={relay.targetState}
                  onCheckedChange={(checked) => handleToggleRelay(relay.id, checked)}
                  disabled={togglingRelay === relay.id}
                />
                {togglingRelay === relay.id && (
                  <RefreshCw className="size-3 animate-spin" />
                )}
              </div>
            ))}
          </div>
          {relays.some(r => r.targetState !== r.actualState) && (
            <p className="text-xs text-muted-foreground mt-2">
              Pending sync with device...
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full view for settings tab
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Power className="size-5" />
              Relay Configuration
            </CardTitle>
            <CardDescription>
              Configure and control device relays
            </CardDescription>
          </div>
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={openConfigDialog}>
                <Settings2 className="size-4 mr-2" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Relays</DialogTitle>
                <DialogDescription>
                  Add relays and give them names. The device will verify which relays are available.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Add new relay */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Relay name (e.g., Bedroom Light)"
                    value={newRelayName}
                    onChange={(e) => setNewRelayName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addRelay()}
                  />
                  <Button onClick={addRelay} size="icon">
                    <Plus className="size-4" />
                  </Button>
                </div>

                {/* Relay list */}
                <div className="space-y-2">
                  {editingRelays.map((relay, index) => (
                    <div
                      key={relay.id}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        index < deviceReportedCount
                          ? "bg-green-500/10"
                          : deviceReportedCount > 0
                            ? "bg-red-500/10"
                            : "bg-muted/50"
                      }`}
                    >
                      <span className="text-sm font-medium w-8">#{relay.id}</span>
                      <Input
                        value={relay.name}
                        onChange={(e) => updateRelayName(relay.id, e.target.value)}
                        className="flex-1"
                      />
                      {index < deviceReportedCount ? (
                        <CheckCircle2 className="size-4 text-green-500" />
                      ) : deviceReportedCount > 0 ? (
                        <XCircle className="size-4 text-red-500" />
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRelay(relay.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {deviceReportedCount > 0 && editingRelays.length > deviceReportedCount && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <AlertTriangle className="size-4" />
                    Device only has {deviceReportedCount} relay(s). Extra relays won't work.
                  </div>
                )}

                {deviceReportedCount > 0 && editingRelays.length < deviceReportedCount && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <AlertTriangle className="size-4" />
                    Device has {deviceReportedCount} relay(s). Add {deviceReportedCount - editingRelays.length} more to use all.
                  </div>
                )}

                {deviceReportedCount === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Device hasn't reported relay count yet. Connect the device to verify configuration.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveRelayConfig} disabled={saving}>
                  {saving && <RefreshCw className="size-4 mr-2 animate-spin" />}
                  Save Configuration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {relays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Power className="size-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No Relays Configured</p>
            <p className="text-xs text-muted-foreground mb-4">
              Configure relays to control them from the dashboard
            </p>
            <Button variant="outline" size="sm" onClick={openConfigDialog}>
              <Plus className="size-4 mr-2" />
              Add Relays
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status summary */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Device reports: {deviceReportedCount} relay(s)
              </span>
              {deviceReportedCount > 0 && relayInfo?.lastVerified && (
                <Badge variant="outline" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>

            {/* Relay controls */}
            <div className="grid gap-3 sm:grid-cols-2">
              {relays.map((relay) => (
                <div
                  key={relay.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    relay.verified
                      ? relay.targetState
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-card"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${relay.targetState ? "bg-green-500/20" : "bg-muted"}`}>
                      {getRelayIcon(relay.name)}
                    </div>
                    <div>
                      <p className="font-medium">{relay.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {relay.verified ? (
                          <>
                            <span>GPIO {relay.gpioPin}</span>
                            {relay.targetState !== relay.actualState && (
                              <Badge variant="outline" className="text-yellow-600 text-xs">
                                Pending
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-red-500">Not verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={relay.targetState}
                    onCheckedChange={(checked) => handleToggleRelay(relay.id, checked)}
                    disabled={togglingRelay === relay.id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
