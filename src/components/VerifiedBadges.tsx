"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import { ShieldCheck, BadgeCheck } from "lucide-react"
import clsx from "clsx"

export default function VerifiedBadges({ className, translucent = false }: { className?: string; translucent?: boolean }) {
  const roseBase = translucent ? "bg-rose-50/90 text-rose-800 border-rose-200" : "bg-rose-50 text-rose-700 border-rose-200"
  const emeraldBase = translucent ? "bg-emerald-50/90 text-emerald-800 border-emerald-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
  return (
    <Tooltip.Provider delayDuration={100}>
      <div className={clsx("flex items-center gap-2", className)}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span
              className={clsx("inline-flex items-center justify-center w-7 h-7 border", roseBase)}
              aria-label="Altersverifizierung bestätigt"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={6} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">
              Altersverifiziert
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <span
              className={clsx("inline-flex items-center justify-center w-7 h-7 border", emeraldBase)}
              aria-label="Profil verifiziert"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
            </span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content sideOffset={6} className="rounded bg-gray-900 text-white px-2 py-1 text-xs shadow-md">
              Verifiziert
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  )
}
