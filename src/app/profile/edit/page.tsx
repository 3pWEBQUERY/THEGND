'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X, Camera } from 'lucide-react'
import { z } from 'zod'
import { formatLocation } from '@/lib/utils'

const profileEditSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  age: z.number().min(18).max(100).optional().or(z.string().optional()),
  gender: z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER']).optional(),
  preferences: z.string().optional(),
  slogan: z.string().optional(),
  nationality: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
})

type ProfileEditForm = z.infer<typeof profileEditSchema>

const genderOptions = [
  { value: 'MALE', label: 'Männlich' },
  { value: 'FEMALE', label: 'Weiblich' },
  { value: 'NON_BINARY', label: 'Non-Binary' },
  { value: 'OTHER', label: 'Andere' }
]

export default function ProfileEditPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [profileData, setProfileData] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileEditForm>({
    resolver: zodResolver(profileEditSchema)
  })

  const locationPreview = formatLocation({
    location: watch('location'),
    city: (profileData as any)?.city,
    country: (profileData as any)?.country,
    zipCode: (profileData as any)?.zipCode,
  })

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include' as RequestCredentials })
        if (response.status === 401) {
          try {
            const cb = typeof window !== 'undefined' ? window.location.pathname : '/profile/edit'
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(cb)}`)
          } catch {
            if (typeof window !== 'undefined') {
              const cb = window.location.pathname
              window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(cb)}`
            }
          }
          return
        }
        if (response.ok) {
          const data = await response.json()
          setProfileData(data.user.profile)
          setCurrentProfileImage(data.user.profile?.avatar || null)
          
          // Set form values with current data
          if (data.user.profile) {
            const profile = data.user.profile
            setValue('displayName', profile.displayName || '')
            setValue('bio', profile.bio || '')
            setValue('location', profile.location || '')
            setValue('age', profile.age || '')
            setValue('gender', profile.gender || '')
            setValue('preferences', profile.preferences || '')
            setValue('slogan', profile.slogan || '')
            setValue('nationality', profile.nationality || '')
            setValue('website', profile.website || '')
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    if (session?.user) {
      fetchProfile()
    }
  }, [session, setValue])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewUrl(null)
  }

  const handleRemoveCurrentImage = async () => {
    try {
      // Remove current profile image
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          profileData: { avatar: null }
        })
      })

      if (response.ok) {
        setCurrentProfileImage(null)
      }
    } catch (error) {
      console.error('Error removing image:', error)
    }
  }

  const onSubmit = async (data: ProfileEditForm) => {
    setIsLoading(true)
    setError('')

    try {
      // First upload image if selected
      if (selectedImage) {
        const imageFormData = new FormData()
        imageFormData.append('profileImage', selectedImage)

        const imageResponse = await fetch('/api/profile/upload-image', {
          method: 'POST',
          body: imageFormData
        })

        if (!imageResponse.ok) {
          const result = await imageResponse.json()
          setError(result.error || 'Failed to upload image')
          return
        }
      }

      // Convert age to number if it's a string
      const formData = {
        ...data,
        age: data.age ? Number(data.age) : undefined
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profileData: formData })
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }

      // Success - redirect to profile page
      console.log('Profile updated successfully, redirecting...')
      
      // Use router.push with fallback to window.location
      try {
        await router.push('/profile')
      } catch (routerError) {
        console.log('Router redirect failed, using window.location...')
        window.location.href = '/profile'
      }
      
    } catch (error) {
      console.error('Profile update error:', error)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm font-light tracking-widest text-gray-600">PLEASE LOGIN</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimalist Navigation */}
      <nav className="absolute top-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/profile" className="flex items-center text-sm font-light tracking-widest text-gray-600 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              BACK TO PROFILE
            </Link>
            <div className="text-sm font-light tracking-widest text-gray-600">
              EDIT PROFILE
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-thin tracking-wider text-gray-800 mb-6">EDIT PROFILE</h1>
            <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
            <p className="text-lg font-light tracking-wide text-gray-600 max-w-md mx-auto">
              Update your profile information
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            {error && (
              <div className="p-4 text-sm font-light text-red-600 bg-red-50 border border-red-200">
                {error}
              </div>
            )}
            
            <div className="space-y-8">
              {/* Profile Image Upload */}
              <div className="space-y-6">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase text-center block">
                  Profile Image
                </Label>
                
                <div className="flex flex-col items-center space-y-6">
                  {/* Current Profile Image */}
                  {currentProfileImage && !previewUrl && (
                    <div className="relative">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                        <Image
                          src={currentProfileImage}
                          alt="Current profile"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCurrentImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="text-center mt-3">
                        <p className="text-xs font-light text-gray-600">Current profile image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* New Image Preview */}
                  {previewUrl && (
                    <div className="relative">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500">
                        <Image
                          src={previewUrl}
                          alt="New profile preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="text-center mt-3">
                        <p className="text-xs font-light text-gray-600">
                          {selectedImage?.name}
                        </p>
                        <p className="text-xs font-light text-pink-600">New image ready to upload</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Area */}
                  {!previewUrl && (
                    <div className="relative">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="flex items-center space-x-2">
                            <Camera className="h-6 w-6 text-gray-400" />
                            <Upload className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-light text-gray-600 mb-1">
                              {currentProfileImage ? 'Change profile image' : 'Upload profile image'}
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG or JPEG (max 5MB)
                            </p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gray-200"></div>
              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your public name"
                  {...register('displayName')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.displayName ? 'border-red-500' : ''
                  }`}
                />
                {errors.displayName && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.displayName.message}</p>
                )}
              </div>

              {session.user.userType === 'ESCORT' && (
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Slogan</Label>
                  <Input
                    id="slogan"
                    placeholder="Your professional slogan"
                    {...register('slogan')}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                      errors.slogan ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.slogan && (
                    <p className="text-xs font-light text-red-600 mt-1">{errors.slogan.message}</p>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    placeholder="Your age"
                    {...register('age')}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                      errors.age ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.age && (
                    <p className="text-xs font-light text-red-600 mt-1">{errors.age.message}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Gender</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 bg-transparent ${
                          errors.gender ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Choose gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.gender && (
                    <p className="text-xs font-light text-red-600 mt-1">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Location</Label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  {...register('location')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.location ? 'border-red-500' : ''
                  }`}
                />
                {errors.location && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.location.message}</p>
                )}
                {(watch('location') || (profileData as any)?.city || (profileData as any)?.country || (profileData as any)?.zipCode) && (
                  <p className="text-xs font-light text-gray-500 mt-1">
                    Preview: {locationPreview || '—'}
                  </p>
                )}
              </div>

              {session.user.userType === 'ESCORT' && (
                <div className="space-y-3">
                  <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Your nationality"
                    {...register('nationality')}
                    className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                      errors.nationality ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.nationality && (
                    <p className="text-xs font-light text-red-600 mt-1">{errors.nationality.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://your-website.com"
                  {...register('website')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent ${
                    errors.website ? 'border-red-500' : ''
                  }`}
                />
                {errors.website && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.website.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">About Me</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  {...register('bio')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent resize-none ${
                    errors.bio ? 'border-red-500' : ''
                  }`}
                />
                {errors.bio && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-light tracking-widest text-gray-800 uppercase">Preferences/Interests</Label>
                <Textarea
                  id="preferences"
                  placeholder="Your preferences and interests..."
                  rows={3}
                  {...register('preferences')}
                  className={`border-0 border-b-2 border-gray-200 rounded-none px-0 py-3 text-sm font-light focus:border-pink-500 focus:ring-0 bg-transparent resize-none ${
                    errors.preferences ? 'border-red-500' : ''
                  }`}
                />
                {errors.preferences && (
                  <p className="text-xs font-light text-red-600 mt-1">{errors.preferences.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8 pb-16">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest py-4 text-sm uppercase"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                onClick={() => router.push('/profile')}
                className="flex-1 border-gray-300 text-gray-600 font-light tracking-widest py-4 text-sm uppercase hover:border-pink-500 hover:text-pink-500"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}