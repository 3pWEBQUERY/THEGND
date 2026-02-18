"use client"

import { PropsWithChildren, useEffect, useState } from "react"
import clsx from "clsx"

export default function Appear({ children, className }: PropsWithChildren<{ className?: string }>) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])
  return (
    <div
      className={clsx(
        "transition-all duration-300 ease-out",
        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      {children}
    </div>
  )
}
