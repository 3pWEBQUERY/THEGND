import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-4xl font-light tracking-wider text-gray-900">Seite nicht gefunden</h1>
      <p className="mt-3 text-gray-600 max-w-prose">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="mt-6">
        <Link href="/" className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-sm">Zur Startseite</Link>
      </div>
    </div>
  )
}
