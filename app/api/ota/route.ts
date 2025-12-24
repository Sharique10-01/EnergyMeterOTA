import { getLatestFirmware } from "@/lib/github"

export async function GET() {
  try {
    const firmware = await getLatestFirmware()

    if (!firmware) {
      return Response.json({ error: "No firmware available" }, { status: 404 })
    }

    return Response.json({
      version: firmware.version,
      url: firmware.url,
      size: firmware.size,
      releaseDate: firmware.releaseDate,
      notes: firmware.notes,
    })
  } catch (error) {
    console.error("[v0] OTA endpoint error:", error)
    return Response.json({ error: "Failed to fetch firmware" }, { status: 500 })
  }
}
