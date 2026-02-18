import sharp from 'sharp'

// Generate an SVG overlay that contains the wordmark and the display name stacked.
// The overlay scales relative to the base image width and is placed at the bottom-right with padding.
function buildWatermarkSvg(params: {
  baseWidth: number
  baseHeight: number
  brandText?: string
  displayName?: string
}) {
  const { baseWidth, baseHeight, brandText = 'THEGND', displayName = '' } = params

  // Scale watermark size relative to image width
  const pad = Math.round(Math.max(12, baseWidth * 0.02))
  const fontSizeBrand = Math.round(Math.max(20, baseWidth * 0.035))
  const fontSizeName = Math.round(Math.max(14, baseWidth * 0.022))

  const textColor = 'rgba(255,255,255,0.92)'
  const shadowColor = 'rgba(0,0,0,0.3)'
  const boxBg = 'rgba(0,0,0,0.28)'

  // SVG viewbox is the image size; we position in bottom-right
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${baseWidth}" height="${baseHeight}" viewBox="0 0 ${baseWidth} ${baseHeight}">
    <defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${shadowColor}"/>
      </filter>
    </defs>
    <g>
      <!-- background box -->
      <rect x="${pad}" y="${baseHeight - (pad + fontSizeBrand + fontSizeName + Math.round(pad * 0.75))}" rx="4" ry="4"
            width="${Math.round(baseWidth * 0.52)}" height="${fontSizeBrand + fontSizeName + Math.round(pad * 0.75)}"
            fill="${boxBg}" />

      <!-- brand text -->
      <text x="${pad * 1.6}" y="${baseHeight - (pad + fontSizeName + Math.round(pad * 0.4))}"
            font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            font-size="${fontSizeBrand}" font-weight="300" letter-spacing="4" fill="${textColor}" filter="url(#shadow)">
        ${brandText}
      </text>

      <!-- display name -->
      <text x="${pad * 1.6}" y="${baseHeight - pad}"
            font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif"
            font-size="${fontSizeName}" font-weight="300" letter-spacing="2" fill="${textColor}" filter="url(#shadow)">
        ${displayName}
      </text>
    </g>
  </svg>`

  return Buffer.from(svg)
}

export async function applyWatermarkToImageBuffer(input: Buffer, displayName?: string): Promise<Buffer> {
  // Read base metadata to size the SVG overlay
  const base = sharp(input)
  const meta = await base.metadata()
  const width = meta.width ?? 1200
  const height = meta.height ?? 800

  const svg = buildWatermarkSvg({ baseWidth: width, baseHeight: height, brandText: 'THEGND', displayName: displayName || '' })

  // Composite watermark at the bottom-left area (SVG uses absolute positioning)
  const out = await base
    .composite([
      {
        input: svg,
        gravity: 'southwest',
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()

  return out
}
