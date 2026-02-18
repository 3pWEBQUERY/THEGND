"use client"

import Link from 'next/link'
import { SiX, SiInstagram } from 'react-icons/si'
import { usePublicSettingsCtx } from '@/components/providers/public-settings-provider'

export default function Footer() {
  const site = usePublicSettingsCtx()
  return (
    <footer className="bg-neutral-950 bg-gradient-to-b from-black to-neutral-900 border-t border-neutral-800/60 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <h3 className="text-3xl font-light tracking-[0.35em] text-neutral-100 mb-3">{site?.name || 'THEGND'}</h3>
          <div
            className="mx-auto h-[2px] w-16 rounded-full bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0 mb-6"
            aria-hidden="true"
          />
          <p className="text-[13px] md:text-sm font-light text-neutral-300 leading-relaxed mb-8 max-w-md mx-auto">
            {site?.tagline || 'Finde dein Escort Treffen direkt auf THEGND.'}
          </p>
          <div className="flex justify-center gap-6 mb-6">
            <a
              href="https://x.com"
              target="_blank"
              rel="https://x.com/TheGND_io"
              aria-label="X (Twitter)"
              className="text-white hover:text-pink-600 transition-colors"
            >
              <SiX className="w-6 h-6" />
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="https://www.instagram.com/thegnd.net"
              aria-label="Instagram"
              className="text-white hover:text-pink-600 transition-colors"
            >
              <SiInstagram className="w-6 h-6" />
            </a>
          </div>
          <div className="flex justify-center gap-6 mb-8">
            <Link
              href="/agb"
              className="text-xs md:text-sm font-light tracking-[0.25em] text-neutral-300 hover:text-pink-400 transition-colors underline-offset-4 hover:underline hover:decoration-pink-400"
            >
              AGB
            </Link>
            <Link
              href="/datenschutz"
              className="text-xs md:text-sm font-light tracking-[0.25em] text-neutral-300 hover:text-pink-400 transition-colors underline-offset-4 hover:underline hover:decoration-pink-400"
            >
              DATENSCHUTZ
            </Link>
            <Link
              href="/imprint"
              className="text-xs md:text-sm font-light tracking-[0.25em] text-neutral-300 hover:text-pink-400 transition-colors underline-offset-4 hover:underline hover:decoration-pink-400"
            >
              IMPRINT
            </Link>
            <Link
              href="/feedback"
              className="text-xs md:text-sm font-light tracking-[0.25em] text-neutral-300 hover:text-pink-400 transition-colors underline-offset-4 hover:underline hover:decoration-pink-400"
            >
              FEEDBACK
            </Link>
          </div>
          <p className="text-[11px] md:text-xs font-light text-neutral-400 tracking-[0.25em]"> 2026 {site?.name || 'THEGND'}. ALL RIGHTS RESERVED.</p>
        </div>
      </div>
    </footer>
  )
}