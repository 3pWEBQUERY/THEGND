'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUploadThing } from '@/utils/uploadthing'
import { useToast } from '@/components/ui/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORIES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'ROOM', label: 'Zimmer' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'EVENT_SPACE', label: 'Eventfläche' },
] as const

type MyRental = {
  id: string
  title: string
  shortDesc: string
  description?: string
  category: string
  location?: string
  city?: string
  country?: string
  media?: string[]
  isActive?: boolean
  createdAt?: string
  priceInfo?: string
  contactInfo?: string
}

export default function RentalsDashboard() {
  const { startUpload, isUploading } = useUploadThing('rentalMedia')
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('APARTMENT')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [priceInfo, setPriceInfo] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const currency = useMemo(() => {
    switch (country) {
      case 'Schweiz':
        return 'CHF'
      case 'Österreich':
      case 'Deutschland':
        return 'EUR'
      default:
        return ''
    }
  }, [country])

  const [myRentals, setMyRentals] = useState<MyRental[] | null>(null)
  const [loadingRentals, setLoadingRentals] = useState(false)

  const pickFiles = () => fileRef.current?.click()

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || [])
    const allowedImage = ['image/jpeg','image/jpg','image/png','image/webp']
    const maxImage = 8 * 1024 * 1024
    const errs: string[] = []
    const ok: File[] = []
    for (const f of files) {
      if (!allowedImage.includes(f.type)) {
        errs.push(`Ungültiges Bildformat: ${f.name}`)
        continue
      }
      if (f.size > maxImage) {
        errs.push(`Bild zu groß (max 8MB): ${f.name}`)
        continue
      }
      ok.push(f)
    }
    setErrors(errs)
    setSelectedFiles(prev => [...prev, ...ok])
    if (fileRef.current) fileRef.current.value = ''
  }

  const uploadAll = async () => {
    if (selectedFiles.length === 0) return
    setErrors([])
    try {
      const res = await startUpload(selectedFiles)
      const urls = (res || []).map((r: any) => r?.ufsUrl || r?.url).filter(Boolean) as string[]
      setMediaUrls(prev => [...prev, ...urls])
      setSelectedFiles([])
    } catch {
      setErrors(['Fehler beim Upload'])
    }
  }

  const removeMedia = (url: string) => {
    setMediaUrls(prev => prev.filter(u => u !== url))
  }

  const resetForm = () => {
    setTitle('')
    setShortDesc('')
    setDescription('')
    setCategory('APARTMENT')
    setLocation('')
    setCity('')
    setCountry('')
    setPriceInfo('')
    setContactInfo('')
    setSelectedFiles([])
    setMediaUrls([])
    setEditingId(null)
  }

  const save = async () => {
    setErrors([])
    setMessage(null)
    if (!title.trim() || !shortDesc.trim() || !description.trim()) {
      setErrors(['Bitte Titel, Kurzbeschreibung und Beschreibung ausfüllen'])
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        title: title.trim(),
        shortDesc: shortDesc.trim(),
        description: description.trim(),
        category,
        location: location.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        priceInfo: priceInfo.trim() || undefined,
        contactInfo: contactInfo.trim() || undefined,
        media: mediaUrls,
      }
      const url = editingId ? `/api/rentals/${editingId}` : '/api/rentals'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out?.error || 'Fehler beim Speichern')
      setMessage(editingId ? 'Angebot aktualisiert' : 'Angebot gespeichert')
      toast.show(editingId ? 'Angebot aktualisiert' : 'Angebot gespeichert', { variant: 'success' })
      resetForm()
      await loadMyRentals()
    } catch (e: any) {
      setErrors([e?.message || 'Fehler beim Speichern'])
      toast.show('Fehler beim Speichern', { variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const loadMyRentals = async () => {
    setLoadingRentals(true)
    try {
      const res = await fetch('/api/rentals?mine=1', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setMyRentals(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setMyRentals([])
    } finally {
      setLoadingRentals(false)
    }
  }

  useEffect(() => { loadMyRentals() }, [])

  const beginEdit = (r: MyRental) => {
    setEditingId(r.id)
    setTitle(r.title || '')
    setShortDesc(r.shortDesc || '')
    setDescription(r.description || '')
    setCategory(r.category || 'APARTMENT')
    setLocation(r.location || '')
    setCity(r.city || '')
    setCountry(r.country || '')
    setPriceInfo(r.priceInfo || '')
    setContactInfo(r.contactInfo || '')
    setMediaUrls(Array.isArray(r.media) ? r.media : [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const setActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/rentals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: active }) })
      if (!res.ok) throw new Error('Aktualisierung fehlgeschlagen')
      await loadMyRentals()
      toast.show(active ? 'Angebot aktiviert' : 'Angebot deaktiviert', { variant: 'success' })
    } catch (e: any) {
      setErrors([e?.message || 'Fehler beim Aktualisieren'])
      toast.show('Fehler beim Aktualisieren', { variant: 'error' })
    }
  }

  const deleteRental = async (id: string) => {
    if (!confirm('Dieses Angebot wirklich löschen?')) return
    try {
      const res = await fetch(`/api/rentals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      await loadMyRentals()
      toast.show('Angebot gelöscht', { variant: 'success' })
    } catch (e: any) {
      setErrors([e?.message || 'Fehler beim Löschen'])
      toast.show('Fehler beim Löschen', { variant: 'error' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-2">ANGEBOT ERSTELLEN</h2>
        <div className="w-16 h-px bg-pink-500 mb-6" />

        {errors.length > 0 && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
        {message && (
          <div className="p-3 mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">{message}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs tracking-widest text-gray-600 mb-2">TITEL</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-none border-gray-300" />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-gray-600 mb-2">KATEGORIE</label>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger className="w-full rounded-none border-gray-300">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs tracking-widest text-gray-600 mb-2">KURZBESCHREIBUNG</label>
            <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="rounded-none border-gray-300" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs tracking-widest text-gray-600 mb-2">BESCHREIBUNG</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[160px] rounded-none border-gray-300" />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-gray-600 mb-2">ORT (FREITEXT)</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-none border-gray-300" />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-gray-600 mb-2">STADT</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-none border-gray-300" />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-gray-600 mb-2">LAND</label>
            <Select value={country} onValueChange={(v) => setCountry(v)}>
              <SelectTrigger className="w-full rounded-none border-gray-300">
                <SelectValue placeholder="Land wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Schweiz">SCHWEIZ</SelectItem>
                <SelectItem value="Österreich">ÖSTERREICH</SelectItem>
                <SelectItem value="Deutschland">DEUTSCHLAND</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs tracking-widest text-gray-600 mb-2">PREIS</label>
            <div className="relative">
              <Input
                value={priceInfo}
                onChange={(e) => setPriceInfo(e.target.value)}
                className="rounded-none border-gray-300 pr-16"
                placeholder={currency ? `z.B. 100 ${currency}` : 'z.B. 100'}
              />
              {currency && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest text-gray-600 pointer-events-none">
                  {currency}
                </span>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs tracking-widest text-gray-600 mb-2">KONTAKT</label>
            <Input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="E-Mail, Telefon oder URL" className="rounded-none border-gray-300" />
          </div>

          {/* Upload */}
          <div className="md:col-span-2">
            <label className="block text-xs tracking-widest text-gray-600 mb-2">MEDIEN (BILDER)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={pickFiles} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600">Dateien auswählen</button>
              <button type="button" onClick={uploadAll} disabled={isUploading || selectedFiles.length===0} className="px-3 py-2 text-xs uppercase tracking-widest bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-60">{isUploading ? 'Lädt…' : 'Hochladen'}</button>
            </div>
            {selectedFiles.length > 0 && (
              <div className="mt-3 text-xs text-gray-600">Ausgewählt: {selectedFiles.map(f => f.name).join(', ')}</div>
            )}
            {mediaUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {mediaUrls.map((u) => (
                  <div key={u} className="relative border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="Rental Media" className="w-full h-28 object-cover" />
                    <button type="button" onClick={() => removeMedia(u)} className="absolute top-1 right-1 text-[10px] uppercase tracking-widest bg-white/90 border border-gray-300 px-2 py-0.5">Löschen</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={save} disabled={saving} className="rounded-none bg-pink-600 hover:bg-pink-700">{saving ? (editingId ? 'Aktualisiert…' : 'Speichert…') : (editingId ? 'Angebot aktualisieren' : 'Angebot speichern')}</Button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-3 py-2 text-xs uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600">Abbrechen</button>
          )}
        </div>
      </div>

      {/* Meine Angebote */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">MEINE ANGEBOTE</h3>
        {loadingRentals ? (
          <div className="text-sm text-gray-500">Lade…</div>
        ) : myRentals && myRentals.length > 0 ? (
          <ul className="space-y-3">
            {myRentals.map(r => (
              <li key={r.id} className="flex items-center justify-between border border-gray-200 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium tracking-wider text-gray-900 truncate">{r.title}</div>
                  <div className="text-xs text-gray-500 truncate">{r.category} · {r.city || ''}{r.city && r.country ? ', ' : ''}{r.country || ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] uppercase tracking-widest ${r.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>{r.isActive ? 'AKTIV' : 'INAKTIV'}</span>
                  <button onClick={() => beginEdit(r)} className="px-2 py-1 text-[11px] uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600">Bearbeiten</button>
                  <button onClick={() => setActive(r.id, !r.isActive)} className="px-2 py-1 text-[11px] uppercase tracking-widest border border-gray-300 hover:border-pink-500 hover:text-pink-600">{r.isActive ? 'Deaktivieren' : 'Aktivieren'}</button>
                  <button onClick={() => deleteRental(r.id)} className="px-2 py-1 text-[11px] uppercase tracking-widest border border-red-300 text-red-600 hover:bg-red-50">Löschen</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">Keine Angebote erstellt.</div>
        )}
      </div>
    </div>
  )
}
