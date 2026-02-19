import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// ─── In-memory redirect cache (Edge-compatible) ────────────────────────

type RedirectEntry = { sourcePath: string; targetUrl: string; statusCode: number }
let redirectCache: RedirectEntry[] | null = null
let redirectCacheTime = 0
const REDIRECT_CACHE_TTL = 60_000 // 60 seconds

async function loadRedirects(origin: string): Promise<RedirectEntry[]> {
  const now = Date.now()
  if (redirectCache && now - redirectCacheTime < REDIRECT_CACHE_TTL) {
    return redirectCache
  }
  try {
    const res = await fetch(`${origin}/api/acp/seo/redirects?_internal=1`, {
      headers: { cookie: '' }, // internal call, no auth needed for cache
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        redirectCache = data.filter((r: any) => r.enabled).map((r: any) => ({
          sourcePath: r.sourcePath,
          targetUrl: r.targetUrl,
          statusCode: r.statusCode || 301,
        }))
        redirectCacheTime = now
        return redirectCache!
      }
    }
  } catch {
    // On error, return cached or empty
  }
  return redirectCache || []
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // ─── Check redirects ───────────────────────────────────────────────
  // Skip API routes / static assets / Next internals for redirects
  if (
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.startsWith('/favicon') &&
    !pathname.match(/\.\w{2,5}$/) // skip files with extensions like .css, .js, .png
  ) {
    try {
      const redirects = await loadRedirects(req.nextUrl.origin)
      const match = redirects.find((r) => r.sourcePath === pathname)
      if (match) {
        const target = match.targetUrl.startsWith('/')
          ? new URL(match.targetUrl, req.nextUrl.origin).toString()
          : match.targetUrl
        // Fire-and-forget hit counter
        fetch(`${req.nextUrl.origin}/api/seo/redirect-hit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourcePath: pathname }),
        }).catch(() => {})

        return NextResponse.redirect(target, match.statusCode as 301 | 302)
      }
    } catch {
      // Don't block page load on redirect errors
    }
  }

  // ─── Default: pass through with geo header ─────────────────────────
  const res = NextResponse.next()

  // Pass through a unified country header for app consumption
  const h = req.headers
  let country = h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || h.get('x-geo-country') || ''

  // Allow local testing via ?ctry=XX
  if (!country) {
    const ctry = req.nextUrl.searchParams.get('ctry')
    if (ctry) country = ctry
  }

  if (country) {
    res.headers.set('x-geo-country', country)
  }

  return res
}

export const config = {
  matcher: '/:path*',
}
