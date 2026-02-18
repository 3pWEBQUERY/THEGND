import { Button } from '@/components/ui/button'

export type UserType = 'MEMBER' | 'ESCORT' | 'HOBBYHURE' | 'AGENCY' | 'CLUB' | 'STUDIO'

type Props = {
  userType: UserType
  isEditMode: boolean
  isSkipping: boolean
  escortAllCompleted: boolean
  agencyAllCompleted: boolean
  clubStudioAllCompleted: boolean
  isPersonalDetailsCompleted: boolean
  isProfileMediaCompleted: boolean
  onStartOnboarding: () => void
  onSkipOnboarding: () => void
  onCompleteOnboarding: () => void
  onContinueToMedia: () => void
}

export default function OnboardingCTA({
  userType,
  isEditMode,
  isSkipping,
  escortAllCompleted,
  agencyAllCompleted,
  clubStudioAllCompleted,
  isPersonalDetailsCompleted,
  isProfileMediaCompleted,
  onStartOnboarding,
  onSkipOnboarding,
  onCompleteOnboarding,
  onContinueToMedia,
}: Props) {
  if (isEditMode) return null

  const allDone =
    ((userType === 'ESCORT' || userType === 'HOBBYHURE') && escortAllCompleted) ||
    (userType === 'AGENCY' && agencyAllCompleted) ||
    ((userType === 'CLUB' || userType === 'STUDIO') && clubStudioAllCompleted)

  return (
    <div className="text-center space-y-8">
      <div className="p-6 bg-gray-50 border">
        {userType === 'MEMBER' && isPersonalDetailsCompleted ? (
          <p className="text-sm font-light text-gray-600 mb-4">
            Super! Deine persönlichen Angaben sind vollständig. Du kannst jetzt Profil‑Medien hinzufügen oder die Einrichtung abschließen.
          </p>
        ) : (
          <p className="text-sm font-light text-gray-600 mb-4">
            Du kannst die Einrichtung überspringen und später fortsetzen. Ein vollständiges Profil erhöht jedoch deine Sichtbarkeit und Networking‑Möglichkeiten deutlich.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        {allDone ? (
          <>
            <Button 
              type="button"
              onClick={onCompleteOnboarding}
              className="bg-green-500 hover:bg-green-600 text-white font-light tracking-widest px-12 py-3 text-sm uppercase rounded-none"
            >
              Einrichtung abschließen
            </Button>
            <Button 
              type="button"
              onClick={onSkipOnboarding}
              variant="outline"
              disabled={isSkipping}
              className="font-light tracking-widest px-12 py-3 text-sm uppercase border-gray-300 hover:border-pink-500 rounded-none"
            >
              {isSkipping ? 'Wird übersprungen...' : 'Jetzt überspringen'}
            </Button>
          </>
        ) : userType === 'MEMBER' ? (
          <>
            {isPersonalDetailsCompleted ? (
              <>
                {!isProfileMediaCompleted ? (
                  <>
                    <Button 
                      type="button"
                      onClick={onContinueToMedia}
                      className="font-light tracking-widest px-12 py-3 text-sm uppercase border-gray-300 hover:border-pink-500 rounded-none"
                    >
                      Medien hinzufügen
                    </Button>
                    <Button 
                      type="button"
                      onClick={onSkipOnboarding}
                      variant="outline"
                      disabled={isSkipping}
                      className="font-light tracking-widest px-12 py-3 text-sm uppercase border-gray-300 hover:border-pink-500 rounded-none"
                    >
                      {isSkipping ? 'Wird übersprungen...' : 'Jetzt überspringen'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      type="button"
                      onClick={onCompleteOnboarding}
                      className="bg-green-500 hover:bg-green-600 text-white font-light tracking-widest px-12 py-3 text-sm uppercase rounded-none"
                    >
                      Einrichtung abschließen
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button 
                  type="button"
                  onClick={onStartOnboarding} 
                  className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest px-12 py-3 text-sm uppercase rounded-none"
                >
                  Einrichtung starten
                </Button>

                <Button 
                  type="button"
                  onClick={onSkipOnboarding}
                  variant="outline"
                  disabled={isSkipping}
                  className="font-light tracking-widest px-12 py-3 text-sm uppercase border-gray-300 hover:border-pink-500 rounded-none"
                >
                  {isSkipping ? 'Wird übersprungen...' : 'Jetzt überspringen'}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            <Button 
              type="button"
              onClick={onStartOnboarding} 
              className="bg-pink-500 hover:bg-pink-600 text-white font-light tracking-widest px-12 py-3 text-sm uppercase rounded-none"
            >
              Einrichtung starten
            </Button>

            <Button 
              type="button"
              onClick={onSkipOnboarding}
              variant="outline"
              disabled={isSkipping}
              className="font-light tracking-widest px-12 py-3 text-sm uppercase border-gray-300 hover:border-pink-500 rounded-none"
            >
              {isSkipping ? 'Wird übersprungen...' : 'Jetzt überspringen'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
