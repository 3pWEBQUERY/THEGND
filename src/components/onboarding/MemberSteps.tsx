import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

type Props = {
  isPersonalDetailsCompleted: boolean
  isProfileMediaCompleted: boolean
  onStartMember: () => void
  onContinueToMedia: () => void
}

export default function MemberSteps({ isPersonalDetailsCompleted, isProfileMediaCompleted, onStartMember, onContinueToMedia }: Props) {
  return (
    <>
      <div className={`flex items-center space-x-4 p-4 border-l-2 ${isPersonalDetailsCompleted ? 'border-pink-500' : 'border-gray-200'}`}>
        {isPersonalDetailsCompleted ? (
          <Check className="h-5 w-5 text-pink-500" />
        ) : (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        )}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Persönliche Angaben</h3>
          <p className="text-sm font-light text-gray-600">Anzeigename, Alter, Ort, Bio und Vorlieben</p>
        </div>
        {!isPersonalDetailsCompleted && (
          <Button type="button" onClick={onStartMember} size="sm" className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-wide px-4 py-2 text-xs rounded-none">
            Vervollständigen
          </Button>
        )}
      </div>

      <div className={`flex items-center space-x-4 p-4 border-l-2 ${isProfileMediaCompleted ? 'border-pink-500' : 'border-gray-200'}`}>
        {isProfileMediaCompleted ? (
          <Check className="h-5 w-5 text-pink-500" />
        ) : (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        )}
        <div className="flex-1">
          <h3 className="font-light tracking-wide text-gray-800">Profil-Medien</h3>
          <p className="text-sm font-light text-gray-600">Profilbild hochladen (optional)</p>
        </div>
        {isPersonalDetailsCompleted && !isProfileMediaCompleted && (
          <Button type="button" onClick={onContinueToMedia} size="sm" className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-wide px-4 py-2 text-xs rounded-none">
            Medien hinzufügen
          </Button>
        )}
      </div>
    </>
  )
}
