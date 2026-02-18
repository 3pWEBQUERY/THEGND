import { Check } from 'lucide-react'
import Link from 'next/link'

type Props = {
  escortStep1Completed: boolean
  escortStep2Completed: boolean
  escortStep3Completed: boolean
  escortStep4Completed: boolean
  escortStep5Completed: boolean
  escortStep6Completed: boolean
  escortStep7Completed: boolean
  addEditParam: (href: string) => string
}

export default function HobbyhureSteps({
  escortStep1Completed,
  escortStep2Completed,
  escortStep3Completed,
  escortStep4Completed,
  escortStep5Completed,
  escortStep6Completed,
  escortStep7Completed,
  addEditParam,
}: Props) {
  return (
    <>
      {/* Schritt 1 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep1Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep1Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Professionelles Profil</h3>
          <p className="text-sm font-light text-gray-600">Anzeigename, Slogan und Basisangaben</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-1')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 2 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep2Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep2Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Körperliche Beschreibung</h3>
          <p className="text-sm font-light text-gray-600">Aussehen und Merkmale</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-2')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 3 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep3Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep3Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Beschreibung</h3>
          <p className="text-sm font-light text-gray-600">Über dich, Persönlichkeit, Vorlieben</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-3')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 4 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep4Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep4Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Galerie</h3>
          <p className="text-sm font-light text-gray-600">Fotos & Medien</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-4')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 5 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep5Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep5Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Services</h3>
          <p className="text-sm font-light text-gray-600">Leistungen & Pakete</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-5')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 6 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep6Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep6Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Kontakt</h3>
          <p className="text-sm font-light text-gray-600">Telefon, Website & Social</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-6')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>

      {/* Schritt 7 */}
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${escortStep7Completed ? 'border-pink-500' : 'border-gray-200'}`}>
        {escortStep7Completed ? <Check className="h-5 w-5 text-pink-500" /> : <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Standort</h3>
          <p className="text-sm font-light text-gray-600">Adresse, Stadt, Land</p>
        </div>
        <Link href={addEditParam('/onboarding/hobbyhure/step-7')} className="text-xs font-light text-pink-600 hover:underline">Öffnen</Link>
      </div>
    </>
  )
}
