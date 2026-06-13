// Provides saved-link icon helpers for file references and cleanup checks.

import type { SavedLinkIcon } from './icon-types'
import type { SavedLink, StoredIconFile } from './types'

/** Builds a link icon reference for a saved file. */
export function createFileIcon(iconFile: StoredIconFile): SavedLinkIcon {
  return {
    type: 'file',
    fileId: iconFile.id,
    name: iconFile.name,
    mimeType: iconFile.mimeType,
  }
}

/** Creates the persisted icon record for a user-selected file. */
export function createStoredIconFile(file: File): StoredIconFile {
  return {
    id: crypto.randomUUID(),
    blob: file,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: new Date().toISOString(),
  }
}

/** Returns a local icon id so file records can be cleaned up when replacing or deleting icons. */
export function getLocalIconId(icon: SavedLinkIcon | undefined): string | null {
  return icon?.type === 'file' ? icon.fileId : null
}

/** Checks whether the current link set still references a given local icon. */
export function isIconReferenced(links: SavedLink[], iconId: string): boolean {
  return links.some(link => getLocalIconId(link.icon) === iconId)
}
