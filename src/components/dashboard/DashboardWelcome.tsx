"use client"

import { useEffect, useState } from 'react'

export default function DashboardWelcome() {
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, messages: 0 })

  useEffect(() => {
    async function loadStats() {
      try {
        const [socialRes, postsRes, messagesRes] = await Promise.all([
          fetch('/api/social'),
          fetch('/api/posts/count'),
          fetch('/api/messages'),
        ])

        let followers = 0, following = 0
        if (socialRes.ok) {
          const data = await socialRes.json()
          followers = data.followersCount ?? 0
          following = data.followingCount ?? 0
        }

        let posts = 0
        if (postsRes.ok) {
          const data = await postsRes.json()
          posts = data.count ?? 0
        }

        let messages = 0
        if (messagesRes.ok) {
          const data = await messagesRes.json()
          if (Array.isArray(data)) {
            messages = data.reduce((sum: number, c: any) => sum + (Number(c.unread_count) || 0), 0)
          }
        }

        setStats({ posts, followers, following, messages })
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-none">
      <div className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-2">WILLKOMMEN IN DEINEM DASHBOARD</h2>
          <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
          <p className="text-sm font-light tracking-wide text-gray-600">
            Verwalte dein Profil, vernetzen dich mit anderen und bleib auf dem Laufenden
          </p>
        </div>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">{stats.posts}</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">BEITRÄGE</div>
          </div>
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">{stats.followers}</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLLOWER</div>
          </div>
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">{stats.following}</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLGE ICH</div>
          </div>
          <div className="text-center p-6 bg-gray-50">
            <div className="text-xl font-thin tracking-wider text-gray-800 mb-2">{stats.messages}</div>
            <div className="text-xs font-light tracking-widest text-gray-500 uppercase">NACHRICHTEN</div>
          </div>
        </div>
      </div>
    </div>
  )
}
