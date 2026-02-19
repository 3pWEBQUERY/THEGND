import { getStructuredDataForPath } from '@/lib/seo'

interface StructuredDataProps {
  path: string
}

/**
 * Server Component that renders JSON-LD structured data snippets
 * for the given URL path. Fetches from the database and matches
 * against urlPattern with wildcard support.
 */
export default async function StructuredData({ path }: StructuredDataProps) {
  const snippets = await getStructuredDataForPath(path)
  if (snippets.length === 0) return null

  return (
    <>
      {snippets.map((sd) => {
        let jsonLd: string
        try {
          // Ensure it's valid JSON and pretty-print it
          const parsed = JSON.parse(sd.jsonLdTemplate)
          jsonLd = JSON.stringify(parsed)
        } catch {
          return null
        }
        return (
          <script
            key={sd.id}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd }}
          />
        )
      })}
    </>
  )
}
