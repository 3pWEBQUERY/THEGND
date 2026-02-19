'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function EditUserDialog({
  user,
}: {
  user: { id: string; email: string; userType: string; isActive: boolean }
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(user.email)
  const [userType, setUserType] = useState(user.userType)
  const [isActive, setIsActive] = useState(user.isActive)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleOpen() {
    setEmail(user.email)
    setUserType(user.userType)
    setIsActive(user.isActive)
    setPassword('')
    setOpen(true)
  }

  async function onSave() {
    setLoading(true)
    try {
      const body: any = { email, userType, isActive }
      if (password.trim()) body.password = password
      const res = await fetch(`/api/acp/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      setOpen(false)
      router.refresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="Bearbeiten"
        className="p-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white w-full max-w-md p-6 space-y-4 border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-light tracking-widest text-gray-900">USER BEARBEITEN</h3>
            <div className="h-[2px] w-16 bg-gradient-to-r from-pink-600/0 via-pink-500/80 to-pink-600/0" />

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Neues Passwort (optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leer lassen = unverändert"
                  className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Kontotyp</label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">MEMBER</SelectItem>
                    <SelectItem value="ESCORT">ESCORT</SelectItem>
                    <SelectItem value="HOBBYHURE">HOBBYHURE</SelectItem>
                    <SelectItem value="AGENCY">AGENCY</SelectItem>
                    <SelectItem value="CLUB">CLUB</SelectItem>
                    <SelectItem value="STUDIO">STUDIO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-gray-600 mb-1">Status</label>
                <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setIsActive(v === 'true')}>
                  <SelectTrigger className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Aktiv</SelectItem>
                    <SelectItem value="false">Gesperrt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 rounded-none"
              >
                Abbrechen
              </button>
              <button
                onClick={onSave}
                disabled={loading}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm tracking-widest rounded-none"
              >
                {loading ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
