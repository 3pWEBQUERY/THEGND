import { redirect } from 'next/navigation'

export default function AutoMessagePage() {
  // Auto-Message lebt im Dashboard unter Matching
  redirect('/dashboard?tab=matching&view=auto-message')
}
