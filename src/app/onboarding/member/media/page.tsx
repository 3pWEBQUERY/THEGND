'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadFiles } from '@/utils/uploadthing'

export default function MemberMediaStepPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const addEditParam = (href: string) => (isEditMode ? `${href}?edit=1` : href)

  // Avatar input and state
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Gallery input and state (max 20 images)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploaded, setUploaded] = useState<Array<{ url: string; filename: string; type: string; mediaType: 'image'; size: number }>>([])
  const [isGalleryUploading, setIsGalleryUploading] = useState(false)

  // UI state
  const [errors, setErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Prefill in edit mode
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!isEditMode) return
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        const current = data?.user?.profile?.avatar
        if (typeof current === 'string' && current.length) setAvatarUrl(current)
        const gallery = data?.user?.profile?.gallery
        if (Array.isArray(gallery) && gallery.length) {
          const mapped = gallery.map((url: string) => ({
            url,
            filename: url.split('/').pop() || url,
            type: 'image',
            mediaType: 'image' as const,
            size: 0,
          }))
          setUploaded(mapped)
        }
      } catch {
        // ignore optional prefill
      }
    }
    load()
    return () => { active = false }
  }, [isEditMode])

  const onPickFile = () => fileInputRef.current?.click()

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = (e.target.files && e.target.files[0]) || null
    const newErrors: string[] = []
    if (f) {
      const allowedImage = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']
      const maxImage = 8 * 1024 * 1024 // 8MB
      if (!f.type.startsWith('image/') || !allowedImage.includes(f.type)) {
        newErrors.push(`Ungültiges Bildformat: ${f.name}`)
      } else if (f.size > maxImage) {
        newErrors.push(`Bild zu groß (max 8MB): ${f.name}`)
      }
    }
    setErrors(newErrors)
    setSelectedFile(f)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const uploadAvatar = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setErrors([])
    try {
      const results = await uploadFiles('storyMedia', { files: [selectedFile] })
      const first = results.find((r: any) => typeof r?.url === 'string')
      if (first?.url) setAvatarUrl(first.url as string)
      setSelectedFile(null)
    } catch {
      setErrors(['Fehler beim Upload des Profilbildes'])
    } finally {
      setIsUploading(false)
    }
  }

  const clearAvatar = () => setAvatarUrl(null)

  const saveAndReturn = async () => {
    setIsSaving(true)
    setErrors([])
    try {
      // Persist avatar (can be null to clear)
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { avatar: avatarUrl, gallery: uploaded.map(f => f.url) } })
      })
      router.push(addEditParam('/onboarding'))
    } catch {
      setErrors(['Speichern fehlgeschlagen'])
    } finally {
      setIsSaving(false)
    }
  }

  // Gallery handlers
  const onPickFiles = () => galleryInputRef.current?.click()

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || [])
    const newErrors: string[] = []
    const accepted: File[] = []
    const maxImage = 16 * 1024 * 1024
    const allowedImage = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']

    const currentCount = uploaded.length + selectedFiles.length
    for (const f of files) {
      if (!f.type.startsWith('image/') || !allowedImage.includes(f.type)) {
        newErrors.push(`Ungültiges Bildformat: ${f.name}`)
        continue
      }
      if (f.size > maxImage) {
        newErrors.push(`Bild zu groß (max 16MB): ${f.name}`)
        continue
      }
      if (accepted.length + currentCount >= 20) {
        newErrors.push('Maximal 20 Bilder erlaubt. Einige Dateien wurden nicht hinzugefügt.')
        break
      }
      accepted.push(f)
    }

    setSelectedFiles(prev => [...prev, ...accepted])
    setErrors(newErrors)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const removeSelected = (idx: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))

  const uploadAll = async () => {
    if (selectedFiles.length === 0) return
    setIsGalleryUploading(true)
    setErrors([])
    try {
      // Respect UploadThing limits: images(<=10) per request
      const batches: File[][] = []
      for (let i = 0; i < selectedFiles.length; i += 10) batches.push(selectedFiles.slice(i, i + 10))

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
          const filename = url.split('/').pop() || url
          return { url, filename, type: 'image', mediaType: 'image' as const, size: 0 }
        })

      // Enforce 20 images total
      setUploaded(prev => {
        const combined = [...prev, ...files]
        if (combined.length > 20) {
          setErrors((errs) => [...errs, 'Maximal 20 Bilder gespeichert. Überschüssige wurden ignoriert.'])
        }
        return combined.slice(0, 20)
      })
      setSelectedFiles([])
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : ''
      setErrors([msg ? `Fehler beim Upload: ${msg}` : 'Fehler beim Upload', 'Hinweis: Max. 10 Bilder pro Upload.'])
    } finally {
      setIsGalleryUploading(false)
    }
  }

  const deleteUploaded = (filename: string) => {
    setUploaded(prev => prev.filter(f => f.filename !== filename))
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href={addEditParam('/onboarding')} className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ZURÜCK ZUM ONBOARDING
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">
              MITGLIED-EINRICHTUNG – SCHRITT 2/2
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex justify-center px-6 pt-20 pb-24">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">PROFIL-MEDIEN</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto">
              Profilbild hochladen (optional)
            </p>
          </div>

        {/* Gallery Section */}
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-widest text-gray-500">Galerie (bis zu 20 Bilder)</div>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFilesSelected}
          />

          <div
            className="border border-gray-200 bg-gray-50 p-6 text-center cursor-pointer hover:border-pink-500 transition-colors rounded-none"
            onClick={onPickFiles}
          >
            <div className="text-sm font-light text-gray-600">
              Dateien hier klicken, um Bilder auszuwählen (Bilder ≤ 16MB)
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="border border-gray-200 p-4">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Ausgewählt</div>
              <ul className="space-y-2 text-sm font-light text-gray-700">
                {selectedFiles.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span className="truncate mr-3">{f.name}</span>
                    <Button type="button" variant="outline" onClick={() => removeSelected(idx)} className="rounded-none text-xs py-1 px-2">Entfernen</Button>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Button type="button" onClick={uploadAll} disabled={isGalleryUploading} className="rounded-none bg-pink-500 hover:bg-pink-600 text-white">
                  {isGalleryUploading ? 'Lädt hoch…' : 'Alle hochladen'}
                </Button>
              </div>
            </div>
          )}

          {uploaded.length > 0 && (
            <div className="border border-gray-200 p-4">
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Hochgeladen</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {uploaded.map((f) => (
                  <div key={f.filename} className="border border-gray-200 p-2">
                    <img src={f.url} alt={f.filename} className="w-full h-32 object-cover" />
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

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 mb-6 border border-red-200 bg-red-50 text-sm text-red-700 font-light">
              {errors.map((er, i) => (<div key={i}>{er}</div>))}
            </div>
          )}

          {/* Avatar Section */}
        <div className="space-y-4 mb-10">
          <div className="text-xs uppercase tracking-widest text-gray-500">Profilbild</div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />

            <div
              className="border border-gray-200 bg-gray-50 p-6 text-center cursor-pointer hover:border-pink-500 transition-colors rounded-none"
              onClick={onPickFile}
            >
              <div className="text-sm font-light text-gray-600">
                Klicke hier, um ein Profilbild auszuwählen (≤ 8MB)
              </div>
            </div>

            {selectedFile && (
              <div className="border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm font-light text-gray-700">
                  <span className="truncate mr-3">{selectedFile.name}</span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="rounded-none text-xs py-1 px-2" onClick={() => setSelectedFile(null)}>Entfernen</Button>
                    <Button type="button" className="rounded-none bg-pink-500 hover:bg-pink-600 text-white text-xs py-1 px-2" onClick={uploadAvatar} disabled={isUploading}>
                      {isUploading ? 'Lädt hoch…' : 'Hochladen'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {avatarUrl && (
              <div className="border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Aktuelles Profilbild</div>
                <div className="flex items-center gap-4">
                  <img src={avatarUrl} alt="Profilbild" className="h-24 w-24 object-cover border" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600 truncate" title={avatarUrl}>{avatarUrl}</div>
                  </div>
                  <Button type="button" variant="outline" className="rounded-none text-xs py-1 px-2" onClick={clearAvatar}>Bild entfernen</Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-6 pt-8">
            <Button 
              type="button"
              variant="outline"
              onClick={() => router.push(addEditParam('/onboarding'))}
              className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500 rounded-none"
            >
              Zurück
            </Button>
            <Button 
              type="button"
              onClick={saveAndReturn}
              disabled={isSaving}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase rounded-none"
            >
              {isSaving ? 'Speichert…' : 'Speichern & Weiter'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
