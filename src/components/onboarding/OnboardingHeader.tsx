type Props = { userTypeDisplay: string }

export default function OnboardingHeader({ userTypeDisplay }: Props) {
  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl sm:text-5xl font-thin tracking-wide sm:tracking-wider leading-tight sm:leading-snug text-gray-800 mb-6">WILLKOMMEN</h1>
      <div className="w-24 h-px bg-pink-500 mx-auto mb-8"></div>
      <p className="text-lg font-light tracking-wide text-gray-600 mb-4">
        Vervollständige die Einrichtung deines {userTypeDisplay}-Profils
      </p>
      <p className="text-sm font-light text-gray-500">
        Erstelle ein herausragendes Profil, um in unserer exklusiven Community hervorzustechen
      </p>
    </div>
  )
}
