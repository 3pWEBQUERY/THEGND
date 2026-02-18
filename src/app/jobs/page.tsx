import { Suspense } from 'react'
import JobsClientPage from './JobsClientPage'

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}> 
      <JobsClientPage />
    </Suspense>
  )
}
