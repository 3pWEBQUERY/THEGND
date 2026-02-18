'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Check, 
  CheckCheck,
  Search,
  Users,
  ArrowLeft
} from 'lucide-react'
import { getUserTypeDisplayName } from '@/lib/validations'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    email: string
    userType: string
    profile?: {
      displayName?: string
      avatar?: string
    }
  }
  receiver: {
    id: string
    email: string
    userType: string
    profile?: {
      displayName?: string
      avatar?: string
    }
  }
}

interface Conversation {
  id: string
  content: string
  senderId: string
  receiverId: string
  createdAt: string
  partner_email: string
  partner_user_type: string
  partner_display_name?: string
  partner_avatar?: string
  unread_count: number
}

interface User {
  id: string
  email: string
  userType: string
  profile?: {
    displayName?: string
    avatar?: string
  }
}

export default function MessagingComponent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newConversationOpen, setNewConversationOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [prefill, setPrefill] = useState<{ id: string; name?: string; avatar?: string; userType?: string } | null>(null)
  const [translations, setTranslations] = useState<Record<string, { t: string; tr: boolean; showOrig: boolean }>>({})

  useEffect(() => {
    fetchConversations()
  }, [])

  // Read `to` from query params to open/start a conversation directly
  useEffect(() => {
    const to = searchParams.get('to')
    const toName = searchParams.get('toName') || undefined
    const toAvatar = searchParams.get('toAvatar') || undefined
    if (to) {
      setSelectedConversation(to)
      setPrefill({ id: to, name: toName, avatar: toAvatar, userType: 'ESCORT' })
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.id) return
      const list = messages.filter(m => m.senderId !== session.user.id && !translations[m.id])
      for (const m of list) {
        try {
          const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: m.content, targetLang: 'Deutsch' }) })
          if (!res.ok) {
            setTranslations(prev => ({ ...prev, [m.id]: { t: m.content, tr: false, showOrig: false } }))
            continue
          }
          const data = await res.json().catch(() => ({}))
          const translated = typeof data?.translated === 'string' ? data.translated : ''
          const tr = translated && translated.trim() !== m.content.trim()
          setTranslations(prev => ({ ...prev, [m.id]: { t: translated || m.content, tr, showOrig: false } }))
        } catch {
          setTranslations(prev => ({ ...prev, [m.id]: { t: m.content, tr: false, showOrig: false } }))
        }
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, session?.user?.id])

  // Focus message textarea when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      textareaRef.current?.focus()
    }
  }, [selectedConversation])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        fetchSearchUsers()
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Unterhaltungen:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/messages?conversationWith=${selectedConversation}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Nachrichten:', error)
    }
  }

  const fetchSearchUsers = async () => {
    try {
      const response = await fetch(`/api/users/search?search=${encodeURIComponent(searchQuery)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Fehler beim Suchen von Benutzern:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const message = await response.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
        
        // Update conversations list
        fetchConversations()
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error)
    } finally {
      setSending(false)
    }
  }

  const startNewConversation = (userId: string) => {
    setSelectedConversation(userId)
    setNewConversationOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
    }
  }

  const getSelectedConversationInfo = () => {
    if (!selectedConversation) return null
    if (prefill && prefill.id === selectedConversation) {
      return {
        name: prefill.name || '',
        avatar: prefill.avatar,
        userType: prefill.userType
      }
    }
    
    const conversation = conversations.find(c => 
      (c.senderId === selectedConversation && c.receiverId === session?.user?.id) ||
      (c.receiverId === selectedConversation && c.senderId === session?.user?.id)
    )
    
    if (conversation) {
      return {
        name: conversation.partner_display_name || conversation.partner_email,
        avatar: conversation.partner_avatar,
        userType: conversation.partner_user_type
      }
    }
    
    // If no conversation exists yet, try to find user info from search
    const user = searchResults.find(u => u.id === selectedConversation)
    if (user) {
      return {
        name: user.profile?.displayName || user.email,
        avatar: user.profile?.avatar,
        userType: user.userType
      }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-sm font-light tracking-widest text-gray-600">NACHRICHTEN WERDEN GELADEN...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-4 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-2">NACHRICHTEN</h2>
            <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
            <p className="text-sm font-light tracking-wide text-gray-600">
              Verbinden und kommunizieren Sie mit anderen Mitgliedern
            </p>
          </div>
        </div>
      </div>
      
      {/* Mobile layout: single-pane flow */}
      <div className="bg-white border border-gray-100 rounded-none sm:hidden">
        {!selectedConversation ? (
          <div className="h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-start">
              <h2 className="text-base font-thin tracking-wider text-gray-800">NACHRICHTEN</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map(conversation => {
                const isSelected = selectedConversation === (
                  conversation.senderId === session?.user?.id 
                    ? conversation.receiverId 
                    : conversation.senderId
                )
                return (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-pink-50 border-pink-100' : ''
                    }`}
                    onClick={() => setSelectedConversation(
                      conversation.senderId === session?.user?.id 
                        ? conversation.receiverId 
                        : conversation.senderId
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 bg-gray-100 flex items-center justify-center">
                        {conversation.partner_avatar ? (
                          <img 
                            src={conversation.partner_avatar} 
                            alt="Avatar" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-light tracking-widest text-gray-600">
                            {conversation.partner_email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-light tracking-wide text-gray-800 truncate">
                            {conversation.partner_display_name || conversation.partner_email}
                          </div>
                          <div className="text-xs font-light tracking-wide text-gray-400">
                            {formatTime(conversation.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-light tracking-wide text-gray-600 truncate">
                            {conversation.content}
                          </p>
                          {conversation.unread_count > 0 && (
                            <div className="bg-pink-500 text-white text-xs font-light tracking-widest px-2 py-1 rounded-full ml-2">
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {conversations.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
                  <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE UNTERHALTUNGEN</h3>
                  <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                  <p className="text-sm font-light tracking-wide text-gray-500">Starten Sie eine neue Unterhaltung</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[75vh]">
            <div className="p-4 border-b border-gray-100 bg-white flex items-center">
              <button
                onClick={() => setSelectedConversation(null)}
                aria-label="Zurück"
                className="mr-2 text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {(() => {
                const info = getSelectedConversationInfo()
                return info ? (
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 bg-gray-100 flex items-center justify-center">
                      {info.avatar ? (
                        <img src={info.avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-light tracking-widest text-gray-600">
                          {info.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-light tracking-wide text-gray-800">{info.name}</div>
                      <div className="text-[10px] font-light tracking-widest text-gray-500 uppercase">
                        {getUserTypeDisplayName(info.userType as any)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-light tracking-wide text-gray-800">KONVERSATION</div>
                )
              })()}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {prefill && selectedConversation === prefill.id && messages.length === 0 && (
                <div className="mb-3 text-[11px] font-light tracking-widest text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2">
                  Neue Unterhaltung mit {prefill.name || 'Nutzer'} gestartet. Schreibe eine Nachricht…
                </div>
              )}
              <div className="space-y-3">
                {messages.map(message => {
                  const isOwnMessage = message.senderId === session?.user?.id
                  const tr = translations[message.id]
                  const showTranslated = tr && tr.tr && !tr.showOrig && !isOwnMessage
                  const textToShow = showTranslated ? tr!.t : message.content
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-none ${isOwnMessage ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-sm font-light tracking-wide">{textToShow}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-2 text-[11px] font-light tracking-wide ${isOwnMessage ? 'text-pink-100' : 'text-gray-500'}`}>
                          {!isOwnMessage && tr?.tr && !tr.showOrig && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 uppercase tracking-widest">Übersetzt</span>
                          )}
                          {!isOwnMessage && tr?.tr && (
                            <button
                              className={`${isOwnMessage ? '' : 'text-gray-600 hover:text-gray-800'} uppercase tracking-widest`}
                              onClick={() => setTranslations(prev => ({ ...prev, [message.id]: { ...(prev[message.id] || { t: message.content, tr: false, showOrig: false }), showOrig: !prev[message.id]?.showOrig } }))}
                            >
                              {tr.showOrig ? 'Übersetzung anzeigen' : 'Original anzeigen'}
                            </button>
                          )}
                          <span>{formatTime(message.createdAt)}</span>
                          {isOwnMessage && (message.isRead ? (<CheckCheck className="h-3 w-3" />) : (<Check className="h-3 w-3" />))}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white sticky bottom-0">
              <div className="flex space-x-3">
                <textarea
                  placeholder="Gebe deine Nachricht ein..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  ref={textareaRef}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none border-0 border-b-2 border-gray-200 rounded-none px-0 py-2 text-sm font-light focus:border-pink-500 focus:outline-none bg-transparent"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white p-3 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="hidden sm:flex h-[600px] bg-white border border-gray-100 rounded-none">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-100">
        <div className="h-full">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-thin tracking-wider text-gray-800">NACHRICHTEN</h2>
              <button 
                className="text-xs font-light tracking-widest text-pink-500 hover:text-pink-600 transition-colors uppercase"
                onClick={() => setNewConversationOpen(true)}
              >
                + NEU
              </button>
            </div>
          </div>
          <div className="h-[500px] overflow-y-auto">
            {conversations.map(conversation => {
              const isSelected = selectedConversation === (
                conversation.senderId === session?.user?.id 
                  ? conversation.receiverId 
                  : conversation.senderId
              )
              
              return (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-pink-50 border-pink-100' : ''
                  }`}
                  onClick={() => setSelectedConversation(
                    conversation.senderId === session?.user?.id 
                      ? conversation.receiverId 
                      : conversation.senderId
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="h-10 w-10 bg-gray-100 flex items-center justify-center">
                      {conversation.partner_avatar ? (
                        <img 
                          src={conversation.partner_avatar} 
                          alt="Avatar" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-light tracking-widest text-gray-600">
                          {conversation.partner_email.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-light tracking-wide text-gray-800 truncate">
                          {conversation.partner_display_name || conversation.partner_email}
                        </div>
                        <div className="text-xs font-light tracking-wide text-gray-400">
                          {formatTime(conversation.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-light tracking-wide text-gray-600 truncate">
                          {conversation.content}
                        </p>
                        {conversation.unread_count > 0 && (
                          <div className="bg-pink-500 text-white text-xs font-light tracking-widest px-2 py-1 rounded-full ml-2">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {conversations.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
                <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE UNTERHALTUNGEN</h3>
                <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                <p className="text-sm font-light tracking-wide text-gray-500">Starten Sie eine neue Unterhaltung</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-100 bg-white">
              {(() => {
                const info = getSelectedConversationInfo()
                return info ? (
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-100 flex items-center justify-center">
                      {info.avatar ? (
                        <img 
                          src={info.avatar} 
                          alt="Avatar" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-light tracking-widest text-gray-600">
                          {info.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-light tracking-wide text-gray-800">{info.name}</div>
                      <div className="text-xs font-light tracking-widest text-gray-500 uppercase">
                        {getUserTypeDisplayName(info.userType as any)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-light tracking-wide text-gray-800">KONVERSATION</div>
                )
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto">
              {prefill && selectedConversation === prefill.id && messages.length === 0 && (
                <div className="mb-4 text-[11px] font-light tracking-widest text-gray-600 bg-gray-50 border border-gray-200 px-3 py-2">
                  Neue Unterhaltung mit {prefill.name || 'Nutzer'} gestartet. Schreibe eine Nachricht…
                </div>
              )}
              <div className="space-y-4">
                {messages.map(message => {
                  const isOwnMessage = message.senderId === session?.user?.id
                  const tr = translations[message.id]
                  const showTranslated = tr && tr.tr && !tr.showOrig && !isOwnMessage
                  const textToShow = showTranslated ? tr!.t : message.content
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-none ${
                        isOwnMessage 
                          ? 'bg-pink-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm font-light tracking-wide">{textToShow}</p>
                        <div className={`flex items-center justify-end mt-2 space-x-2 text-xs font-light tracking-wide ${
                          isOwnMessage ? 'text-pink-100' : 'text-gray-500'
                        }`}>
                          {!isOwnMessage && tr?.tr && !tr.showOrig && (
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 uppercase tracking-widest">Übersetzt</span>
                          )}
                          {!isOwnMessage && tr?.tr && (
                            <button
                              className={`${isOwnMessage ? '' : 'text-gray-600 hover:text-gray-800'} uppercase tracking-widest`}
                              onClick={() => setTranslations(prev => ({ ...prev, [message.id]: { ...(prev[message.id] || { t: message.content, tr: false, showOrig: false }), showOrig: !prev[message.id]?.showOrig } }))}
                            >
                              {tr.showOrig ? 'Übersetzung anzeigen' : 'Original anzeigen'}
                            </button>
                          )}
                          <span>{formatTime(message.createdAt)}</span>
                          {isOwnMessage && (
                            message.isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex space-x-3">
                <textarea
                  placeholder="Gebe deine Nachricht ein..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  ref={textareaRef}
                  className="flex-1 min-h-[40px] max-h-[120px] resize-none border-0 border-b-2 border-gray-200 rounded-none px-0 py-2 text-sm font-light focus:border-pink-500 focus:outline-none bg-transparent"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white p-3 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-20 w-20 mx-auto mb-6 opacity-30 text-gray-400" />
              <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-2">UNTERHALTUNG AUSWÄHLEN</h3>
              <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
              <p className="text-sm font-light tracking-wide text-gray-500">
                Wählen Sie eine Unterhaltung aus der Liste oder erstellen Sie eine neue
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      {newConversationOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white max-w-lg w-full rounded-none">
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-thin tracking-wider text-gray-800 mb-2">NEUE UNTERHALTUNG</h3>
                <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                <p className="text-sm font-light tracking-wide text-gray-600">
                  Suchen Sie nach einem Benutzer, um eine neue Unterhaltung zu beginnen
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-0 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Benutzer suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-0 border-b-2 border-gray-200 rounded-none pl-6 pr-0 py-3 text-sm font-light focus:border-pink-500 focus:outline-none bg-transparent"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => startNewConversation(user.id)}
                    >
                      <div className="h-8 w-8 bg-gray-100 flex items-center justify-center">
                        {user.profile?.avatar ? (
                          <img 
                            src={user.profile.avatar} 
                            alt="Avatar" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-light tracking-widest text-gray-600">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-light tracking-wide text-gray-800">
                          {user.profile?.displayName || user.email}
                        </div>
                        <div className="text-xs font-light tracking-widest text-gray-500 uppercase">
                          {getUserTypeDisplayName(user.userType as any)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-sm font-light tracking-wide">Keine Benutzer gefunden</div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    className="bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-4 py-2 rounded-none uppercase"
                    onClick={() => {
                      setNewConversationOpen(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                  >
                    SCHLIEßEN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}