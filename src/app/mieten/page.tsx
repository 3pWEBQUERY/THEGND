import { Suspense } from 'react'
import MietenClientPage from './MietenClientPage'

export default function MietenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}> 
      <MietenClientPage />
    </Suspense>
  )
}
