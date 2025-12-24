export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  assets: GitHubAsset[]
}

export interface GitHubAsset {
  name: string
  size: number
  browser_download_url: string
}

export interface FirmwareInfo {
  version: string
  url: string
  size: number
  releaseDate: string
  notes: string
}

export async function getLatestFirmware(): Promise<FirmwareInfo | null> {
  try {
    // Read env vars inside function for runtime access
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_OWNER = process.env.GITHUB_OWNER || "sharique10-01"
    const GITHUB_REPO = process.env.GITHUB_REPO || "EnergyMeterOTA"

    console.log("[v0] Fetching latest firmware from GitHub...")
    console.log("[v0] GitHub Owner:", GITHUB_OWNER)
    console.log("[v0] GitHub Repo:", GITHUB_REPO)
    console.log("[v0] Token exists:", !!GITHUB_TOKEN)
    console.log("[v0] URL:", `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`)

    // Repo is public - no auth needed (fixes runtime env var issues)
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    }

    // Only add auth if token exists (optional for public repos)
    if (GITHUB_TOKEN) {
      headers.Authorization = `token ${GITHUB_TOKEN}`
    }

    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`, {
      headers,
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log("[v0] No releases found in repository (404)")
      } else {
        console.error("[v0] Error fetching latest firmware:", response.status, response.statusText)
      }
      return null
    }

    const release: GitHubRelease = await response.json()
    const binAsset = release.assets.find((asset) => asset.name.endsWith(".bin"))

    if (!binAsset) {
      console.log("[v0] No .bin file found in latest release")
      return null
    }

    console.log("[v0] Latest firmware found:", release.tag_name)
    return {
      version: release.tag_name,
      url: binAsset.browser_download_url,
      size: binAsset.size,
      releaseDate: release.published_at,
      notes: release.body || "",
    }
  } catch (error) {
    console.error("[v0] Error fetching latest firmware:", error)
    return null
  }
}

export async function getAllReleases(): Promise<GitHubRelease[]> {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_OWNER = process.env.GITHUB_OWNER || "sharique10-01"
    const GITHUB_REPO = process.env.GITHUB_REPO || "EnergyMeterOTA"

    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return []
    }

    return response.json()
  } catch (error) {
    console.error("[v0] Error fetching all releases:", error)
    return []
  }
}

export async function createRelease(version: string, notes: string): Promise<GitHubRelease | null> {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const GITHUB_OWNER = process.env.GITHUB_OWNER || "sharique10-01"
    const GITHUB_REPO = process.env.GITHUB_REPO || "EnergyMeterOTA"

    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        tag_name: version,
        name: version,
        body: notes,
        draft: false,
        prerelease: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Error creating release:", error)
      return null
    }

    return response.json()
  } catch (error) {
    console.error("[v0] Error creating release:", error)
    return null
  }
}

export async function uploadAssetToRelease(uploadUrl: string, file: Buffer, filename: string): Promise<boolean> {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN

    const cleanUrl = uploadUrl.replace("{?name,label}", "")
    const response = await fetch(`${cleanUrl}?name=${filename}`, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/octet-stream",
        Accept: "application/vnd.github.v3+json",
      },
      body: file,
    })

    return response.ok
  } catch (error) {
    console.error("[v0] Error uploading asset:", error)
    return false
  }
}
