import { getLatestFirmware } from "@/lib/github"
import { formatBytes, formatDate } from "@/lib/format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { CopyButton } from "@/components/copy-button"

export async function CurrentFirmware() {
  const firmware = await getLatestFirmware()

  if (!firmware) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Firmware</CardTitle>
          <CardDescription>No firmware available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Firmware Information</CardTitle>
        <CardDescription>Latest available firmware for ESP32 devices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Version</p>
            <p className="text-lg font-semibold">{firmware.version}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">File Size</p>
            <p className="text-lg font-semibold">{formatBytes(firmware.size)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Released</p>
            <p className="text-lg font-semibold">{formatDate(firmware.releaseDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Download URL</p>
            <div className="flex items-center gap-2">
              <CopyButton text={firmware.url} />
              <Button variant="outline" size="sm" asChild>
                <a href={firmware.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
