import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

// ─── Per-page SEO override ─────────────────────────────────────────────

export async function getSeoOverride(urlPath: string) {
  try {
    return await prisma.seoPageOverride.findUnique({ where: { urlPath } })
  } catch {
    return null
  }
}

/**
 * Merge a SeoPageOverride into existing Next.js Metadata.
 * Override fields take precedence when non-null.
 */
export function mergeMetadata(
  base: Metadata,
  override: Awaited<ReturnType<typeof getSeoOverride>>
): Metadata {
  if (!override || !override.enabled) return base

  const merged = { ...base }

  if (override.metaTitle) {
    merged.title = override.metaTitle
  }
  if (override.metaDescription) {
    merged.description = override.metaDescription
  }
  if (override.metaKeywords) {
    merged.keywords = override.metaKeywords.split(',').map((k: string) => k.trim())
  }
  if (override.robots) {
    const parts = override.robots.toLowerCase().split(',').map((r: string) => r.trim())
    merged.robots = {
      index: !parts.includes('noindex'),
      follow: !parts.includes('nofollow'),
    }
  }
  if (override.canonicalUrl) {
    merged.alternates = {
      ...((merged.alternates as any) || {}),
      canonical: override.canonicalUrl,
    }
  }

  // OpenGraph overrides
  const ogTitle = override.ogTitle || override.metaTitle
  const ogDesc = override.ogDescription || override.metaDescription
  const ogImage = override.ogImageUrl
  if (ogTitle || ogDesc || ogImage) {
    merged.openGraph = {
      ...(typeof merged.openGraph === 'object' ? merged.openGraph : {}),
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(ogDesc ? { description: ogDesc } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    }
  }

  return merged
}

// ─── Structured Data (JSON-LD) ─────────────────────────────────────────

/**
 * Get all active JSON-LD snippets whose urlPattern matches the given path.
 * Supports exact match and simple wildcard: "/escorts/*" matches "/escorts/abc/xyz"
 */
export async function getStructuredDataForPath(urlPath: string) {
  try {
    const all = await prisma.seoStructuredData.findMany({
      where: { enabled: true },
    })
    return all.filter((sd: any) => {
      const pattern = sd.urlPattern
      if (pattern === urlPath) return true
      if (pattern === '*' || pattern === '/*') return true
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2)
        return urlPath === prefix || urlPath.startsWith(prefix + '/')
      }
      if (pattern.endsWith('*')) {
        return urlPath.startsWith(pattern.slice(0, -1))
      }
      return false
    })
  } catch {
    return []
  }
}

// ─── Redirect cache ────────────────────────────────────────────────────

type RedirectEntry = { sourcePath: string; targetUrl: string; statusCode: number }

let redirectCache: RedirectEntry[] | null = null
let redirectCacheTime = 0
const REDIRECT_CACHE_TTL = 60_000 // 60 seconds

export async function getRedirects(): Promise<RedirectEntry[]> {
  const now = Date.now()
  if (redirectCache && now - redirectCacheTime < REDIRECT_CACHE_TTL) {
    return redirectCache
  }
  try {
    const rows = await prisma.seoRedirect.findMany({
      where: { enabled: true },
      select: { sourcePath: true, targetUrl: true, statusCode: true },
    })
    redirectCache = rows
    redirectCacheTime = now
    return rows
  } catch {
    return redirectCache || []
  }
}

export function invalidateRedirectCache() {
  redirectCache = null
  redirectCacheTime = 0
}

/**
 * Look up a redirect for a given path.
 */
export async function findRedirect(pathname: string): Promise<RedirectEntry | null> {
  const redirects = await getRedirects()
  return redirects.find((r) => r.sourcePath === pathname) || null
}

// ─── Merge user SEO addon settings ─────────────────────────────────────

export type UserSeoSettings = {
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  ogImageUrl?: string
}

/**
 * Get SEO settings from a user's addon state (if SEO addon is enabled).
 */
export async function getUserSeoSettings(userId: string): Promise<UserSeoSettings | null> {
  try {
    const state = await prisma.userAddonState.findUnique({
      where: { userId_key: { userId, key: 'SEO' } },
    })
    if (!state || !state.enabled || !state.settings) return null
    return JSON.parse(state.settings) as UserSeoSettings
  } catch {
    return null
  }
}

/**
 * Merge user's SEO addon settings into metadata.
 * Priority: User SEO Addon > base metadata
 */
export function mergeUserSeoMetadata(base: Metadata, userSeo: UserSeoSettings | null): Metadata {
  if (!userSeo) return base
  const merged = { ...base }
  if (userSeo.metaTitle) merged.title = userSeo.metaTitle
  if (userSeo.metaDescription) merged.description = userSeo.metaDescription
  if (userSeo.metaKeywords) {
    merged.keywords = userSeo.metaKeywords.split(',').map((k) => k.trim())
  }
  if (userSeo.ogImageUrl) {
    merged.openGraph = {
      ...(typeof merged.openGraph === 'object' ? merged.openGraph : {}),
      images: [userSeo.ogImageUrl],
    }
  }
  return merged
}
