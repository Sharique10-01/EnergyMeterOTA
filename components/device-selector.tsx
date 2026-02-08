"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Cpu } from "lucide-react"

interface Device {
  id: string
  deviceId: string
  deviceName: string
  status: string
  lastSeen: string | null
}

interface DeviceSelectorProps {
  onDeviceSelect: (deviceId: string | null) => void
  selectedDeviceId?: string | null
}

export function DeviceSelector({ onDeviceSelect, selectedDeviceId }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch("/api/devices")
        const data = await res.json()
        if (data.devices) {
          setDevices(data.devices)
          // Auto-select first device if none selected
          if (!selectedDeviceId && data.devices.length > 0) {
            onDeviceSelect(data.devices[0].deviceId)
          }
        }
      } catch (error) {
        console.error("Failed to fetch devices:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDevices()
  }, [selectedDeviceId, onDeviceSelect])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="h-10 w-[200px] animate-pulse bg-muted rounded-md" />
    )
  }

  if (devices.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Cpu className="size-4" />
        <span>No devices configured</span>
      </div>
    )
  }

  return (
    <Select
      value={selectedDeviceId || undefined}
      onValueChange={(value) => onDeviceSelect(value)}
    >
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select a device" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.deviceId} value={device.deviceId}>
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${getStatusColor(device.status)}`} />
              <span>{device.deviceName}</span>
              <Badge variant="outline" className="text-xs">
                {device.deviceId}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
