import { Check } from 'lucide-react'
import Link from 'next/link'

type Props = {
  base: 'agency' | 'club' | 'studio'
  agencyStep1Completed: boolean
  businessStep1Completed: boolean
  businessStep2Completed: boolean
  agencyStep2Completed: boolean
  agencyStep4Completed: boolean
  agencyStep5Completed: boolean
  agencyStep6Completed: boolean
  agencyStep7Completed: boolean
  addEditParam: (href: string) => string
}

export default function BusinessSteps({
  base,
  agencyStep1Completed,
  businessStep1Completed,
  businessStep2Completed,
  agencyStep2Completed,
  agencyStep4Completed,
  agencyStep5Completed,
  agencyStep6Completed,
  agencyStep7Completed,
  addEditParam,
}: Props) {
  const step1Completed = base === 'agency' ? agencyStep1Completed : businessStep1Completed

  return (
    <>
      {/* Schritt 1 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${step1Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {step1Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Unternehmensinformationen</h3>
          <p className="text-sm font-light text-gray-600">Firmendaten und Geschäftstyp</p>
        </div>
        <Link href={addEditParam(`/onboarding/${base}/step-1`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 2 für Club/Studio: Standort & Kontakt */}
      {base !== 'agency' && (
        <div className={`flex items-center space-x-4 p-4 border-l-2 ${businessStep2Completed ? 'border-pink-500' : 'border-gray-200'}`}>
          {businessStep2Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
          <div className="flex-1">
            <h3 className="font-light tracking-wide text-gray-800">Standort & Kontakt</h3>
            <p className="text-sm font-light text-gray-600">Adresse und Kontaktinformationen</p>
          </div>
          <Link href={addEditParam(`/onboarding/${base}/step-2`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
        </div>
      )}

      {/* Beschreibung / Leistungen & Portfolio */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${agencyStep2Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {agencyStep2Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">{base === 'agency' ? 'Beschreibung' : 'Leistungen & Portfolio'}</h3>
          <p className="text-sm font-light text-gray-600">{base === 'agency' ? 'Unternehmensbeschreibung' : 'Unternehmensbeschreibung und Galerie'}</p>
        </div>
        <Link href={addEditParam(base === 'agency' ? `/onboarding/${base}/step-2` : `/onboarding/${base}/step-3`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Medien */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${agencyStep4Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {agencyStep4Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Medien</h3>
          <p className="text-sm font-light text-gray-600">Logo & Galerie</p>
        </div>
        <Link href={addEditParam(`/onboarding/${base}/step-4`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Leistungen (Agency) oder Ausstattung & Räume (Club/Studio) */}
      {base === 'agency' ? (
        <div className={`flex items-center space-x-4 p-4 border-l-2 ${agencyStep5Completed ? 'border-pink-500' : 'border-gray-200'}`}>
          {agencyStep5Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
          <div className="flex-1">
            <h3 className="font-light tracking-wide text-gray-800">Leistungen</h3>
            <p className="text-sm font-light text-gray-600">Services auswählen</p>
          </div>
          <Link href={addEditParam('/onboarding/agency/step-5')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
        </div>
      ) : (
        <div className={`flex items-center space-x-4 p-4 border-l-2 ${agencyStep5Completed ? 'border-pink-500' : 'border-gray-200'}`}>
          {agencyStep5Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
          <div className="flex-1">
            <h3 className="font-light tracking-wide text-gray-800">Ausstattung & Räume</h3>
            <p className="text-sm font-light text-gray-600">Services wie Klimaanlage, Bar, Darkroom, Pornokino, BDSM Room</p>
          </div>
          <Link href={addEditParam(`/onboarding/${base}/step-5`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
        </div>
      )}

      {/* Kontakt (Schritt 6) */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${agencyStep6Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {agencyStep6Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Kontakt</h3>
          <p className="text-sm font-light text-gray-600">Telefon, Website & Social</p>
        </div>
        <Link href={addEditParam(`/onboarding/${base}/step-6`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Standort (Schritt 7) */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${agencyStep7Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {agencyStep7Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Standort</h3>
          <p className="text-sm font-light text-gray-600">Adresse, Stadt, Land</p>
        </div>
        <Link href={addEditParam(`/onboarding/${base}/step-7`)} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>
    </>
  )
}
