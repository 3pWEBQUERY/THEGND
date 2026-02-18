'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[error.tsx] Caught error:', error)
  }, [error])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 600, width: '100%' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem', color: '#1f2937' }}>
          SOMETHING WENT WRONG
        </h2>
        <div style={{ height: 2, width: 60, background: 'linear-gradient(90deg, transparent, #e11d48, transparent)', marginBottom: '1.5rem' }} />
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          An error occurred while loading this page. Details:
        </p>
        <pre style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: 0, fontSize: '0.75rem', color: '#dc2626', overflow: 'auto', maxHeight: 250, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1rem' }}>
          {error?.message || 'Unknown error'}
          {error?.digest ? `\n\nDigest: ${error.digest}` : ''}
          {error?.stack ? `\n\n${error.stack}` : ''}
        </pre>
        <button
          onClick={reset}
          style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '0.75rem 2rem', fontSize: '0.75rem', letterSpacing: '0.15em', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
