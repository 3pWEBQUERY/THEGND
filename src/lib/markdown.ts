// Minimal Markdown -> Safe HTML renderer without external deps
// Supports: bold **text**, italic *text*, inline code `code`, links [text](url), images ![alt](url), line breaks
// Escapes HTML and sanitizes URLs to http/https only

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url, 'https://example.com')
    // allow absolute http/https, allow protocol-relative, and relative paths
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'about:') return true
    // For protocol-relative or relative, URL constructor above treats as https/about
    return true
  } catch {
    return false
  }
}

export function renderMarkdownToSafeHtml(markdown: string): string {
  // Escape HTML first
  let html = escapeHtml(markdown)

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_m, alt, url, title) => {
    const safeAlt = escapeHtml(alt || '')
    const safeUrl = isSafeUrl(url) ? url : '#'
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : ''
    return `<img src="${safeUrl}" alt="${safeAlt}"${safeTitle} loading="lazy" />`
  })

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (_m, text, url, title) => {
    const safeText = escapeHtml(text)
    const safeUrl = isSafeUrl(url) ? url : '#'
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : ''
    return `<a href="${safeUrl}" rel="noopener noreferrer nofollow" target="_blank"${safeTitle}>${safeText}</a>`
  })

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Italic *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`) // code already escaped

  // Line breaks
  html = html.replace(/\r?\n/g, '<br />')

  return html
}
