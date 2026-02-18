type WelcomeParams = {
  appUrl: string
  userType?: string
  displayName?: string | null
  logoUrl?: string | null
}

function buildCta(appUrl: string, userType?: string): { href: string; label: string } {
  const base = appUrl.replace(/\/$/, '')
  return { href: `${base}/auth/signin`, label: 'Jetzt anmelden' }
}

export function buildWelcomeEmailHtml({ appUrl, userType, displayName, logoUrl }: WelcomeParams) {
  const safeName = displayName && displayName.trim().length > 1 ? displayName.trim() : null
  const greeting = safeName ? `Hallo ${escapeHtml(safeName)},` : 'Hallo,'
  const { href: ctaHref, label: ctaLabel } = buildCta(appUrl, userType)
  const base = appUrl.replace(/\/$/, '')
  const suppliedLogo = (logoUrl || '').trim()
  const effectiveLogo = suppliedLogo
    ? (suppliedLogo.startsWith('http://') || suppliedLogo.startsWith('https://')
        ? suppliedLogo
        : `${base}${suppliedLogo.startsWith('/') ? '' : '/'}${suppliedLogo}`)
    : `${base}/android-chrome-512x512.png`
  const brand = effectiveLogo
    ? `<img src="${escapeHtml(effectiveLogo)}" alt="THEGND" style="display:block;height:46px;width:auto;margin:0 auto;border-radius:0" />`
    : `<div style="font-size:18px;letter-spacing:2px;color:#ec4899;font-weight:700">THEGND</div>`

  return `<!doctype html>
  <html lang="de">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Willkommen bei THEGND</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f8;color:#111;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Dein Account wurde erfolgreich angelegt. ${safeName ? `Hallo ${escapeHtml(safeName)}!` : ''}</span>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#f6f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:0">
            <tr>
              <td style="padding:24px 24px 0 24px;text-align:center">
                ${brand}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px">
                <div style="height:2px;width:64px;margin:0 auto;background:#ec4899"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 0 24px">
                <h1 style="margin:0 0 8px 0;font-size:20px;line-height:28px;color:#111">Willkommen bei THEGND</h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:20px;color:#111">${greeting}</p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:20px;color:#111">Dein Account wurde erfolgreich angelegt.</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#111">Du kannst dich jetzt anmelden und starten.</p>
                <p style="margin:16px 0 24px 0">
                  <a href="${ctaHref}" style="background:#ec4899;color:#fff;text-decoration:none;padding:12px 18px;border-radius:0;display:inline-block;font-size:14px">${ctaLabel}</a>
                </p>
                <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#555">Wenn du diese Registrierung nicht vorgenommen hast, ignoriere bitte diese E‑Mail.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px 24px">
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 12px 0" />
                <p style="margin:0;font-size:12px;line-height:18px;color:#6b7280">© ${new Date().getFullYear()} THEGND. Alle Rechte vorbehalten.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function buildWelcomeEmailText(appUrl: string, userType?: string, displayName?: string | null) {
  const plainGreeting = displayName && displayName.trim().length > 1 ? `Hallo ${displayName.trim()},` : 'Hallo,'
  return [
    'Willkommen bei THEGND',
    '',
    `${plainGreeting}`,
    'Dein Account wurde erfolgreich angelegt.',
    'Du kannst dich jetzt anmelden und mit dem Onboarding fortfahren.',
    '',
    `Jetzt anmelden: ${appUrl.replace(/\/$/, '')}/auth/signin`,
    '',
    'Wenn du diese Registrierung nicht vorgenommen hast, ignoriere bitte diese E-Mail.'
  ].join('\n')
}

export function getWelcomePresets(appUrl: string, logoUrl?: string | null) {
  const base = appUrl || 'https://thegnd.net'
  return [
    {
      id: 'welcome_standard_member',
      label: 'Welcome – Standard (Member)',
      subject: 'Willkommen bei THEGND',
      html: buildWelcomeEmailHtml({ appUrl: base, userType: 'MEMBER', displayName: null, logoUrl: logoUrl ?? null }),
      text: buildWelcomeEmailText(base, 'MEMBER', null),
    },
    {
      id: 'welcome_standard_escort',
      label: 'Welcome – Standard (Escort)',
      subject: 'Willkommen bei THEGND',
      html: buildWelcomeEmailHtml({ appUrl: base, userType: 'ESCORT', displayName: null, logoUrl: logoUrl ?? null }),
      text: buildWelcomeEmailText(base, 'ESCORT', null),
    },
    {
      id: 'welcome_standard_agency',
      label: 'Welcome – Standard (Agency)',
      subject: 'Willkommen bei THEGND',
      html: buildWelcomeEmailHtml({ appUrl: base, userType: 'AGENCY', displayName: null, logoUrl: logoUrl ?? null }),
      text: buildWelcomeEmailText(base, 'AGENCY', null),
    },
    {
      id: 'welcome_standard_club',
      label: 'Welcome – Standard (Club)',
      subject: 'Willkommen bei THEGND',
      html: buildWelcomeEmailHtml({ appUrl: base, userType: 'CLUB', displayName: null, logoUrl: logoUrl ?? null }),
      text: buildWelcomeEmailText(base, 'CLUB', null),
    },
    {
      id: 'welcome_standard_studio',
      label: 'Welcome – Standard (Studio)',
      subject: 'Willkommen bei THEGND',
      html: buildWelcomeEmailHtml({ appUrl: base, userType: 'STUDIO', displayName: null, logoUrl: logoUrl ?? null }),
      text: buildWelcomeEmailText(base, 'STUDIO', null),
    },
  ] as Array<{ id: string; label: string; subject: string; html: string; text: string }>
}

type ResetParams = {
  appUrl: string
  resetUrl: string
  displayName?: string | null
  logoUrl?: string | null
}

export function buildPasswordResetEmailHtml({ appUrl, resetUrl, displayName, logoUrl }: ResetParams) {
  const base = appUrl.replace(/\/$/, '')
  const safeName = displayName && displayName.trim().length > 1 ? displayName.trim() : null
  const greeting = safeName ? `Hallo ${escapeHtml(safeName)},` : 'Hallo,'
  const suppliedLogo = (logoUrl || '').trim()
  const effectiveLogo = suppliedLogo
    ? (suppliedLogo.startsWith('http://') || suppliedLogo.startsWith('https://')
        ? suppliedLogo
        : `${base}${suppliedLogo.startsWith('/') ? '' : '/'}${suppliedLogo}`)
    : `${base}/android-chrome-512x512.png`
  const brand = effectiveLogo
    ? `<img src="${escapeHtml(effectiveLogo)}" alt="THEGND" style="display:block;height:46px;width:auto;margin:0 auto;border-radius:0" />`
    : `<div style="font-size:18px;letter-spacing:2px;color:#ec4899;font-weight:700">THEGND</div>`

  return `<!doctype html>
  <html lang="de">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Passwort zurücksetzen</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f8;color:#111;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Link zum Zurücksetzen deines Passworts</span>
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:#f6f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:0">
            <tr>
              <td style="padding:24px 24px 0 24px;text-align:center">
                ${brand}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 0 24px">
                <div style="height:2px;width:64px;margin:0 auto;background:#ec4899"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 0 24px">
                <h1 style="margin:0 0 8px 0;font-size:20px;line-height:28px;color:#111">Passwort zurücksetzen</h1>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:20px;color:#111">${greeting}</p>
                <p style="margin:0 0 8px 0;font-size:14px;line-height:20px;color:#111">Du hast das Zurücksetzen deines Passworts angefordert.</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:20px;color:#111">Klicke auf den Button, um ein neues Passwort zu vergeben.</p>
                <p style="margin:16px 0 24px 0">
                  <a href="${escapeHtml(resetUrl)}" style="background:#ec4899;color:#fff;text-decoration:none;padding:12px 18px;border-radius:0;display:inline-block;font-size:14px">Passwort zurücksetzen</a>
                </p>
                <p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#555">Wenn du diese Aktion nicht angefordert hast, kannst du diese E‑Mail ignorieren.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px 24px 24px">
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 12px 0" />
                <p style="margin:0;font-size:12px;line-height:18px;color:#6b7280">© ${new Date().getFullYear()} THEGND. Alle Rechte vorbehalten.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`
}

export function buildPasswordResetEmailText(appUrl: string, resetUrl: string, displayName?: string | null) {
  const plainGreeting = displayName && displayName.trim().length > 1 ? `Hallo ${displayName.trim()},` : 'Hallo,'
  return [
    'Passwort zurücksetzen',
    '',
    `${plainGreeting}`,
    'Du hast das Zurücksetzen deines Passworts angefordert.',
    'Klicke auf den folgenden Link, um ein neues Passwort zu vergeben:',
    '',
    resetUrl,
    '',
    'Wenn du diese Aktion nicht angefordert hast, kannst du diese E‑Mail ignorieren.'
  ].join('\n')
}
