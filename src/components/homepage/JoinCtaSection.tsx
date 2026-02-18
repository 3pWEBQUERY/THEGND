'use client'

import Link from 'next/link'

export default function JoinCtaSection() {
  return (
    <section className="bg-pink-600">
      <div className="max-w-7xl mx-auto px-6 pt-10 md:pt-12 pb-10 md:pb-12 text-white">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-thin tracking-wider mb-2">Jetzt mitmachen!</h2>
          <p className="text-sm md:text-base font-light tracking-wide text-white/90">
            Sie haben noch kein Benutzerkonto auf unserer Seite? Registrieren Sie sich kostenlos und nehmen Sie an unserer Community teil!
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/auth/signin"
              className="flex-1 min-w-0 inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/40 text-[11px] sm:text-sm font-light tracking-widest px-3 sm:px-6 h-11 sm:h-12 uppercase rounded-none overflow-hidden text-ellipsis whitespace-nowrap"
            >
              Anmelden
            </Link>
            <Link
              href="/auth/signup"
              className="flex-1 min-w-0 inline-flex items-center justify-center bg-white hover:bg-white/90 text-pink-600 text-[11px] sm:text-sm font-light tracking-widest px-3 sm:px-6 h-11 sm:h-12 uppercase rounded-none overflow-hidden text-ellipsis whitespace-nowrap"
            >
              JETZT REGISTRIEREN!
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
