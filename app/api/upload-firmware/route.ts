import { createRelease, uploadAssetToRelease } from "@/lib/github"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const version = formData.get("version") as string
    const notes = formData.get("notes") as string

    if (!file || !version) {
      return Response.json({ error: "File and version are required" }, { status: 400 })
    }

    // Create GitHub release
    const release = await createRelease(version, notes || "")

    if (!release) {
      return Response.json({ error: "Failed to create release" }, { status: 500 })
    }

    // Upload firmware file
    const buffer = Buffer.from(await file.arrayBuffer())
    const success = await uploadAssetToRelease(release.upload_url, buffer, "firmware.bin")

    if (!success) {
      return Response.json({ error: "Failed to upload firmware file" }, { status: 500 })
    }

    return Response.json({
      success: true,
      version: release.tag_name,
      url: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/releases/tag/${release.tag_name}`,
    })
  } catch (error) {
    console.error("[v0] Upload firmware error:", error)
    return Response.json({ error: "Failed to upload firmware" }, { status: 500 })
  }
}
