"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export default function NewThreadActions({ forumSlug, isLocked }: { forumSlug: string; isLocked: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const showNew = searchParams.get("new") === "1"

  const toggle = () => {
    const sp = new URLSearchParams(searchParams.toString())
    if (showNew) {
      sp.delete("new")
    } else {
      sp.set("new", "1")
    }
    router.push(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  return (
    <div className="text-sm flex items-center gap-2">
      <Link
        href="/forum"
        className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-widest text-[11px]"
      >
        Alle Kategorien
      </Link>
      {!isLocked && (
        <button
          type="button"
          onClick={toggle}
          className={
            showNew
              ? "px-3 py-1.5 border border-pink-500 bg-pink-500 text-white hover:bg-pink-600 uppercase tracking-widest text-[11px]"
              : "px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 uppercase tracking-widest text-[11px]"
          }
        >
          Neues Thema
        </button>
      )}
    </div>
  )
}
