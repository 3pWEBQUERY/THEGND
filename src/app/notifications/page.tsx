'use client'

import DashboardHeader from '@/components/DashboardHeader'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { MessageCircle, UserPlus, Heart, MessageSquare, Rss, Trash2, CheckCheck, Undo2 } from 'lucide-react'

export default function NotificationsPage() {
  const { data: session } = useSession()

  type NotificationItem = {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [markAllBusy, setMarkAllBusy] = useState(false)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />
      case 'follow':
        return <UserPlus className="h-4 w-4" />
      case 'like':
        return <Heart className="h-4 w-4" />
      case 'comment':
        return <MessageSquare className="h-4 w-4" />
      case 'feed':
      case 'post':
        return <Rss className="h-4 w-4" />
      default:
        return <Rss className="h-4 w-4" />
    }
  }

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications?limit=100${unreadOnly ? '&unreadOnly=true' : ''}`)
      if (!res.ok) throw new Error('Load failed')
      const data: NotificationItem[] = await res.json()
      setNotifications(data)
    } catch (e) {
      // optional: console.error(e)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly])

  const handleMark = async (id: string, isRead: boolean) => {
    try {
      setActionId(id)
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      })
      if (!res.ok) throw new Error('Mark failed')
      setNotifications(prev =>
        unreadOnly
          ? prev.filter(n => n.id !== id)
          : prev.map(n => (n.id === id ? { ...n, isRead } : n))
      )
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setActionId(id)
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setNotifications(prev => prev.filter(n => n.id !== id))
    } finally {
      setActionId(null)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setMarkAllBusy(true)
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (!res.ok) throw new Error('Bulk failed')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } finally {
      setMarkAllBusy(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <>
      <DashboardHeader session={session} activeTab="notifications" setActiveTab={() => {}} />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-widest text-gray-900">BENACHRICHTIGUNGEN</h1>
            <div className="w-24 h-px bg-pink-500 mt-3" />
            <p className="text-sm text-gray-600 mt-4">
              Alle Aktivitäten auf einen Blick. Neue Benachrichtigungen sind hervorgehoben.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setUnreadOnly(v => !v)}
              className={`whitespace-nowrap text-[11px] sm:text-xs uppercase tracking-wide sm:tracking-widest px-3 py-2 border rounded transition-colors ${
                unreadOnly ? 'border-pink-500 text-pink-600 bg-pink-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {unreadOnly ? 'UNGELESENE • AN' : 'UNGELESENE'}
            </button>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllBusy || unreadCount === 0}
              className={`whitespace-nowrap text-[11px] sm:text-xs uppercase tracking-wide sm:tracking-widest px-3 py-2 border rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                unreadCount > 0 ? 'border-gray-200 text-gray-700 hover:bg-gray-50' : 'border-gray-200 text-gray-400'
              }`}
            >
              ALLE ALS GELESEN
            </button>
          </div>
        </div>

        <div className="mt-8 border border-gray-200">
          {loading ? (
            <div className="p-6 text-sm font-light tracking-wide text-gray-500">Wird geladen...</div>
          ) : notifications.length === 0 ? (
            <div className="p-10 text-center text-sm font-light tracking-wide text-gray-500">
              {unreadOnly ? 'Keine ungelesenen Benachrichtigungen' : 'Keine Benachrichtigungen vorhanden'}
            </div>
          ) : (
            <ul>
              {notifications.map(n => (
                <li
                  key={n.id}
                  className={`flex items-start gap-4 p-4 border-b border-gray-100 ${n.isRead ? '' : 'bg-pink-50/40'}`}
                >
                  <div className="mt-0.5 text-gray-500">{renderIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-light tracking-wide text-gray-800 truncate">{n.title}</div>
                      <div className="text-xs font-light tracking-wide text-gray-400 shrink-0">{formatTime(n.createdAt)}</div>
                    </div>
                    <div className="text-xs font-light tracking-wide text-gray-600 mt-0.5 break-words">{n.message}</div>
                    <div className="mt-3 flex items-center gap-3">
                      {n.isRead ? (
                        <button
                          type="button"
                          onClick={() => handleMark(n.id, false)}
                          disabled={actionId === n.id}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-600 hover:text-pink-600 disabled:opacity-50"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Als ungelesen
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMark(n.id, true)}
                          disabled={actionId === n.id}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-700 hover:text-pink-600 disabled:opacity-50"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Als gelesen
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        disabled={actionId === n.id}
                        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Löschen
                      </button>
                    </div>
                  </div>
                  {!n.isRead && <span className="h-2 w-2 bg-pink-500 rounded-full mt-2"></span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
