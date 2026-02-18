'use client'

import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { uploadFiles } from '@/utils/uploadthing'

export default function ProfileBannerDrawer(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { open, onOpenChange } = props
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const onSave = async () => {
    if (!file) return
    try {
      setSaving(true)
      const res = await uploadFiles('postImages', { files: [file] })
      const url = Array.isArray(res) ? (res[0]?.url as string | undefined) : undefined
      if (!url) return
      // Read current preferences
      let currentPrefs: any = {}
      try {
        const curRes = await fetch('/api/profile', { cache: 'no-store' })
        if (curRes.ok) {
          const data: any = await curRes.json().catch(() => ({}))
          const raw = (data?.user?.profile as any)?.preferences
          currentPrefs = typeof raw === 'string' ? JSON.parse(raw) : (raw || {})
        }
      } catch {}
      const nextPrefs = { ...currentPrefs, publicHero: { ...(currentPrefs?.publicHero || {}), imageUrl: url } }
      const r = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData: { preferences: nextPrefs } }),
      })
      if (!r.ok) return
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[90]" />
        <Dialog.Content className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[100] border-l border-gray-200 focus:outline-none">
          <div className="p-6 space-y-4">
            <Dialog.Title className="text-lg font-thin tracking-widest text-gray-800 uppercase">Profil Banner</Dialog.Title>
            <p className="text-sm text-gray-600">Lade ein Bild hoch, das als Hintergrund im öffentlichen Profil-Hero verwendet wird.</p>
            <input type="file" accept="image/*" onChange={onFile} />
            {preview && (
              <div className="border border-gray-200 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Vorschau" className="w-full h-48 object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => onOpenChange(false)} className="px-4 py-2 text-xs tracking-widest uppercase border border-gray-300 text-gray-700 hover:border-pink-500 hover:text-pink-600">Abbrechen</button>
              <button onClick={onSave} disabled={!file || saving} className={`px-4 py-2 text-xs tracking-widest uppercase ${saving ? 'bg-pink-400' : 'bg-pink-500 hover:bg-pink-600'} text-white`}>{saving ? 'Speichern…' : 'Speichern'}</button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
