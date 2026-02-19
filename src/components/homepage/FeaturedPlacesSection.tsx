"use client"

import Link from "next/link"
import Tabs from "@/components/Tabs"
import { CITY_TO_STATE } from "@/data/city-states"

const FEATURED: { key: string; label: string; cities: string[] }[] = [
  {
    key: "CH",
    label: "Schweiz",
    cities: [
      "Zürich",
      "Genf",
      "Basel",
      "Bern",
      "Lausanne",
      "Luzern",
      "St. Gallen",
      "Winterthur",
      "Zug",
      "Biel/Bienne",
      "Thun",
      "Lugano",
    ],
  },
  {
    key: "AT",
    label: "Österreich",
    cities: [
      "Wien",
      "Graz",
      "Linz",
      "Salzburg",
      "Innsbruck",
      "Klagenfurt",
      "Villach",
      "Wels",
      "Sankt Pölten",
      "Dornbirn",
    ],
  },
  {
    key: "DE",
    label: "Deutschland",
    cities: [
      "Berlin",
      "Hamburg",
      "München",
      "Köln",
      "Frankfurt",
      "Stuttgart",
      "Düsseldorf",
      "Leipzig",
      "Hannover",
      "Dresden",
      "Nürnberg",
      "Bremen",
    ],
  },
]

// Utility: chunk an array into pages/slides
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// City-specific image mapping (explicit overrides if needed)
const CITY_IMAGE_MAP: Record<string, string> = {
  "Zürich": "/zürich_.jpg",
}

// Normalize to ASCII (remove accents)
function toAscii(input: string) {
  return input.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
}

// Generate candidate filenames (in order of preference)
function cityFilenameCandidates(name: string): string[] {
  const trimmed = name.trim()
  const slashSpace = trimmed.replaceAll('/', ' ')
  const slashHyphen = trimmed.replaceAll('/', '-')
  const hyphen = slashSpace.replaceAll(' ', '-')
  const lowerHyphen = hyphen.toLowerCase()
  const asciiHyphen = toAscii(hyphen)
  const asciiLowerHyphen = asciiHyphen.toLowerCase()

  // Keep original spacing too, but avoid duplicates
  const variants = Array.from(
    new Set([
      `${trimmed}_.jpg`,
      `${slashSpace}_.jpg`,
      `${slashHyphen}_.jpg`,
      `${hyphen}_.jpg`,
      `${lowerHyphen}_.jpg`,
      `${asciiHyphen}_.jpg`,
      `${asciiLowerHyphen}_.jpg`,
    ])
  )

  return variants.map((v) => `/${v}`)
}

// Build ordered list of background URLs for a city
function getCityBackgrounds(name: string, i: number): string[] {
  const mapped = CITY_IMAGE_MAP[name]
  const candidates = mapped ? [mapped] : cityFilenameCandidates(name)
  const placeholders = ["/1.jpg", "/2.jpg"]
  return [...candidates, placeholders[i % placeholders.length] || "/1.jpg"]
}

function CityCard({ name, index }: { name: string; index: number }) {
  const state = CITY_TO_STATE[name]
  const href = state
    ? `/escorts?state=${encodeURIComponent(state)}&location=${encodeURIComponent(name)}`
    : `/escorts?location=${encodeURIComponent(name)}`
  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
      aria-label={`Escorts in ${name} anzeigen`}
    >
      <div className="relative w-full aspect-[2/3] sm:aspect-[3/4] overflow-hidden bg-gray-200">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-center bg-cover transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: getCityBackgrounds(name, index).map(u => `url(${encodeURI(u)})`).join(', ') }}
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        {/* Left vertical label strip */}
        <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-12 md:w-14 bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
          <span className="text-white text-xs sm:text-sm md:text-base tracking-[0.3em] [writing-mode:vertical-rl] rotate-180">
            {name.toUpperCase()}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function FeaturedPlacesSection() {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg md:text-xl font-light tracking-widest text-gray-900">
            VORGESTELLTE ORTE
          </h2>
          <Link
            href="/escorts"
            className="text-xs tracking-widest underline text-pink-600 hover:text-pink-700"
          >
            Alle ansehen
          </Link>
        </div>

        <Tabs
          tabs={FEATURED.map((c) => ({
            id: c.key,
            label: c.label,
            content: (
              <div>
                {/* Mobile (horizontal scroll, hidden scrollbar, 2-column grid per slide) */}
                <div className="md:hidden flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory touch-pan-x overscroll-x-contain">
                  {chunk(c.cities, 2).map((slide, si) => (
                    <div key={`${c.key}-slide-${si}`} className="flex-none w-full snap-start">
                      <div className="grid grid-cols-2 gap-3">
                        {slide.map((city, i) => (
                          <CityCard key={`${c.key}-${city}`} name={city} index={si * 2 + i} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet/Desktop (4-column slider with hidden scrollbar) */}
                <div className="hidden md:flex gap-6 overflow-x-auto overflow-y-hidden no-scrollbar snap-x snap-mandatory">
                  {c.cities.map((city, i) => (
                    <div key={`${c.key}-${city}`} className="flex-none w-[calc((100%-4.5rem)/4)] snap-start">
                      <CityCard name={city} index={i} />
                    </div>
                  ))}
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </section>
  )
}

