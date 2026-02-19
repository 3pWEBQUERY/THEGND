'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarUrl } from '@/utils/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Plus, Eye, Clock, Image, X } from 'lucide-react'
import { getUserTypeDisplayName } from '@/lib/validations'
import { uploadFiles } from '@/utils/uploadthing'

interface Story {
  id: string
  content: string
  image?: string
  video?: string
  createdAt: string
  expiresAt: string
  author: {
    id: string
    email: string
    userType: string
    profile?: {
      displayName?: string
      avatar?: string
    }
  }
  views: any[]
  _count: {
    views: number
  }
}

export default function StoriesComponent() {
  const { data: session } = useSession()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [newStory, setNewStory] = useState({
    content: '',
    image: ''
  })
  const [creating, setCreating] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<Array<{ name: string; url: string; mediaType: 'image' | 'video'; size: number; posterDataUrl?: string }>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [authorSequence, setAuthorSequence] = useState<Story[]>([])
  const [seqIndex, setSeqIndex] = useState(0)
  // Auto-advance + progress state for viewer
  const [autoAdvancePaused, setAutoAdvancePaused] = useState(false)
  const [progress, setProgress] = useState(0) // 0..100
  const advanceTimerRef = useRef<number | null>(null)
  const progressRafRef = useRef<number | null>(null)
  const progressStartRef = useRef<number | null>(null)
  const lastItemIdRef = useRef<string | null>(null)

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return
    const maxImageSize = 16 * 1024 * 1024
    const maxVideoSize = 256 * 1024 * 1024
    const allowedImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideo = ['video/mp4', 'video/webm', 'video/quicktime']

    const arr = Array.from(files)
    const valid: File[] = []
    const previews: Array<{ name: string; url: string; mediaType: 'image' | 'video'; size: number; posterDataUrl?: string }> = []
    let errorMsg: string | null = null

    for (const f of arr) {
      const isImage = f.type.startsWith('image/')
      const isVideo = f.type.startsWith('video/')
      if (!isImage && !isVideo) {
        errorMsg = 'Ungültiger Dateityp. Erlaubt sind Bilder (JPEG, PNG, WebP, GIF) und Videos (MP4, WebM, MOV).'
        continue
      }
      if (isImage && (!allowedImage.includes(f.type) || f.size > maxImageSize)) {
        errorMsg = 'Ein Bild ist ungültig oder zu groß (max. 16MB).'
        continue
      }
      if (isVideo && (!allowedVideo.includes(f.type) || f.size > maxVideoSize)) {
        errorMsg = 'Ein Video ist ungültig oder zu groß (max. 256MB).'
        continue
      }
      valid.push(f)
      previews.push({
        name: f.name,
        url: URL.createObjectURL(f),
        mediaType: isImage ? 'image' : 'video',
        size: f.size,
      })
    }

    setUploadError(errorMsg)
    setSelectedFiles(prev => [...prev, ...valid])
    // Persist previews immediately
    setFilePreviews(prev => {
      const startIndex = prev.length
      const next = [...prev, ...previews]
      // For added video previews, generate poster frames asynchronously
      previews.forEach((p, idx) => {
        const absoluteIndex = startIndex + idx
        if (p.mediaType === 'video') {
          generatePosterFromVideoUrl(p.url).then((poster) => {
            if (poster) {
              setFilePreviews(cur => cur.map((cp, i) => i === absoluteIndex ? { ...cp, posterDataUrl: poster } : cp))
            }
          }).catch(() => {})
        }
      })
      return next
    })
  }

  async function generatePosterFromVideoUrl(url: string, seekTime: number = 0.1): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video')
        video.src = url
        video.crossOrigin = 'anonymous'
        video.muted = true
        video.playsInline = true
        const onLoaded = async () => {
          try {
            if (!isFinite(video.duration) || video.duration === 0) {
              // fallback: still try first frame
            }
            const target = Math.min(seekTime, Math.max(0, (video.duration || 1) - 0.01))
            const seekHandler = () => {
              try {
                const canvas = document.createElement('canvas')
                canvas.width = video.videoWidth || 720
                canvas.height = video.videoHeight || 1280
                const ctx = canvas.getContext('2d')
                if (!ctx) return resolve(null)
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
                resolve(dataUrl)
              } catch {
                resolve(null)
              } finally {
                cleanup()
              }
            }
            video.currentTime = target
            video.addEventListener('seeked', seekHandler, { once: true })
          } catch {
            cleanup(); resolve(null)
          }
        }
        const cleanup = () => {
          video.removeEventListener('loadeddata', onLoaded)
          video.src = ''
        }
        video.addEventListener('loadeddata', onLoaded, { once: true })
        video.addEventListener('error', () => { cleanup(); resolve(null) }, { once: true })
      } catch {
        resolve(null)
      }
    })
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    fetchStories()
  }, [])

  // Auto-advance current image in viewer after 10s and animate progress
  useEffect(() => {
    if (!viewDialogOpen || authorSequence.length === 0) return
    // Clear previous timers/raf
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = null
    }
    const current = authorSequence[seqIndex]
    if (!current) return
    // Reset progress when switching items
    if (lastItemIdRef.current !== current.id) {
      setProgress(0)
      lastItemIdRef.current = current.id
    }
    if (autoAdvancePaused) return
    if (current.image) {
      const total = 10000 // 10s
      const startAt = Date.now() - Math.round((progress / 100) * total)
      progressStartRef.current = startAt
      const tick = () => {
        if (!progressStartRef.current) return
        const elapsed = Date.now() - progressStartRef.current
        const pct = Math.min(100, Math.max(0, (elapsed / total) * 100))
        setProgress(pct)
        if (pct < 100 && !autoAdvancePaused) {
          progressRafRef.current = requestAnimationFrame(tick)
        }
      }
      progressRafRef.current = requestAnimationFrame(tick)
      advanceTimerRef.current = window.setTimeout(() => {
        setSeqIndex((i) => {
          const next = i + 1
          if (next >= authorSequence.length) {
            setViewDialogOpen(false)
            return i
          }
          return next
        })
      }, 10000)
    }
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      if (progressRafRef.current) {
        cancelAnimationFrame(progressRafRef.current)
        progressRafRef.current = null
      }
    }
  }, [viewDialogOpen, authorSequence, seqIndex, autoAdvancePaused])

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories')
      if (response.ok) {
        const data = await response.json()
        setStories(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const createStory = async () => {
    if (!newStory.content.trim() && selectedFiles.length === 0) return

    setCreating(true)
    try {
      let uploaded: Array<{ url: string; mediaType: 'image' | 'video'; index: number }> = []
      if (selectedFiles.length > 0) {
        const results = await uploadFiles('storyMedia', {
          files: selectedFiles,
        })
        uploaded = results
          .map((r: any, i: number) => ({ r, i }))
          .filter(({ r }: any) => typeof r?.url === 'string')
          .map(({ r, i }: any) => ({
            url: r.url as string,
            mediaType: (selectedFiles[i]?.type?.startsWith('video/') || (typeof r.type === 'string' && r.type.startsWith('video/'))) ? 'video' : 'image',
            index: i,
          }))
      }

      const created: Story[] = []
      if (uploaded.length > 0) {
        for (const item of uploaded) {
          const body: any = { content: newStory.content }
          if (item.mediaType === 'image') body.image = item.url
          if (item.mediaType === 'video') {
            body.video = item.url
            const preview = filePreviews[item.index]
            if (preview?.posterDataUrl) {
              body.posterDataUrl = preview.posterDataUrl
            }
          }
          const res = await fetch('/api/stories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          if (res.ok) {
            const story = await res.json()
            created.push(story)
          }
        }
      } else {
        // Nur Text-Story
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newStory.content })
        })
        if (res.ok) {
          const story = await res.json()
          created.push(story)
        }
      }

      if (created.length > 0) {
        // Neu erstellte Stories oben einfügen
        setStories(prev => [...created, ...prev])
        setNewStory({ content: '', image: '' })
        setSelectedFiles([])
        setFilePreviews([])
        setCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Story:', error)
    } finally {
      setCreating(false)
    }
  }

  const viewStory = async (story: Story) => {
    setSelectedStory(story)
    // Sequenz gleicher Autoren innerhalb 24h um die ausgewählte Story bilden
    const dayMs = 24 * 60 * 60 * 1000
    const selTs = new Date(story.createdAt).getTime()
    const seq = stories
      .filter(s => s.author.id === story.author.id && Math.abs(new Date(s.createdAt).getTime() - selTs) <= dayMs)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    setAuthorSequence(seq)
    const idx = seq.findIndex(s => s.id === story.id)
    setSeqIndex(idx >= 0 ? idx : 0)
    setViewDialogOpen(true)

    // Register story view
    try {
      await fetch(`/api/stories/${story.id}/view`, {
        method: 'POST'
      })
      
      // Update local story view count if not already viewed
      if (!story.views.length) {
        setStories(prev => prev.map(s => 
          s.id === story.id 
            ? { ...s, _count: { views: s._count.views + 1 }, views: [{}] }
            : s
        ))
      }
    } catch (error) {
      console.error('Fehler beim Registrieren der Story-Ansicht:', error)
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Abgelaufen'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const canCreateStories = session?.user?.userType !== 'MEMBER'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-sm font-light tracking-widest text-gray-600">STORIES WERDEN GELADEN...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Create Story Section */}
      {canCreateStories && (
        <div className="bg-white border border-gray-100 rounded-none">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-2">STORIES</h2>
              <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
              <p className="text-sm font-light tracking-wide text-gray-600">
                Teile temporäre Updates, die nach 24 Stunden verschwinden
              </p>
            </div>
            
            <div className="flex justify-center">
              <button 
                className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 transition-colors uppercase flex items-center space-x-2"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>STORY ERSTELLEN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="bg-white border border-gray-100 rounded-none cursor-pointer hover:border-pink-200 transition-colors"
            onClick={() => viewStory(story)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(story.author.profile?.avatar, story.author.userType)} />
                    <AvatarFallback className="text-xs font-light tracking-widest bg-gray-100">
                      {story.author.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-light tracking-wide text-gray-800">
                      {story.author.profile?.displayName || story.author.email}
                    </div>
                    <div className="text-xs font-light tracking-widest text-gray-500 uppercase mt-1">
                      {getUserTypeDisplayName(story.author.userType as any)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-light tracking-wide text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeRemaining(story.expiresAt)}</span>
                </div>
              </div>
              
              {(story.image || story.video) && (
                <div className="mb-4">
                  {story.image ? (
                    <img
                      src={story.image}
                      alt="Story"
                      className="w-full h-64 md:h-64 object-cover rounded-none"
                    />
                  ) : (
                    <video
                      src={story.video!}
                      className="w-full h-64 md:h-64 object-cover rounded-none"
                      controls
                    />
                  )}
                </div>
              )}
              
              <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed line-clamp-3 mb-4">
                {story.content}
              </p>
              
              <div className="flex items-center justify-between text-xs font-light tracking-wide text-gray-400 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Eye className="h-3 w-3" />
                  <span>{story._count.views} AUFRUFE</span>
                </div>
                <span>{new Date(story.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stories.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-none">
          <div className="p-12 text-center">
            <div className="text-gray-400">
              <Image className="h-16 w-16 mx-auto mb-6 opacity-30" />
              <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE STORIES VERFÜGBAR</h3>
              <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
              <p className="text-sm font-light tracking-wide text-gray-500">
                {canCreateStories 
                  ? 'Erstelle deine erste Story oder folge anderen Nutzern'
                  : 'Folge anderen Nutzern, um ihre Stories zu sehen'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-end sm:items-center justify-center z-[10010] sm:p-6">
          <div className="bg-white w-full sm:max-w-lg rounded-none max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="p-4 sm:p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-thin tracking-wider text-gray-800 mb-2">NEUE STORY ERSTELLEN</h3>
                <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                <p className="text-sm font-light tracking-wide text-gray-600">
                  Deine Story ist 24 Stunden sichtbar
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-light tracking-widest text-gray-800 uppercase mb-3">INHALT</div>
                  <Textarea
                    placeholder="Was möchtest du teilen?"
                    value={newStory.content}
                    onChange={(e) => setNewStory(prev => ({ ...prev, content: e.target.value }))}
                    maxLength={500}
                    className="min-h-24 resize-none border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                  <div className="text-xs font-light tracking-wide text-gray-400 mt-2">
                    {newStory.content.length}/500 Zeichen
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-light tracking-widest text-gray-800 uppercase mb-3">MEDIEN HOCHLADEN (BILDER/VIDEOS)</div>
                  <Input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent"
                  />
                  <div className="text-xs font-light tracking-wide text-gray-400 mt-2">
                    Bilder bis 16MB, Videos bis 256MB. Mehrfachauswahl möglich.
                  </div>
                  {uploadError && (
                    <div className="text-xs font-light tracking-wide text-pink-600 mt-2">{uploadError}</div>
                  )}
                  {filePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {filePreviews.map((p, idx) => (
                        <div key={idx} className="relative border border-gray-200 p-1">
                          {p.mediaType === 'image' ? (
                            <img src={p.url} alt={p.name} className="w-full h-20 object-cover" />
                          ) : (
                            <video src={p.url} className="w-full h-20 object-cover" />
                          )}
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-white/80 text-gray-600 hover:text-gray-800"
                            onClick={() => removeSelectedFile(idx)}
                            aria-label="Datei entfernen"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button 
                    className="text-xs font-light tracking-widest text-gray-600 hover:text-gray-800 transition-colors uppercase"
                    onClick={() => {
                      setCreateDialogOpen(false)
                      setNewStory({ content: '', image: '' })
                    }}
                  >
                    ABBRECHEN
                  </button>
                  <button 
                    className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-6 py-3 transition-colors disabled:opacity-50 uppercase"
                    onClick={createStory}
                    disabled={creating || (!newStory.content.trim() && selectedFiles.length === 0)}
                  >
                    {creating ? 'WIRD ERSTELLT...' : 'STORY ERSTELLEN'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story View Dialog */}
      {viewDialogOpen && selectedStory && (
        <div
          className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-6"
        >
          <div className="bg-white w-full max-w-3xl h-[85vh] overflow-hidden rounded-none">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getAvatarUrl(selectedStory.author.profile?.avatar, selectedStory.author.userType)} />
                    <AvatarFallback className="text-sm font-light tracking-widest bg-gray-100">
                      {selectedStory.author.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-light tracking-wide text-gray-800">
                      {selectedStory.author.profile?.displayName || selectedStory.author.email}
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="text-xs font-light tracking-widest text-gray-500 uppercase">
                        {getUserTypeDisplayName(selectedStory.author.userType as any)}
                      </div>
                      <span className="text-xs font-light tracking-wide text-gray-400">
                        {formatTimeRemaining(selectedStory.expiresAt)} verbleibend
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/40"
                  onClick={() => setViewDialogOpen(false)}
                  aria-label="Viewer schließen"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {authorSequence.length > 0 ? (
                  <>
                    {/* Segmented progress bar */}
                    <div className="w-full flex items-center gap-1 mb-2" aria-label="Story Fortschrittsanzeige">
                      {authorSequence.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 bg-gray-200 overflow-hidden`}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={authorSequence.length}
                          aria-valuenow={seqIndex + 1}
                        >
                          <div
                            className={`h-full ${i <= seqIndex ? 'bg-pink-500' : 'bg-transparent'}`}
                            style={{ width: i < seqIndex ? '100%' : i === seqIndex ? `${progress}%` : '0%' }}
                          />
                        </div>
                      ))}
                    </div>
                    {(authorSequence[seqIndex].image || authorSequence[seqIndex].video) && (
                      <div
                        className="w-full"
                        onMouseEnter={() => setAutoAdvancePaused(true)}
                        onMouseLeave={() => setAutoAdvancePaused(false)}
                      >
                        {authorSequence[seqIndex].image ? (
                          <img
                            src={authorSequence[seqIndex].image!}
                            alt="Story"
                            className="w-full h-[60vh] md:h-[65vh] object-cover rounded-none"
                          />
                        ) : (
                          <video
                            src={authorSequence[seqIndex].video!}
                            className="w-full h-[60vh] md:h-[65vh] object-cover rounded-none"
                            controls
                            autoPlay
                            muted
                            playsInline
                            onLoadedMetadata={(e) => {
                              const el = e.currentTarget
                              if (el.duration && isFinite(el.duration)) {
                                setProgress((el.currentTime / el.duration) * 100)
                              } else {
                                setProgress(0)
                              }
                            }}
                            onTimeUpdate={(e) => {
                              const el = e.currentTarget
                              if (el.duration && isFinite(el.duration)) {
                                setProgress((el.currentTime / el.duration) * 100)
                              }
                            }}
                            onEnded={() => {
                              setSeqIndex((i) => {
                                const next = i + 1
                                if (next >= authorSequence.length) {
                                  setViewDialogOpen(false)
                                  return i
                                }
                                return next
                              })
                            }}
                          />
                        )}
                      </div>
                    )}
                    <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed">
                      {authorSequence[seqIndex].content}
                    </p>
                    <div className="flex items-center justify-between text-xs font-light tracking-wide text-gray-400 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>{authorSequence[seqIndex]._count.views} AUFRUFE</span>
                      </div>
                      <span>{new Date(authorSequence[seqIndex].createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                    {authorSequence.length > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          className="text-xs font-light tracking-widest text-gray-600 hover:text-gray-800 uppercase disabled:opacity-50"
                          onClick={() => setSeqIndex(i => Math.max(0, i - 1))}
                          disabled={seqIndex === 0}
                        >
                          ZURÜCK
                        </button>
                        <div className="text-xs font-light tracking-wide text-gray-500">
                          {seqIndex + 1}/{authorSequence.length}
                        </div>
                        <button
                          className="text-xs font-light tracking-widest text-gray-600 hover:text-gray-800 uppercase disabled:opacity-50"
                          onClick={() => setSeqIndex(i => Math.min(authorSequence.length - 1, i + 1))}
                          disabled={seqIndex === authorSequence.length - 1}
                        >
                          WEITER
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {selectedStory.image ? (
                      <img
                        src={selectedStory.image}
                        alt="Story"
                        className="w-full h-[60vh] md:h-[65vh] object-cover rounded-none"
                      />
                    ) : selectedStory.video ? (
                      <video
                        src={selectedStory.video}
                        className="w-full h-[60vh] md:h-[65vh] object-cover rounded-none"
                        controls
                        autoPlay
                        muted
                        playsInline
                      />
                    ) : null}
                    <p className="text-sm font-light tracking-wide text-gray-700 leading-relaxed">
                      {selectedStory.content}
                    </p>
                    <div className="flex items-center justify-between text-xs font-light tracking-wide text-gray-400 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4" />
                        <span>{selectedStory._count.views} AUFRUFE</span>
                      </div>
                      <span>{new Date(selectedStory.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}