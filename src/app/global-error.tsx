'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#111', color: '#fff', padding: '2rem' }}>
          <div style={{ maxWidth: 600, width: '100%' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '1rem' }}>
              SOMETHING WENT WRONG
            </h1>
            <div style={{ height: 2, width: 60, background: 'linear-gradient(90deg, transparent, #e11d48, transparent)', marginBottom: '1.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#aaa', marginBottom: '1rem' }}>
              A critical error occurred. This helps debug the issue:
            </p>
            <pre style={{ background: '#1a1a1a', border: '1px solid #333', padding: '1rem', borderRadius: 0, fontSize: '0.75rem', color: '#f87171', overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '1rem' }}>
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
      </body>
    </html>
  )
}
