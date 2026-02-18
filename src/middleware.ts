import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
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
