import { redirect } from 'next/navigation'

export default function PreferencesPage() {
  // Präferenzen leben jetzt im Dashboard unter Matching
  redirect('/dashboard?tab=matching&view=prefs')
}
