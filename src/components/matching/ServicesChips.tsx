"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import { useState } from "react"
import clsx from "clsx"

export default function ServicesChips({
  services,
  maxVisible = 4,
  className,
}: {
  services?: string[]
  maxVisible?: number
  className?: string
}) {
  if (!Array.isArray(services) || services.length === 0) return null
  const visible = services.slice(0, Math.max(0, maxVisible - 1))
  const remaining = services.length - visible.length
  const showMore = remaining > 0

  // mobile state for click-to-open
  const [openMobile, setOpenMobile] = useState(false)

  const Chip = ({ children, onClick, className }: { children: React.ReactNode; onClick?: (e: any) => void; className?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx("px-2 py-1 text-[10px] uppercase tracking-widest bg-gray-100 text-gray-700", className)}
    >
      {children}
    </button>
  )

  const AllServicesList = () => (
    <div className="max-w-xs sm:max-w-sm max-h-64 overflow-auto no-scrollbar px-3 py-2 bg-white text-gray-800 shadow-none">
      <div className="text-[11px] font-medium tracking-widest text-gray-700 mb-2 uppercase">
        ALLE DIENSTLEISTUNGEN
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map((s) => (
          <span key={s} className="px-2 py-1 text-[10px] uppercase tracking-widest bg-gray-100 text-gray-700">
            {s}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {visible.map((s) => (
        <span key={s} className="px-2 py-1 text-[10px] uppercase tracking-widest bg-gray-100 text-gray-700">
          {s}
        </span>
      ))}
      {showMore && (
        <>
          {/* Desktop/Tablet: hover tooltip */}
          <Tooltip.Provider delayDuration={100}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Chip
                  // show only on sm and up
                  className="hidden sm:inline-flex"
                  onClick={(e) => {
                    // prevent link navigation when wrapped by <Link>
                    e.preventDefault?.()
                    e.stopPropagation?.()
                  }}
                >
                  +{remaining}
                </Chip>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content sideOffset={6} className="hidden sm:block z-50">
                  <AllServicesList />
                  <Tooltip.Arrow className="fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {/* Mobile: click-to-open overlay */}
          <Chip
            className="sm:hidden"
            onClick={(e) => {
              e.preventDefault?.()
              e.stopPropagation?.()
              setOpenMobile(true)
            }}
          >
            +{remaining}
          </Chip>
          {openMobile && (
            <div
              className="sm:hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
              onClick={() => setOpenMobile(false)}
            >
              <div className="bg-white w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
                <AllServicesList />
                <div className="mt-3 text-right">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs uppercase tracking-widest border border-gray-300"
                    onClick={() => setOpenMobile(false)}
                  >
                    Schließen
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
