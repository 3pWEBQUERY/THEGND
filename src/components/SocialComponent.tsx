'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Users, UserPlus, UserMinus, Heart, MessageCircle, ChevronDown } from 'lucide-react'
import { getUserTypeDisplayName } from '@/lib/validations'

interface User {
  id: string
  email: string
  userType: string
  profile?: {
    displayName?: string
    avatar?: string
    bio?: string
  }
  _count?: {
    followers: number
    following: number
    posts: number
  }
  isFollowing?: boolean
  followedAt?: string
}

interface SocialData {
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

export default function SocialComponent() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('discover')
  const [searchUsers, setSearchUsers] = useState<User[]>([])
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [socialData, setSocialData] = useState<SocialData>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    fetchSocialData()
    fetchSearchUsers()
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSearchUsers()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, userTypeFilter])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (dropdownOpen && !target.closest('.dropdown-container')) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const fetchSocialData = async () => {
    try {
      const response = await fetch('/api/social')
      if (response.ok) {
        const data = await response.json()
        setSocialData(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Social-Daten:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSearchUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        userType: userTypeFilter,
        limit: '20'
      })
      
      const response = await fetch(`/api/users/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setSearchUsers(data)
      }
    } catch (error) {
      console.error('Fehler beim Suchen von Benutzern:', error)
    }
  }

  const fetchFollowers = async () => {
    try {
      const response = await fetch('/api/social?type=followers')
      if (response.ok) {
        const data = await response.json()
        setFollowers(data.users)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Follower:', error)
    }
  }

  const fetchFollowing = async () => {
    try {
      const response = await fetch('/api/social?type=following')
      if (response.ok) {
        const data = await response.json()
        setFollowing(data.users)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Following:', error)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'followers' && followers.length === 0) {
      fetchFollowers()
    } else if (tab === 'following' && following.length === 0) {
      fetchFollowing()
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Update search users
        setSearchUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: true, _count: { ...user._count!, followers: user._count!.followers + 1 } }
            : user
        ))
        
        // Update social data
        setSocialData(prev => ({
          ...prev,
          followingCount: prev.followingCount + 1
        }))
      }
    } catch (error) {
      console.error('Fehler beim Folgen:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Update search users
        setSearchUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isFollowing: false, _count: { ...user._count!, followers: user._count!.followers - 1 } }
            : user
        ))
        
        // Update following list
        setFollowing(prev => prev.filter(user => user.id !== userId))
        
        // Update social data
        setSocialData(prev => ({
          ...prev,
          followingCount: prev.followingCount - 1
        }))
      }
    } catch (error) {
      console.error('Fehler beim Entfolgen:', error)
    }
  }

  const UserCard = ({ user, showFollowButton = true }: { user: User, showFollowButton?: boolean }) => (
    <div className="bg-white border border-gray-100 p-4 sm:p-6 hover:border-pink-200 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="h-12 w-12 bg-gray-100 flex items-center justify-center">
            {user.profile?.avatar ? (
              <img 
                src={user.profile.avatar} 
                alt="Avatar" 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-light tracking-widest text-gray-600">
                {user.email.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-light tracking-wide text-gray-800 truncate">
              {user.profile?.displayName || user.email}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-xs font-light tracking-widest text-pink-500 uppercase px-2 py-1 border border-pink-200">
                {getUserTypeDisplayName(user.userType as any)}
              </span>
              {user._count && (
                <span className="text-xs font-light tracking-wide text-gray-500">
                  {user._count.followers} Follower
                </span>
              )}
            </div>
            {user.profile?.bio && (
              <p className="text-xs font-light tracking-wide text-gray-600 mt-2 line-clamp-2">
                {user.profile.bio}
              </p>
            )}
          </div>
        </div>
        
        {showFollowButton && user.id !== session?.user?.id && (
          <div className="mt-4 sm:mt-0 w-full sm:w-auto flex items-center">
            {user.isFollowing ? (
              <button 
                aria-label="Entfolgen"
                className="w-full sm:w-auto justify-center border border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-500 text-xs font-light tracking-widest px-4 py-2 transition-colors uppercase flex items-center space-x-2 whitespace-nowrap"
                onClick={() => handleUnfollow(user.id)}
              >
                <UserMinus className="h-3 w-3" />
                <span>ENTFOLGEN</span>
              </button>
            ) : (
              <button 
                aria-label="Folgen"
                className="w-full sm:w-auto justify-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-light tracking-widest px-4 py-2 transition-colors uppercase flex items-center space-x-2 whitespace-nowrap"
                onClick={() => handleFollow(user.id)}
              >
                <UserPlus className="h-3 w-3" />
                <span>FOLGEN</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-sm font-light tracking-widest text-gray-600">SOZIALE FUNKTIONEN WERDEN GELADEN...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Social Stats */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-thin tracking-wider text-gray-800 mb-2">SOZIALE VERBINDUNGEN</h2>
            <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
            <p className="text-sm font-light tracking-wide text-gray-600">
              Vernetzen Sie sich mit anderen Mitgliedern und erweitern Sie Ihr Netzwerk
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gray-50">
              <div className="text-2xl font-thin tracking-wider text-gray-800 mb-2">
                {socialData.followersCount}
              </div>
              <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLLOWER</div>
            </div>
            <div className="text-center p-6 bg-gray-50">
              <div className="text-2xl font-thin tracking-wider text-gray-800 mb-2">
                {socialData.followingCount}
              </div>
              <div className="text-xs font-light tracking-widest text-gray-500 uppercase">FOLGE ICH</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-100 rounded-none">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto no-scrollbar">
            <button 
              className={`shrink-0 whitespace-nowrap sm:flex-1 py-4 px-6 text-xs font-light tracking-widest uppercase transition-colors ${
                activeTab === 'discover' 
                  ? 'text-pink-500 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('discover')}
            >
              ENTDECKEN
            </button>
            <button 
              className={`shrink-0 whitespace-nowrap sm:flex-1 py-4 px-6 text-xs font-light tracking-widest uppercase transition-colors ${
                activeTab === 'followers' 
                  ? 'text-pink-500 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('followers')}
            >
              FOLLOWER
            </button>
            <button 
              className={`shrink-0 whitespace-nowrap sm:flex-1 py-4 px-6 text-xs font-light tracking-widest uppercase transition-colors ${
                activeTab === 'following' 
                  ? 'text-pink-500 border-b-2 border-pink-500' 
                  : 'text-gray-600 hover:text-pink-500'
              }`}
              onClick={() => handleTabChange('following')}
            >
              FOLGE ICH
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'discover' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-2">BENUTZER ENTDECKEN</h3>
                <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                <p className="text-sm font-light tracking-wide text-gray-600">
                  Finden Sie neue Benutzer zum Folgen
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Benutzer suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-0 border-b-2 border-gray-200 rounded-none pl-10 pr-0 py-4 text-sm font-light focus:border-pink-500 focus:outline-none bg-transparent h-12"
                  />
                </div>
                
                {/* Custom Dropdown */}
                <div className="relative dropdown-container">
                  <button 
                    className="w-full sm:w-48 border-0 border-b-2 border-gray-200 rounded-none px-3 py-4 text-sm font-light focus:border-pink-500 focus:outline-none bg-transparent text-left flex items-center justify-between hover:border-pink-300 transition-colors h-12"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className="text-xs font-light tracking-widest uppercase">
                      {userTypeFilter === 'ALL' ? 'ALLE TYPEN' :
                       userTypeFilter === 'MEMBER' ? 'MITGLIED' :
                       userTypeFilter === 'ESCORT' ? 'ESCORT' :
                       userTypeFilter === 'AGENCY' ? 'AGENTUR' :
                       userTypeFilter === 'CLUB' ? 'CLUB' : 'STUDIO'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 z-10 mt-1">
                      {[
                        { value: 'ALL', label: 'ALLE TYPEN' },
                        { value: 'MEMBER', label: 'MITGLIED' },
                        { value: 'ESCORT', label: 'ESCORT' },
                        { value: 'AGENCY', label: 'AGENTUR' },
                        { value: 'CLUB', label: 'CLUB' },
                        { value: 'STUDIO', label: 'STUDIO' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          className={`w-full text-left px-4 py-3 text-xs font-light tracking-widest uppercase hover:bg-gray-50 transition-colors ${
                            userTypeFilter === option.value ? 'bg-pink-50 text-pink-500' : 'text-gray-600'
                          }`}
                          onClick={() => {
                            setUserTypeFilter(option.value)
                            setDropdownOpen(false)
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {searchUsers.map(user => (
                  <UserCard key={user.id} user={user} />
                ))}
                {searchUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
                    <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KEINE BENUTZER GEFUNDEN</h3>
                    <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                    <p className="text-sm font-light tracking-wide text-gray-500">Versuchen Sie, Ihre Suchkriterien anzupassen</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-2">IHRE FOLLOWER ({socialData.followersCount})</h3>
                <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                <p className="text-sm font-light tracking-wide text-gray-600">
                  Benutzer, die Ihnen folgen
                </p>
              </div>
              
              <div className="space-y-3">
                {followers.map(user => (
                  <UserCard key={user.id} user={user} showFollowButton={false} />
                ))}
                {followers.length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
                    <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">NOCH KEINE FOLLOWER</h3>
                    <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                    <p className="text-sm font-light tracking-wide text-gray-500">Sie haben noch keine Follower</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'following' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-2">SIE FOLGEN ({socialData.followingCount})</h3>
                <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                <p className="text-sm font-light tracking-wide text-gray-600">
                  Benutzer, denen Sie folgen
                </p>
              </div>
              
              <div className="space-y-3">
                {following.map(user => (
                  <UserCard 
                    key={user.id} 
                    user={user} 
                    showFollowButton={true}
                  />
                ))}
                {following.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto mb-6 opacity-30 text-gray-400" />
                    <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">FOLGEN NIEMANDEM</h3>
                    <div className="w-12 h-px bg-pink-500 mx-auto mb-4"></div>
                    <p className="text-sm font-light tracking-wide text-gray-500">Sie folgen noch niemandem</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}