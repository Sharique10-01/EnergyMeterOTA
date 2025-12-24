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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER || "sharique10-01"
const GITHUB_REPO = process.env.GITHUB_REPO || "EnergyMeterOTA"

export async function getLatestFirmware(): Promise<FirmwareInfo | null> {
  try {
    console.log("[v0] Fetching latest firmware from GitHub...")

    const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
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
