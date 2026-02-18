"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminSelect from '@/components/admin/AdminSelect'

export default function CreateUserForm({ defaultType = 'MEMBER' }: { defaultType?: 'MEMBER' | 'ESCORT' | 'AGENCY' | 'CLUB' | 'STUDIO' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState(defaultType)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/acp/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType }),
      })
      if (!res.ok) throw new Error(await res.text())
      setEmail('')
      setPassword('')
      setUserType('MEMBER')
      router.refresh()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-gray-200 rounded-none p-4 bg-white space-y-3">
      <div className="text-sm font-medium text-gray-800">Neuen User erstellen</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-none px-3 py-2 text-sm"
        />
        <AdminSelect
          name="userType"
          value={userType}
          onChange={(v) => setUserType(v as any)}
          options={[
            { value: 'MEMBER', label: 'MEMBER' },
            { value: 'ESCORT', label: 'ESCORT' },
            { value: 'AGENCY', label: 'AGENCY' },
            { value: 'CLUB', label: 'CLUB' },
            { value: 'STUDIO', label: 'STUDIO' },
          ]}
        />
      </div>
      <button type="submit" disabled={loading} className="px-4 py-2 rounded-none border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
        {loading ? 'Erstellen...' : 'Erstellen'}
      </button>
    </form>
  )
}
