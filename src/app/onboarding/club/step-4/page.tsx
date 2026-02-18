'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { uploadFiles } from '@/utils/uploadthing'

export default function ClubOnboardingStep4() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)

  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [logoSelected, setLogoSelected] = useState<File | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Array<{ url: string; filename: string; type: string; mediaType: 'image'|'video'; size: number }>>([])
  const [isUploading, setIsUploading] = useState(false)

  const [errors, setErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const formatBytes = (bytes: number) => {
    const sizes = ['B','KB','MB','GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  useEffect(() => {
    if (!isEditMode) return
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/onboarding/club/step-4')
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        if (typeof data.logo === 'string' && data.logo.length) {
          setLogoUrl(data.logo)
        }
        if (Array.isArray(data.media) && data.media.length) {
          setUploaded(data.media)
        } else if (Array.isArray(data.gallery) && data.gallery.length) {
          const mapped = data.gallery.map((url: string) => ({ url, filename: url.split('/').pop() || url, type: 'image', mediaType: 'image' as const, size: 0 }))
          setUploaded(mapped)
        }
      } catch {}
    })()
    return () => { active = false }
  }, [isEditMode])

  const onPickLogo = () => logoInputRef.current?.click()

  const onLogoSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = (e.target.files && e.target.files[0]) || null
    const newErrors: string[] = []
    if (file) {
      const allowedImage = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']
      const maxImage = 8 * 1024 * 1024
      if (!file.type.startsWith('image/') || !allowedImage.includes(file.type)) {
        newErrors.push(`Ungültiges Logoformat: ${file.name}`)
      } else if (file.size > maxImage) {
        newErrors.push(`Logo zu groß (max 8MB): ${file.name}`)
      }
    }
    setErrors(newErrors)
    setLogoSelected(file)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const uploadLogo = async () => {
    if (!logoSelected) return
    setLogoUploading(true)
    setErrors([])
    try {
      const results = await uploadFiles('storyMedia', { files: [logoSelected] })
      const first = results.find((r: any) => typeof r?.url === 'string')
      if (first?.url) setLogoUrl(first.url as string)
      setLogoSelected(null)
    } catch {
      setErrors(['Fehler beim Logo-Upload'])
    } finally {
      setLogoUploading(false)
    }
  }

  const clearLogo = () => setLogoUrl(null)

  const onPickFiles = () => galleryInputRef.current?.click()

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || [])
    const newErrors: string[] = []
    const accepted: File[] = []
    const maxImage = 16 * 1024 * 1024
    const maxVideo = 256 * 1024 * 1024
    const allowedImage = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']
    const allowedVideo = ['video/mp4','video/webm','video/quicktime']

    for (const f of files) {
      const isImage = f.type.startsWith('image/')
      const isVideo = f.type.startsWith('video/')
      if (!isImage && !isVideo) { newErrors.push(`Ungültiger Typ: ${f.name}`); continue }
      if (isImage && !allowedImage.includes(f.type)) { newErrors.push(`Ungültiges Bildformat: ${f.name}`); continue }
      if (isVideo && !allowedVideo.includes(f.type)) { newErrors.push(`Ungültiges Videoformat: ${f.name}`); continue }
      if (isImage && f.size > maxImage) { newErrors.push(`Bild zu groß (max 16MB): ${f.name}`); continue }
      if (isVideo && f.size > maxVideo) { newErrors.push(`Video zu groß (max 256MB): ${f.name}`); continue }
      accepted.push(f)
    }

    setSelectedFiles(prev => [...prev, ...accepted])
    setErrors(newErrors)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const removeSelected = (idx: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))

  const uploadAll = async () => {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setErrors([])
    try {
      // Respect UploadThing limits per request
      const images = selectedFiles.filter((f) => f.type.startsWith('image/'))
      const videos = selectedFiles.filter((f) => f.type.startsWith('video/'))

      const batches: File[][] = []
      for (let i = 0; i < images.length; i += 10) batches.push(images.slice(i, i + 10))
      for (let i = 0; i < videos.length; i += 2) batches.push(videos.slice(i, i + 2))

      const allResults: any[] = []
      for (const batch of batches) {
        if (batch.length === 0) continue
        const res = await uploadFiles('storyMedia', { files: batch })
        allResults.push(...res)
      }

      const files = allResults
        .filter((r: any) => typeof r?.url === 'string')
        .map((r: any) => {
          const url = r.url as string
          const t = (typeof r.type === 'string' ? r.type : '')
          const mediaType = t.startsWith('video/') ? 'video' as const : 'image' as const
          const filename = url.split('/').pop() || url
          return { url, filename, type: t, mediaType, size: 0 }
        })
      setUploaded(prev => [...prev, ...files])
      setSelectedFiles([])
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : ''
      setErrors([msg ? `Fehler beim Upload: ${msg}` : 'Fehler beim Upload', 'Hinweis: Max. 10 Bilder und 2 Videos pro Upload.'])
    } finally {
      setIsUploading(false)
    }
  }

  const deleteUploaded = (filename: string) => setUploaded(prev => prev.filter(f => f.filename !== filename))

  const saveAndNext = async () => {
    if (!logoUrl && uploaded.length === 0) {
      router.push(addEditParam('/onboarding/club/step-5'))
      return
    }

    setIsSaving(true)
    setErrors([])
    try {
      const payload: any = {}
      if (logoUrl) payload.logo = logoUrl
      if (uploaded.length) payload.media = uploaded
      const res = await fetch('/api/onboarding/club/step-4', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const out = await res.json().catch(() => ({}))
        setErrors([out.error || 'Speichern fehlgeschlagen'])
        return
      }
      router.push(addEditParam('/onboarding/club/step-5'))
    } catch {
      setErrors(['Speichern fehlgeschlagen'])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href={addEditParam('/onboarding')} className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUM ONBOARDING
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">CLUB-EINRICHTUNG – SCHRITT 4/7</div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen flex justify-center px-6 pt-20 pb-24">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">MEDIEN</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto mb-4">Logo & Galerie – Schritt 4 von 7</p>
            <div className="flex justify-center"><Badge className="bg-pink-500 text-white font-light tracking-widest px-4 py-1 rounded-none">SCHRITT 4/7</Badge></div>
          </div>

          {errors.length > 0 && (
            <div className="p-4 mb-6 border border-red-200 bg-red-50 text-sm text-red-700 font-light">{errors.map((er, i) => (<div key={i}>{er}</div>))}</div>
          )}

          <div className="space-y-4 mb-10">
            <div className="text-xs uppercase tracking-widest text-gray-500">Club-Logo</div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={onLogoSelected} />
            <div className="border border-gray-200 bg-gray-50 p-6 text-center cursor-pointer hover:border-pink-500 transition-colors rounded-none" onClick={onPickLogo}>
              <div className="text-sm font-light text-gray-600">Klicke hier, um ein Logo (Bild) auszuwählen (≤ 8MB)</div>
            </div>
            {logoSelected && (
              <div className="border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm font-light text-gray-700">
                  <span className="truncate mr-3">{logoSelected.name} · {formatBytes(logoSelected.size)}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="rounded-none text-xs py-1 px-2" onClick={() => setLogoSelected(null)}>Entfernen</Button>
                    <Button type="button" className="rounded-none bg-pink-500 hover:bg-pink-600 text-white text-xs py-1 px-2" onClick={uploadLogo} disabled={logoUploading}>{logoUploading ? 'Lädt hoch…' : 'Hochladen'}</Button>
                  </div>
                </div>
              </div>
            )}
            {logoUrl && (
              <div className="border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Aktuelles Logo</div>
                <div className="flex items-center gap-4">
                  <img src={logoUrl} alt="Logo" className="h-20 w-20 object-cover border" />
                  <Button type="button" variant="outline" className="rounded-none text-xs py-1 px-2" onClick={clearLogo}>Logo entfernen</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="text-xs uppercase tracking-widest text-gray-500">Galerie & Medien</div>
            <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onFilesSelected} />
            <div className="border border-gray-200 bg-gray-50 p-6 text-center cursor-pointer hover:border-pink-500 transition-colors rounded-none" onClick={onPickFiles}>
              <div className="text-sm font-light text-gray-600">Dateien hier klicken, um Bilder/Videos auszuwählen (Bilder ≤ 16MB, Videos ≤ 256MB)</div>
            </div>
            {selectedFiles.length > 0 && (
              <div className="border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Ausgewählt</div>
                <ul className="space-y-2 text-sm font-light text-gray-700">
                  {selectedFiles.map((f, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span className="truncate mr-3">{f.name} · {formatBytes(f.size)}</span>
                      <Button type="button" variant="outline" onClick={() => removeSelected(idx)} className="rounded-none text-xs py-1 px-2">Entfernen</Button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Button type="button" onClick={uploadAll} disabled={isUploading} className="rounded-none bg-pink-500 hover:bg-pink-600 text-white">{isUploading ? 'Lädt hoch…' : 'Alle hochladen'}</Button>
                </div>
              </div>
            )}
            {uploaded.length > 0 && (
              <div className="border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Hochgeladen</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {uploaded.map((f) => (
                    <div key={f.filename} className="border border-gray-200 p-2">
                      {f.mediaType === 'image' ? (<img src={f.url} alt={f.filename} className="w-full h-32 object-cover" />) : (<video src={f.url} controls className="w-full h-32 object-cover" />)}
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                        <span className="truncate" title={f.filename}>{f.filename}</span>
                        <button onClick={() => deleteUploaded(f.filename)} className="text-red-600 hover:underline">Löschen</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-8">
            <Button type="button" variant="outline" onClick={() => router.push(addEditParam('/onboarding'))} className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none">Zurück</Button>
            <Button type="button" onClick={saveAndNext} disabled={isSaving} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none">{isSaving ? 'Speichert…' : 'Speichern & Weiter'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
