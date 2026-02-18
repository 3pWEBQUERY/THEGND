"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageCircle } from "lucide-react"

interface Props {
  toUserId: string
  className?: string
  toDisplayName?: string
  toAvatar?: string
}

export default function MessageButton({ toUserId, className = "", toDisplayName, toAvatar }: Props) {
  const { status } = useSession()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const onClick = () => {
    const qs = new URLSearchParams()
    qs.set("tab", "messages")
    qs.set("to", toUserId)
    if (toDisplayName) qs.set("toName", toDisplayName)
    if (toAvatar) qs.set("toAvatar", toAvatar)
    const target = `/dashboard?${qs.toString()}`
    if (status === "authenticated") {
      router.push(target)
    } else {
      setShowAuthModal(true)
    }
  }

  return (
    <>
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-none text-sm tracking-widest transition-colors ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
        NACHRICHT
      </button>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white w-full max-w-md">
            <div className="p-8 text-center">
              <h3 className="text-xl font-thin tracking-wider text-gray-800 mb-3">ANMELDUNG ERFORDERLICH</h3>
              <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
              <p className="text-sm font-light tracking-wide text-gray-600 mb-6">
                Das Senden von Nachrichten ist nur für registrierte oder angemeldete Nutzer möglich.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 border border-gray-300 text-sm tracking-widest hover:border-pink-500 rounded-none"
                >
                  ANMELDEN
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm tracking-widest rounded-none"
                >
                  REGISTRIEREN
                </Link>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="mt-6 text-xs font-light tracking-widest text-gray-600 hover:text-gray-800 uppercase"
              >
                SCHLIEßEN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
