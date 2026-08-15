import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface DockerHubTag {
  name: string
  last_updated?: string
}

// Parse semver-like "v1.2.3" or "1.2.3"; returns [major, minor, patch] or null
function parseSemver(tag: string): [number, number, number] | null {
  const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a)
  const pb = parseSemver(b)
  if (!pa && !pb) return 0
  if (!pa) return -1
  if (!pb) return 1
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

export async function GET() {
  const current = process.env.APP_VERSION || "dev"

  try {
    const res = await fetch(
      "https://hub.docker.com/v2/repositories/d2poption/smilestore/tags?page_size=50",
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) {
      return NextResponse.json({ current, latest: null, hasUpdate: false, error: "Docker Hub responded " + res.status })
    }

    const json = await res.json()
    const results: DockerHubTag[] = json.results || []
    const semverTags = results
      .map(t => t.name)
      .filter(n => parseSemver(n) !== null)
      .sort((a, b) => compareSemver(b, a)) // newest first

    const latest = semverTags[0] || null
    const hasUpdate = latest !== null && parseSemver(current) !== null && compareSemver(latest, current) > 0

    return NextResponse.json({
      current,
      latest,
      hasUpdate,
      availableTags: semverTags.slice(0, 10),
    })
  } catch (e: any) {
    return NextResponse.json({
      current,
      latest: null,
      hasUpdate: false,
      error: e.message || "Failed to fetch version info",
    })
  }
}
