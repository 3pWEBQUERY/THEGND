"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

export default function FeedbackFormClient({ showEmailField }: { showEmailField: boolean }) {
  const [reason, setReason] = useState<string>("")
  const [contact, setContact] = useState<string>("")
  const [clientError, setClientError] = useState<string>("")

  const contactIsValid = useMemo(() => {
    if (!contact.trim()) return true
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRe = /^\+?[0-9 ()\-]{6,}$/
    return emailRe.test(contact.trim()) || phoneRe.test(contact.trim())
  }, [contact])

  useEffect(() => {
    if (!contactIsValid) {
      setClientError("Bitte gültige E‑Mail oder Telefonnummer angeben.")
    } else {
      setClientError("")
    }
  }, [contactIsValid])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!reason) {
      e.preventDefault()
      setClientError("Bitte einen Grund auswählen.")
      return
    }
    if (!contactIsValid) {
      e.preventDefault()
      return
    }
  }

  return (
    <form className="max-w-3xl space-y-5" action="/api/feedback" method="post" onSubmit={onSubmit}>
      {showEmailField && (
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">E-Mail (optional)</label>
          <input
            type="email"
            name="email"
            placeholder="dein@email.de"
            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Grund</label>
        {/* Hidden input to submit value with standard form POST */}
        <input type="hidden" name="reason" value={reason} />
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger className="w-full rounded-none">
            <SelectValue placeholder="Bitte auswählen…" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            <SelectItem className="rounded-none" value="REPORT_AD">Ich möchte eine Anzeige melden</SelectItem>
            <SelectItem className="rounded-none" value="BUG">Etwas funktioniert nicht</SelectItem>
            <SelectItem className="rounded-none" value="PRAISE">Ich möchte Lob und Kritik hinterlassen</SelectItem>
            <SelectItem className="rounded-none" value="ADVERTISING">Ich möchte Werbung auf TheGND schalten</SelectItem>
            <SelectItem className="rounded-none" value="CUSTOMER_SERVICE">Ich suche den Kontakt zu einem Kundenbetreuer</SelectItem>
            <SelectItem className="rounded-none" value="OTHER">Etwas anderes</SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-[11px] text-gray-500">Bei "Etwas anderes" kannst du unten einen Titel angeben.</p>
      </div>

      {reason === "OTHER" && (
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Titel</label>
          <input
            type="text"
            name="customTitle"
            placeholder="Kurzer Titel"
            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Nachricht</label>
        <textarea
          name="message"
          required
          rows={6}
          placeholder="Dein Feedback…"
          className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Kontaktadresse (optional)</label>
        <input
          type="text"
          name="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="E-Mail oder Telefonnummer"
          className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
        />
        {!!clientError && (
          <div className="mt-1 text-[11px] text-red-600">{clientError}</div>
        )}
      </div>

      <div>
        <button type="submit" className="px-5 py-2 border border-gray-300 text-sm uppercase tracking-widest hover:bg-pink-50/40">
          Absenden
        </button>
      </div>
    </form>
  )
}
