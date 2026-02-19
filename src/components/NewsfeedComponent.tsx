'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { getUserTypeDisplayName, formatTimeAgo } from '@/lib/validations'
import { UserType } from '@prisma/client'
import { uploadFiles } from '@/utils/uploadthing'
import CommentsModal from '@/components/CommentsModal'
import CommentsThread from '@/components/CommentsThread'

interface Post {
  id: string
  content: string
  images: string[]
  createdAt: string
  isLikedByUser: boolean
  author: {
    id: string
    email: string
    userType: UserType
    profile?: {
      displayName?: string
      avatar?: string
    }
  }
  _count: {
    likes: number
    comments: number
  }
  likes: any[]
  comments: any[]
}
export default function NewsfeedComponent() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImages, setNewPostImages] = useState<string[]>([])
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [myAvatar, setMyAvatar] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Share Menu State
  const [shareMenuFor, setShareMenuFor] = useState<string | null>(null)
  const [moreMenuFor, setMoreMenuFor] = useState<string | null>(null)
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null)
  const [openCommentsModalFor, setOpenCommentsModalFor] = useState<string | null>(null)
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>('')
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('feed_blocked') || '[]') } catch { return [] }
  })
  const [imageOrientation, setImageOrientation] = useState<Record<string, 'landscape' | 'portrait' | 'square'>>({})

  const openLightbox = (images: string[], index: number) => {
    if (!images || images.length === 0) return
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)
  const showPrev = (e?: any) => {
    if (e) e.stopPropagation()
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }
  const showNext = (e?: any) => {
    if (e) e.stopPropagation()
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  // Detect image orientation on load for single-image posts
  const handleImageLoad = (url: string, e: any) => {
    try {
      const img = e?.currentTarget as HTMLImageElement
      const w = img?.naturalWidth || 0
      const h = img?.naturalHeight || 0
      const o: 'landscape' | 'portrait' | 'square' = w > h ? 'landscape' : w < h ? 'portrait' : 'square'
      setImageOrientation((prev) => (prev[url] === o ? prev : { ...prev, [url]: o }))
    } catch {}
  }

  // Avatar-Normalisierung jetzt in @/utils/avatar (getAvatarUrl)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          setMyAvatar(data?.user?.profile?.avatar || '')
        }
      } catch (e) {
        console.error('Error fetching profile:', e)
      }
    }
    if (session?.user?.id) {
      loadProfile()
    }
  }, [session?.user?.id])

  const onPickFiles = () => fileInputRef.current?.click()

  const onFilesSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || [])
    const allowedImage = ['image/jpeg','image/jpg','image/png','image/webp','image/gif']
    const maxImage = 16 * 1024 * 1024
    const errs: string[] = []
    const accepted: File[] = []
    const previews: string[] = []

    for (const f of files) {
      const isImage = f.type.startsWith('image/')
      if (!isImage) {
        errs.push(`Ungültiger Typ: ${f.name}`)
        continue
      }
      if (!allowedImage.includes(f.type)) {
        errs.push(`Ungültiges Bildformat: ${f.name}`)
        continue
      }
      if (f.size > maxImage) {
        errs.push(`Bild zu groß (max 16MB): ${f.name}`)
        continue
      }
      accepted.push(f)
      previews.push(URL.createObjectURL(f))
    }

    setSelectedFiles(prev => [...prev, ...accepted])
    setFilePreviews(prev => [...prev, ...previews])
    setUploadError(errs.length ? errs[0] : null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeSelectedFile = (index: number) => {
    const url = filePreviews[index]
    if (url) URL.revokeObjectURL(url)
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const revokeAllPreviews = () => {
    filePreviews.forEach((u) => {
      try { URL.revokeObjectURL(u) } catch {}
    })
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim() && selectedFiles.length === 0 && newPostImages.length === 0) return

    setCreating(true)
    try {
      const normalizeUrl = (u: string) => {
        const v = (u || '').trim()
        if (!v) return v
        if (v.startsWith('http://') || v.startsWith('https://')) return v
        return v.startsWith('/') ? v : `/${v}`
      }
      let uploadedUrls: string[] = []
      if (selectedFiles.length > 0) {
        const results = await uploadFiles('postImages', { files: selectedFiles })
        uploadedUrls = results
          .filter((r: any) => typeof r?.url === 'string')
          .map((r: any) => normalizeUrl(r.url as string))
      }

      const existingNormalized = newPostImages.map(normalizeUrl)

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newPostContent,
          images: [...existingNormalized, ...uploadedUrls]
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPosts([data.post, ...posts])
        setNewPostContent('')
        setNewPostImages([])
        setSelectedFiles([])
        revokeAllPreviews()
        setFilePreviews([])
        setUploadError(null)
        setShowCreatePost(false)
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLikedByUser: data.isLiked,
                _count: { ...post._count, likes: data.likesCount }
              }
            : post
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Share helpers
  const getShareUrl = (postId: string) => {
    if (typeof window === 'undefined') return `#post-${postId}`
    return `${window.location.origin}${window.location.pathname}#post-${postId}`
  }

  const onCopyLink = async (postId: string) => {
    try {
      await navigator.clipboard?.writeText(getShareUrl(postId))
    } catch {}
    setShareMenuFor(null)
  }

  const onNativeShare = async (post: Post) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.author.profile?.displayName || post.author.email,
          text: post.content,
          url: getShareUrl(post.id)
        })
      } else {
        await onCopyLink(post.id)
      }
    } catch {}
    setShareMenuFor(null)
  }

  const onShareTo = (platform: 'whatsapp' | 'telegram' | 'x' | 'facebook' | 'email' | 'sms' | 'qr', post: Post) => {
    const url = getShareUrl(post.id)
    const text = post.content || ''
    let shareUrl = ''
    if (platform === 'whatsapp') {
      shareUrl = `https://wa.me/?text=${encodeURIComponent((text + ' ' + url).trim())}`
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    } else if (platform === 'x') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent((text + ' ' + url).trim())}`
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    } else if (platform === 'email') {
      const subject = `Beitrag teilen: ${post.author.profile?.displayName || post.author.email}`
      shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent((text + '\n\n' + url).trim())}`
    } else if (platform === 'sms') {
      const body = encodeURIComponent((text + ' ' + url).trim())
      shareUrl = `sms:?&body=${body}`
    } else if (platform === 'qr') {
      // Open QR code image for the URL in a new tab
      shareUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
    setShareMenuFor(null)
  }

  // Inline edit helpers (placed inside component)
  const startEdit = (post: Post) => {
    setEditPostId(post.id)
    setEditContent(post.content || '')
    setMoreMenuFor(null)
  }

  const saveEdit = async () => {
    if (!editPostId) return
    try {
      const res = await fetch(`/api/posts/${editPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen')
      const updated: Post = data.post
      setPosts((prev: Post[]) => prev.map((p: Post) => p.id === updated.id ? { ...p, content: updated.content, images: (updated as any).images } as any : p))
      setEditPostId(null)
      setEditContent('')
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    }
  }

  const reportPost = async (post: Post) => {
    const reason = window.prompt('Grund für Meldung (optional):') || undefined
    try {
      const res = await fetch(`/api/posts/${post.id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Melden fehlgeschlagen')
      alert('Meldung gesendet. Danke!')
    } catch (e: any) {
      alert(e?.message || 'Fehler')
    } finally {
      setMoreMenuFor(null)
    }
  }

  const unfollowUser = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/follow`, { method: 'DELETE' })
    } catch {}
    setMoreMenuFor(null)
  }

  const blockUser = (userId: string) => {
    setBlockedIds((prev: string[]) => {
      const next = prev.includes(userId) ? prev : [...prev, userId]
      try { localStorage.setItem('feed_blocked', JSON.stringify(next)) } catch {}
      return next
    })
    setMoreMenuFor(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-sm font-light tracking-widest text-gray-600">FEED WIRD GELADEN...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8" onClickCapture={() => { setShareMenuFor(null); setMoreMenuFor(null) }}>
      {/* Create Post */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-8">
          {!showCreatePost ? (
            <div className="flex items-center space-x-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getAvatarUrl(myAvatar, session?.user?.userType)} alt="Mein Avatar" />
                <AvatarFallback className="text-sm font-light tracking-widest bg-gray-100">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <button 
                  className="w-full text-left py-4 px-0 border-b-2 border-gray-200 text-sm font-light tracking-wide text-gray-500 hover:border-pink-500 transition-colors bg-transparent"
                  onClick={() => setShowCreatePost(true)}
                >
                  TEILE DEINE GEDANKEN...
                </button>
              </div>
              <button 
                className="relative group text-xs font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors uppercase"
                onClick={() => setShowCreatePost(true)}
              >
                + BEITRAG ERSTELLEN
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-pink-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getAvatarUrl(myAvatar, session?.user?.userType)} alt="Mein Avatar" />
                  <AvatarFallback className="text-sm font-light tracking-widest bg-gray-100">
                    {session?.user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-light tracking-wide text-gray-800">
                    {session?.user?.email}
                  </div>
                  <div className="text-xs font-light tracking-widest text-gray-500 uppercase mt-1">
                    {getUserTypeDisplayName(session?.user?.userType as UserType)}
                  </div>
                </div>
              </div>
              
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Teile etwas mit der Community..."
                className="min-h-32 resize-none border-0 border-b-2 border-gray-200 rounded-none px-3 sm:px-4 py-4 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent placeholder:text-gray-500"
              />

              {/* Bilder hinzufügen: Hidden File Input + Previews */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={onFilesSelected}
              />
              {uploadError && (
                <div className="text-xs font-light tracking-wide text-pink-600 mt-2">{uploadError}</div>
              )}
              {filePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filePreviews.map((url, idx) => (
                    <div key={idx} className="relative border border-gray-200 p-1">
                      <img src={url} alt={`Ausgewähltes Bild ${idx + 1}`} className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-white/80 text-gray-600 hover:text-gray-800 text-xs px-1"
                        onClick={() => removeSelectedFile(idx)}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4">
                <button 
                  className="text-xs font-light tracking-widest text-gray-500 hover:text-pink-500 transition-colors uppercase"
                  onClick={onPickFiles}
                  disabled={creating}
                >
                  + BILDER HINZUFÜGEN
                </button>
                
                <div className="flex space-x-4">
                  <button 
                    className="text-xs font-light tracking-widest text-gray-600 hover:text-gray-800 transition-colors uppercase"
                    onClick={() => {
                      setShowCreatePost(false)
                      setNewPostContent('')
                      setNewPostImages([])
                      setSelectedFiles([])
                      revokeAllPreviews()
                      setFilePreviews([])
                      setUploadError(null)
                    }}
                  >
                    ABBRECHEN
                  </button>
                  <button 
                    className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 transition-colors disabled:opacity-50 uppercase"
                    onClick={createPost}
                    disabled={creating || (!newPostContent.trim() && selectedFiles.length === 0 && newPostImages.length === 0)}
                  >
                    {creating ? 'WIRD VERÖFFENTLICHT...' : 'VERÖFFENTLICHEN'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length > 0 ? (
        posts
          .filter((post) => !blockedIds.includes(post.author.id))
          .map((post) => {
          const displayName = post.author.profile?.displayName || post.author.email
          
          return (
            <div key={post.id} id={`post-${post.id}`} className="bg-white border border-gray-100 rounded-none">
              <div className="p-4 sm:p-8">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 object-cover">
                      <AvatarImage src={getAvatarUrl(post.author.profile?.avatar, post.author.userType)} alt={`Avatar von ${displayName}`} />
                      <AvatarFallback className="text-sm font-light tracking-widest bg-gray-100">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-light tracking-wide text-gray-800">{displayName}</span>
                        <div className="text-xs font-light tracking-widest text-gray-500 uppercase">
                          {getUserTypeDisplayName(post.author.userType)}
                        </div>
                      </div>
                      <span className="text-xs font-light tracking-wide text-gray-400 mt-1">
                        {formatTimeAgo(new Date(post.createdAt))}
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setMoreMenuFor(moreMenuFor === post.id ? null : post.id)}
                      aria-label="Mehr Aktionen"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {moreMenuFor === post.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-lg z-10">
                        <button
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => { onCopyLink(post.id); setMoreMenuFor(null) }}
                        >
                          Link kopieren
                        </button>
                        {(session?.user?.id && session.user.id === post.author.id) && (
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            onClick={() => startEdit(post)}
                          >
                            Bearbeiten
                          </button>
                        )}
                        {(session?.user?.id && session.user.id !== post.author.id) && (
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            onClick={() => reportPost(post)}
                          >
                            Melden
                          </button>
                        )}
                        {(session?.user?.id && session.user.id !== post.author.id) && (
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                            onClick={() => unfollowUser(post.author.id)}
                          >
                            Unfollow
                          </button>
                        )}
                        {(session?.user?.id && session.user.id !== post.author.id) && (
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => blockUser(post.author.id)}
                          >
                            Blockieren
                          </button>
                        )}
                        {(session?.user?.id && session.user.id === post.author.id) && (
                          <button
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              const ok = window.confirm('Diesen Beitrag löschen?')
                              if (!ok) return
                              try {
                                const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
                                if (res.ok) {
                                  setPosts(prev => prev.filter(p => p.id !== post.id))
                                } else {
                                  const data = await res.json().catch(() => ({}))
                                  alert(data?.error || 'Löschen fehlgeschlagen')
                                }
                              } finally {
                                setMoreMenuFor(null)
                              }
                            }}
                          >
                            Beitrag löschen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Post Content */}
                <div className="mb-6">
                  {editPostId === post.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-24 border border-gray-200 rounded-none px-3 py-2 text-sm font-light focus:border-pink-500 focus:ring-0 bg-white"
                      />
                      <div className="flex items-center gap-3">
                        <button className="px-3 py-2 border text-xs uppercase tracking-widest hover:border-pink-500" onClick={saveEdit}>Speichern</button>
                        <button className="px-3 py-2 border text-xs uppercase tracking-widest hover:border-pink-500" onClick={() => { setEditPostId(null); setEditContent('') }}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  )}
                  
                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    post.images.length === 1 ? (
                      <div className="mt-6">
                        <div 
                          className="relative group cursor-zoom-in"
                          onClick={() => openLightbox(post.images, 0)}
                        >
                          <img
                            src={post.images[0]}
                            alt={`Beitragsbild 1`}
                            onLoad={(e) => handleImageLoad(post.images[0], e)}
                            className={
                              imageOrientation[post.images[0]] === 'landscape'
                                ? 'w-full h-auto max-h-[560px] object-cover rounded-none'
                                : 'h-96 w-auto object-cover rounded-none mx-auto'
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {post.images.map((image, index) => (
                          <div 
                            key={index} 
                            className="relative group cursor-zoom-in" 
                            onClick={() => openLightbox(post.images, index)}
                          >
                            <img 
                              src={image} 
                              alt={`Beitragsbild ${index + 1}`}
                              className="w-full h-64 sm:h-80 object-cover rounded-none"
                            />
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
                
                {/* Post Stats */}
                <div className="flex items-center justify-between text-xs font-light tracking-widest text-gray-400 mb-4 pb-4 border-b border-gray-100">
                  <span>{post._count.likes} GEFÄLLT MIR</span>
                  <span>{post._count.comments} KOMMENTARE</span>
                </div>
                
                {/* Post Actions */}
                <div className="flex items-center space-x-4 sm:space-x-8">
                  <button 
                    aria-label="Gefällt mir"
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center space-x-2 text-xs font-light tracking-widest transition-colors ${
                      post.isLikedByUser 
                        ? 'text-pink-500 hover:text-pink-600' 
                        : 'text-gray-400 hover:text-pink-500'
                    }`}
                  >
                    <Heart 
                      className={`h-4 w-4 ${post.isLikedByUser ? 'fill-current' : ''}`} 
                    />
                    <span className="hidden sm:inline">GEFÄLLT MIR</span>
                  </button>
                  
                  <button 
                    aria-label="Kommentieren"
                    className="flex items-center space-x-2 text-xs font-light tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => { setOpenCommentsModalFor(post.id); setReplyToCommentId(null) }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">KOMMENTIEREN</span>
                  </button>
                  
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      aria-label="Teilen"
                      className="flex items-center space-x-2 text-xs font-light tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShareMenuFor(shareMenuFor === post.id ? null : post.id)
                      }}
                    >
                      <Share className="h-4 w-4" />
                      <span className="hidden sm:inline">TEILEN</span>
                    </button>
                    {shareMenuFor === post.id && (
                      <div 
                        className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 shadow-lg z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onNativeShare(post)}
                        >
                          Mit System teilen
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onCopyLink(post.id)}
                        >
                          Link kopieren
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('whatsapp', post)}
                        >
                          WhatsApp
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('telegram', post)}
                        >
                          Telegram
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('x', post)}
                        >
                          X (Twitter)
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('facebook', post)}
                        >
                          Facebook
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('sms', post)}
                        >
                          SMS
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('email', post)}
                        >
                          E-Mail
                        </button>
                        <div className="h-px bg-gray-100 my-1" />
                        <button 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                          onClick={() => onShareTo('qr', post)}
                        >
                          QR-Code
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Comments Preview */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="space-y-4">
                      {post.comments.slice(0, 2).map((comment: any) => (
                        <div key={comment.id} className={`flex items-start space-x-3 ${comment.parentId ? 'pl-8' : ''}`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatarUrl(comment.author.profile?.avatar, comment.author.userType)} alt={`Avatar von ${comment.author.profile?.displayName || comment.author.email}`} />
                            <AvatarFallback className="text-xs font-light tracking-widest bg-gray-100">
                              {(comment.author.profile?.displayName || comment.author.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-xs font-light tracking-wide text-gray-800">
                              {comment.author.profile?.displayName || comment.author.email}
                            </span>
                            <span className="text-xs font-light tracking-wide text-gray-600 ml-2">
                              {comment.content}
                            </span>
                            <div className="mt-1">
                              <button
                                type="button"
                                className="text-[10px] tracking-widest text-gray-500 hover:text-gray-700 uppercase"
                                onClick={() => { setOpenCommentsModalFor(post.id); setReplyToCommentId(comment.id) }}
                              >
                                ANTWORTEN
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {post.comments.length > 2 && (
                        <button className="text-xs font-light tracking-widest text-gray-500 hover:text-gray-700 transition-colors uppercase" onClick={() => { setOpenCommentsModalFor(post.id); setReplyToCommentId(null) }}>
                          ALLE {post.comments.length} KOMMENTARE ANZEIGEN
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Comments Thread is now rendered via Modal below */}
              </div>
            </div>
          )
        })
      ) : (
        <div className="bg-white border border-gray-100 rounded-none">
          <div className="p-12 text-center">
            <div className="text-gray-400">
              <Heart className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">NOCH KEINE BEITRÄGE</h3>
              <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
              <p className="text-sm font-light tracking-wide text-gray-500">
                Folge anderen Nutzern oder erstelle deinen ersten Beitrag
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      <CommentsModal
        open={!!openCommentsModalFor}
        onClose={() => { setOpenCommentsModalFor(null); setReplyToCommentId(null) }}
        title="KOMMENTARE"
      >
        {openCommentsModalFor && (
          <CommentsThread
            postId={openCommentsModalFor}
            initialReplyToId={replyToCommentId || undefined}
            onCountChange={(count) => {
              setPosts((prev) => prev.map((p) => p.id === openCommentsModalFor ? { ...p, _count: { ...p._count, comments: count } } : p))
            }}
          />
        )}
      </CommentsModal>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev/Next */}
          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 text-white/80 hover:text-white"
                onClick={showPrev}
                aria-label="Vorheriges Bild"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                className="absolute right-4 text-white/80 hover:text-white"
                onClick={showNext}
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Media */}
          <img
            src={lightboxImages[lightboxIndex]}
            alt={`Bild ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
