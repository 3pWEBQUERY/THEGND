export default function Head() {
  const title = 'Agenturen | The GND'
  const description = 'Finde und entdecke Escort-Agenturen. Suche nach Name oder Ort und entdecke neue Profile.'
  const url = 'https://thegnd.com/agency'
  const image = '/android-chrome-192x192.png'
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thegnd.com/' },
      { '@type': 'ListItem', position: 2, name: 'Agenturen', item: url },
    ],
  }
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
    </>
  )
}
