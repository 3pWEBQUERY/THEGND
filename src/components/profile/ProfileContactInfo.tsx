'use client'

import { FaInstagram, FaFacebook, FaXTwitter, FaYoutube, FaLinkedin, FaWhatsapp, FaTelegram, FaTiktok, FaSnapchat } from 'react-icons/fa6'
import { SiOnlyfans } from 'react-icons/si'
import { Globe } from 'lucide-react'

function brandColor(key: string): string {
  const k = (key || '').toLowerCase()
  if (k === 'whatsapp') return '#25D366'
  if (k === 'instagram') return '#E4405F'
  if (k === 'facebook') return '#1877F2'
  if (k === 'twitter' || k === 'x') return '#1DA1F2'
  if (k === 'youtube') return '#FF0000'
  if (k === 'linkedin') return '#0A66C2'
  if (k === 'telegram') return '#26A5E4'
  if (k === 'tiktok') return '#000000'
  if (k === 'snapchat') return '#FFFC00'
  if (k === 'onlyfans') return '#00AEEF'
  return '#6B7280'
}

type Props = {
  profile: any
  city?: string | null
  country?: string | null
}

export default function ProfileContactInfo({ profile, city, country }: Props) {
  return (
    <div className="bg-gray-50 p-6">
      <h3 className="text-lg font-thin tracking-wider text-gray-800 mb-4">KONTAKTINFORMATIONEN</h3>
      <div className="w-12 h-px bg-pink-500 mb-6"></div>

      <div className="space-y-4">
        {profile.address && (
          <div>
            <div className="text-sm font-light tracking-wide text-gray-700 mb-2"><strong>Adresse:</strong></div>
            <div className="text-sm font-light tracking-wide text-gray-700">
              {profile.address}<br />
              {profile.zipCode} {profile.city || city}<br />
              {profile.country || country}
            </div>
          </div>
        )}

        {profile.phone && (
          <div>
            <div className="text-[10px] tracking-widest text-gray-500 mb-1">TELEFON</div>
            <div>{profile.phone}</div>
          </div>
        )}

        {profile.website && (
          <div>
            <div className="text-[10px] tracking-widest text-gray-500 mb-1">WEBSEITE</div>
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline break-all">{profile.website}</a>
          </div>
        )}

        {profile.socialMedia && Object.keys(profile.socialMedia).length > 0 && (
          <div>
            <div className="text-[10px] tracking-widest text-gray-500 mb-2">SOZIALE MEDIEN</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.socialMedia).map(([rawKey, rawVal]) => {
                if (!rawVal) return null
                const key = String(rawKey).toLowerCase()
                let href = String(rawVal)
                if (key === 'whatsapp') {
                  const phone = href.replace(/[^+\d]/g, '')
                  href = `https://wa.me/${phone}`
                } else if (!/^https?:\/\//i.test(href)) {
                  href = `https://${href}`
                }
                const Icon =
                  key === 'instagram' ? FaInstagram :
                  key === 'facebook' ? FaFacebook :
                  (key === 'twitter' || key === 'x') ? FaXTwitter :
                  key === 'youtube' ? FaYoutube :
                  key === 'linkedin' ? FaLinkedin :
                  key === 'whatsapp' ? FaWhatsapp :
                  key === 'telegram' ? FaTelegram :
                  key === 'tiktok' ? FaTiktok :
                  key === 'snapchat' ? FaSnapchat :
                  key === 'onlyfans' ? SiOnlyfans :
                  null
                const color = brandColor(key)
                const display = (
                  key === 'whatsapp' ? 'WHATSAPP' :
                  key === 'instagram' ? 'INSTAGRAM' :
                  key === 'facebook' ? 'FACEBOOK' :
                  (key === 'twitter' || key === 'x') ? 'X' :
                  key === 'youtube' ? 'YOUTUBE' :
                  key === 'linkedin' ? 'LINKEDIN' :
                  key === 'telegram' ? 'TELEGRAM' :
                  key === 'tiktok' ? 'TIKTOK' :
                  key === 'snapchat' ? 'SNAPCHAT' :
                  key === 'onlyfans' ? 'ONLYFANS' :
                  String(rawKey).toUpperCase()
                )
                return (
                  <a
                    key={rawKey}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1 border text-xs rounded-none transition-colors border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]"
                    style={{ ['--brand' as any]: color }}
                    title={rawKey}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    <span className="truncate max-w-[180px]">{display}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
