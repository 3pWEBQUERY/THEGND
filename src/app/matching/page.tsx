import { redirect } from 'next/navigation'

export default function MatchingPage() {
  // Matching lebt im Dashboard. Diese Route leitet direkt weiter.
  redirect('/dashboard?tab=matching')
}
