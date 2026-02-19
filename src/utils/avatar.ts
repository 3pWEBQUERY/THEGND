/**
 * Shared avatar utilities.
 *
 * Default avatars:
 *   - MEMBER          → /default_avatar_man.jpg
 *   - ESCORT / HOBBYHURE / AGENCY / CLUB / STUDIO → /default_avatar_woman.jpg
 */

const WOMAN_TYPES = new Set(['ESCORT', 'HOBBYHURE', 'AGENCY', 'CLUB', 'STUDIO'])

/**
 * Returns the default avatar path based on user type.
 */
export function getDefaultAvatar(userType?: string | null): string {
  if (userType && WOMAN_TYPES.has(userType)) {
    return '/default_avatar_woman.jpg'
  }
  return '/default_avatar_man.jpg'
}

/**
 * Normalises an avatar URL coming from the API / DB:
 *  - falsy / empty → undefined
 *  - absolute URLs  → returned as-is
 *  - relative paths → ensured to start with "/"
 */
export function normalizeAvatar(url?: string | null): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/**
 * Returns the avatar URL to display.
 * If the user has a custom avatar it is normalised and returned,
 * otherwise the gender-appropriate default image path is returned.
 */
export function getAvatarUrl(
  avatar?: string | null,
  userType?: string | null,
): string {
  return normalizeAvatar(avatar) ?? getDefaultAvatar(userType)
}
