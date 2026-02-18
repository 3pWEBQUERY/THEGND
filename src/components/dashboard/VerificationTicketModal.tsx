"use client"

import { FaWhatsapp, FaEnvelope } from 'react-icons/fa6'
import QRCode from 'react-qr-code'

type Props = {
  open: boolean
  code?: string
  expiresAt?: string | null
  appOrigin: string
  onClose: () => void
}

export default function VerificationTicketModal({ open, code, expiresAt, appOrigin, onClose }: Props) {
  if (!open) return null

  const ticketCode = code || ''
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Dein Verifizierungs-Code: ${ticketCode}\nGültig einmalig. Einlösen: ${appOrigin}/dashboard?tab=comments`
  )}`
  const emailHref = `mailto:?subject=${encodeURIComponent('Dein Verifizierungs-Ticket')}&body=${encodeURIComponent(
    `Dein Verifizierungs-Code: ${ticketCode}\nGültig einmalig. Einlösen: ${appOrigin}/dashboard?tab=comments`
  )}`
  const qrValue = `${appOrigin}/dashboard?tab=comments&code=${encodeURIComponent(ticketCode)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white border border-gray-200 p-6">
        <div className="text-lg font-thin tracking-wider text-gray-800 mb-4">VERIFIZIERUNGS-TICKET</div>
        <div className="text-sm text-gray-700">Diesen Code an deinen Gast weitergeben. Gültig einmalig.</div>
        <div className="mt-3 flex items-center gap-2">
          <input readOnly value={ticketCode} className="flex-1 border border-gray-300 px-3 py-2 text-sm tracking-widest" />
          <button
            onClick={() => {
              try { navigator.clipboard.writeText(ticketCode) } catch {}
            }}
            className="px-3 py-2 border text-xs tracking-widest hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            KOPIEREN
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 border text-xs tracking-widest hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <FaWhatsapp className="h-4 w-4 text-[#25D366]" />
            WHATSAPP
          </a>
          <a
            href={emailHref}
            className="inline-flex items-center gap-2 px-3 py-2 border text-xs tracking-widest hover:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <FaEnvelope className="h-4 w-4 text-gray-700" />
            E‑MAIL
          </a>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="text-xs tracking-widest text-gray-700">QR-CODE ZUM EINLÖSEN</div>
          <div className="bg-white p-3 border border-gray-200">
            <QRCode value={qrValue} size={140} />
          </div>
          <div className="text-[11px] text-gray-500">Scanne den Code und gib den Ticket-Code ein.</div>
        </div>
        {expiresAt && (
          <div className="mt-2 text-[11px] text-gray-500">Ablauf: {new Date(expiresAt).toLocaleDateString('de-DE')}</div>
        )}
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-3 py-2 border text-xs tracking-widest hover:border-pink-500">SCHLIESSEN</button>
        </div>
      </div>
    </div>
  )
}
