import { getAllReleases } from "@/lib/github"
import { formatBytes, formatDate } from "@/lib/format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export async function FirmwareHistory() {
  const releases = await getAllReleases()

  if (releases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Firmware History</CardTitle>
          <CardDescription>No releases found</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firmware History</CardTitle>
        <CardDescription>All published firmware releases</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Released</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.map((release, index) => {
              const binAsset = release.assets.find((asset) => asset.name.endsWith(".bin"))
              return (
                <TableRow key={release.tag_name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {release.tag_name}
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          Latest
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(release.published_at)}</TableCell>
                  <TableCell>{binAsset ? formatBytes(binAsset.size) : "N/A"}</TableCell>
                  <TableCell className="text-right">
                    {binAsset && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={binAsset.browser_download_url} download>
                          <Download className="size-4" />
                          Download
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
