'use client'

import DashboardHeader from '@/components/DashboardHeader'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Footer from '@/components/homepage/Footer'
import { uploadFiles } from '@/utils/uploadthing'

function UploadCard({
  title,
  description,
  required = false,
  accept,
  file,
  onFile,
  progress = 0,
}: {
  title: string
  description?: string
  required?: boolean
  accept: string
  file: File | null
  onFile: (f: File | null) => void
  progress?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const open = () => inputRef.current?.click()
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) onFile(f)
  }
  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
  }
  const previewUrl = file ? URL.createObjectURL(file) : null
  const sizeText = file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ''

  return (
    <div className="flex flex-col sm:flex-row gap-4 border border-gray-200 p-4" onDragOver={onDragOver} onDrop={onDrop}>
      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-100 flex items-center justify-center text-xs text-gray-500 select-none overflow-hidden">
        {previewUrl ? (
          accept.includes('video') && file?.type.startsWith('video') ? (
            <video src={previewUrl} className="w-full h-full object-cover" muted />
          ) : (
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="text-center">
            DATEI
            <br />
            HOCHLADEN
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-light tracking-widest text-gray-800">
          {title} {required && <span className="text-red-600">*</span>}
        </div>
        {description && <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">{description}</div>}
        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <Button type="button" onClick={open} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-2 text-xs uppercase rounded-none">
            Datei hochladen
          </Button>
          <input ref={inputRef} type="file" accept={accept} capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <div className="text-xs text-gray-700 truncate">
              {file.name}
              <span className="ml-2 text-gray-500">({sizeText})</span>
              <button type="button" onClick={() => onFile(null)} className="ml-2 text-pink-600 hover:underline">Entfernen</button>
            </div>
          ) : (
            <div className="text-[11px] sm:text-xs text-gray-500 leading-snug whitespace-normal break-words min-w-0">Ziehen & Ablegen oder erlaubte Typen: {accept}</div>
          )}
        </div>
        {progress > 0 && (
          <div className="mt-2 h-1 bg-gray-200">
            <div className="h-1 bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userEmail = session?.user?.email ?? 'Gast'
  const isEscort = (session?.user as any)?.userType === 'ESCORT'

  // Auth guard: redirect unauthenticated users to sign-in
  // MEMBER users cannot access the verify page
  useEffect(() => {
    if (status === 'unauthenticated') {
      const cb = encodeURIComponent('/verify')
      router.replace(`/auth/signin?callbackUrl=${cb}`)
    }
    if (status === 'authenticated' && (session?.user as any)?.userType === 'MEMBER') {
      router.replace('/dashboard')
    }
  }, [status, session, router])

  // Basic details
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [idNumber, setIdNumber] = useState('')

  // Files
  const [idPhoto, setIdPhoto] = useState<File | null>(null)
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null)
  const [idVideo, setIdVideo] = useState<File | null>(null)
  const [progIdPhoto, setProgIdPhoto] = useState(0)
  const [progSelfie, setProgSelfie] = useState(0)
  const [progVideo, setProgVideo] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' })

  const imageAccept = '.jpg,.jpeg,.png,.gif,.bmp,.tif,.tiff,.webp'
  const videoAccept = '.flv,.wmv,.3gp,.mkv,.mp4,.avi,.mov'

  const canSubmit = useMemo(() => {
    return firstName.trim() && lastName.trim() && birthDate && idNumber.trim() && idPhoto && selfiePhoto
  }, [firstName, lastName, birthDate, idNumber, idPhoto, selfiePhoto])

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      setMessage({ type: null, text: '' })
      if (!canSubmit) {
        setMessage({ type: 'error', text: 'Bitte fülle alle Pflichtfelder aus und lade die erforderlichen Dateien hoch.' })
        return
      }
      // 1) Upload via UploadThing (sequential for per-file progress)
      let idPhotoRes: any = null
      let selfiePhotoRes: any = null
      let idVideoRes: any = null
      if (idPhoto) {
        const res = await uploadFiles('verificationDocs', { files: [idPhoto], onUploadProgress: (p: any) => setProgIdPhoto(p?.progress ?? 0) })
        idPhotoRes = res?.[0]
      }
      if (selfiePhoto) {
        const res = await uploadFiles('verificationDocs', { files: [selfiePhoto], onUploadProgress: (p: any) => setProgSelfie(p?.progress ?? 0) })
        selfiePhotoRes = res?.[0]
      }
      if (idVideo) {
        const res = await uploadFiles('verificationDocs', { files: [idVideo], onUploadProgress: (p: any) => setProgVideo(p?.progress ?? 0) })
        idVideoRes = res?.[0]
      }

      // 2) Send JSON payload with URLs to API
      const res = await fetch('/api/verify', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          birthDate,
          idNumber,
          idPhotoUrl: idPhotoRes?.url || null,
          selfiePhotoUrl: selfiePhotoRes?.url || null,
          idVideoUrl: idVideoRes?.url || null,
        })
      })
      if (!res.ok) throw new Error('Fehler beim Senden')
      setMessage({ type: 'success', text: 'Verifizierung eingereicht. Wir informieren dich per E‑Mail.' })

      // reset minimal
      setIdPhoto(null)
      setSelfiePhoto(null)
      setIdVideo(null)
      setProgIdPhoto(0)
      setProgSelfie(0)
      setProgVideo(0)
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'Senden fehlgeschlagen' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DashboardHeader session={session} activeTab="settings" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl font-light tracking-widest text-gray-900">VERIFIZIEREN</h1>
        <div className="w-24 h-px bg-pink-500 mt-3" />

        <div className="mt-6 border border-gray-200 p-4 sm:p-6">
          <h2 className="text-sm font-light tracking-widest text-gray-800 flex items-center gap-2">
            <span>{isEscort ? '18+ Altersverifizierung' : 'Identitätsverifizierung'}</span>
          </h2>
          <p className="mt-3 text-sm text-gray-700">
            {isEscort
              ? 'Um nachzuweisen, dass du mindestens 18 Jahre alt bist, fülle bitte das untenstehende Formular aus und gib es ab:'
              : 'Um deine Identität zu bestätigen und den Verifiziert‑Badge zu erhalten, fülle bitte das untenstehende Formular aus und gib es ab:'}
          </p>
          <ul className="mt-3 text-sm text-gray-700 list-disc pl-5">
            <li>ein Foto deines Ausweisdokuments</li>
            <li>ein Foto, auf dem du das Dokument nah an dein Gesicht hältst</li>
          </ul>
          <p className="mt-3 text-sm text-red-600">Der Name, {isEscort ? 'das Geburtsdatum' : 'die Angaben'} und das Foto müssen auf den Fotos gut lesbar sein.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="first" className="text-xs font-light tracking-widest text-gray-800 uppercase">ERSTER NAME <span className="text-red-600">*</span></Label>
              <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Erster Name" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent" />
            </div>
            <div>
              <Label htmlFor="last" className="text-xs font-light tracking-widest text-gray-800 uppercase">NACHNAME <span className="text-red-600">*</span></Label>
              <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nachname" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent" />
            </div>
            <div>
              <Label htmlFor="birth" className="text-xs font-light tracking-widest text-gray-800 uppercase">DEIN GEBURTSDATUM <span className="text-red-600">*</span></Label>
              <Input id="birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent" />
            </div>
            <div>
              <Label htmlFor="idnum" className="text-xs font-light tracking-widest text-gray-800 uppercase">ID‑NUMMER <span className="text-red-600">*</span></Label>
              <Input id="idnum" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Ausweis-/Passnummer" className="mt-2 border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent" />
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <UploadCard
              title={isEscort ? 'Personalausweis (*oder was angefordert wurde)' : 'Ausweisdokument (*oder was angefordert wurde)'}
              description={`Deutlich lesbares Foto des Personalausweises für EU‑Bürger oder deutlich lesbares Foto des Reisepasses (für Nicht‑EU‑Bürger).`}
              required
              accept={imageAccept}
              file={idPhoto}
              onFile={setIdPhoto}
              progress={progIdPhoto}
            />
            <UploadCard
              title={isEscort ? 'Dein Foto mit Ausweis (*oder was angefordert wurde)' : 'Selfie mit Ausweis (*oder was angefordert wurde)'}
              description={`Foto von dir, wie du das Dokument nah an dein Gesicht hältst (das gleiche Dokument wie oben).`}
              required
              accept={imageAccept}
              file={selfiePhoto}
              onFile={setSelfiePhoto}
              progress={progSelfie}
            />
            <UploadCard
              title={isEscort ? 'Dein Video mit dem Ausweis (optional)' : 'Kurzes Video mit Ausweis (optional)'}
              description={`Video von dir, wie du das Dokument nahe an dein Gesicht hältst (optional).`}
              accept={videoAccept}
              file={idVideo}
              onFile={setIdVideo}
              progress={progVideo}
            />
          </div>

          <div className="mt-8">
            <Button onClick={handleSubmit} disabled={submitting || !canSubmit} className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-3 text-sm uppercase rounded-none disabled:opacity-60">
              {submitting ? 'Senden…' : 'Senden'}
            </Button>
            {message.type && (
              <p className={message.type === 'success' ? 'mt-2 text-xs text-pink-600' : 'mt-2 text-xs text-red-600'} aria-live="polite">{message.text}</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Mit dem Absenden erklärst du dich damit einverstanden, dass wir die bereitgestellten Informationen ausschließlich zur Altersverifizierung verarbeiten.
        </div>
      </div>
      <Footer />
    </>
  )
}
