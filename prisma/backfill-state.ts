/**
 * Backfill script: Populate the `state` field on existing profiles
 * using Google Geocoding API (reverse geocoding via lat/lng).
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=<your-key> npx tsx prisma/backfill-state.ts
 *
 * The script:
 * 1. Finds all profiles that have lat/lng but no `state` value.
 * 2. Reverse-geocodes each profile's coordinates using the Google Geocoding API.
 * 3. Extracts `administrative_area_level_1` and writes it to the `state` field.
 * 4. Respects Google rate limits (50 req/s → 20ms delay between requests).
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const API_KEY = process.env.GOOGLE_MAPS_API_KEY
if (!API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY environment variable is required.')
  console.error('   Usage: GOOGLE_MAPS_API_KEY=<key> npx tsx prisma/backfill-state.ts')
  process.exit(1)
}

const DELAY_MS = 50 // 50ms between requests (20 req/s, well below 50 req/s limit)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}&language=de`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ⚠ HTTP ${res.status} for ${lat},${lng}`)
    return null
  }
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) {
    console.warn(`  ⚠ Geocoding status ${data.status} for ${lat},${lng}`)
    return null
  }
  // Search all results for administrative_area_level_1
  for (const result of data.results) {
    for (const comp of result.address_components || []) {
      if (comp.types?.includes('administrative_area_level_1')) {
        return comp.long_name
      }
    }
  }
  return null
}

async function forwardGeocode(city: string, country: string): Promise<string | null> {
  const q = `${city}, ${country}`
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${API_KEY}&language=de`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 'OK' || !data.results?.length) return null
  for (const result of data.results) {
    for (const comp of result.address_components || []) {
      if (comp.types?.includes('administrative_area_level_1')) {
        return comp.long_name
      }
    }
  }
  return null
}

async function main() {
  console.log('🔍 Finding profiles without state...')

  // Phase 1: Profiles with lat/lng
  const profilesWithCoords = await prisma.profile.findMany({
    where: {
      state: null,
      latitude: { not: null },
      longitude: { not: null },
    },
    select: { id: true, latitude: true, longitude: true, city: true, country: true },
  })

  console.log(`📍 Found ${profilesWithCoords.length} profiles with coordinates but no state`)

  let updated = 0
  let failed = 0

  for (const p of profilesWithCoords) {
    const state = await reverseGeocode(p.latitude!, p.longitude!)
    if (state) {
      await prisma.profile.update({
        where: { id: p.id },
        data: { state },
      })
      updated++
      console.log(`  ✅ ${p.city || '?'} → ${state}`)
    } else {
      failed++
      console.log(`  ❌ Could not resolve state for profile ${p.id} (${p.city})`)
    }
    await sleep(DELAY_MS)
  }

  // Phase 2: Profiles with city+country but no lat/lng
  const profilesWithCity = await prisma.profile.findMany({
    where: {
      state: null,
      city: { not: null },
      country: { not: null },
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: { id: true, city: true, country: true },
  })

  console.log(`\n🏙️  Found ${profilesWithCity.length} profiles with city+country but no coordinates/state`)

  for (const p of profilesWithCity) {
    const state = await forwardGeocode(p.city!, p.country!)
    if (state) {
      await prisma.profile.update({
        where: { id: p.id },
        data: { state },
      })
      updated++
      console.log(`  ✅ ${p.city} → ${state}`)
    } else {
      failed++
      console.log(`  ❌ Could not resolve state for profile ${p.id} (${p.city}, ${p.country})`)
    }
    await sleep(DELAY_MS)
  }

  console.log(`\n📊 Done! Updated: ${updated}, Failed: ${failed}`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal error:', e)
  prisma.$disconnect()
  process.exit(1)
})
