// Shares link editor icon validation limits and small formatting helpers.

import type { SavedLink } from '@/domain/deck/types'

export type IconMode = 'auto' | 'builtin' | 'url' | 'file'

export const ICON_FILE_ACCEPT = '.png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml'
export const MAX_ICON_FILE_SIZE = 1024 * 1024
export const ACCEPTED_ICON_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

const EXPLICIT_HTTP_SCHEME = /^https?:\/\//i

/** Derives the form icon mode from the current saved link icon settings. */
export function getInitialIconMode(link?: SavedLink | null): IconMode {
  if (!link || link.icon.type === 'auto') {
    return 'auto'
  }

  return link.icon.type
}

/** Creates a readable default title when the user leaves the title field empty. */
export function getFallbackLinkName(url: string): string {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return ''
  }

  try {
    const parsedUrl = new URL(EXPLICIT_HTTP_SCHEME.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`)
    return parsedUrl.host.replace(/^www\./i, '') || trimmedUrl
  } catch {
    return trimmedUrl
  }
}

/** Formats selected file sizes for compact helper text. */
export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
