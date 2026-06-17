// Defines the portable deck backup format and validates import/export payloads.

import { isCategory, isRecord, isSavedLink, isTimestamp } from './deck-guards'
import type { Category, StoredIconFile, SavedLink, PersistedAppState } from './types'

type ExportedIconFile = Omit<StoredIconFile, 'blob'> & {
  dataUrl: string
}

type DeckBackupBlobCodec = {
  encodeBlob: (blob: Blob, errorMessage?: string) => Promise<string>
  decodeDataUrl: (dataUrl: string, errorMessage?: string) => Promise<Blob>
}

export type DeckBackupPayload = {
  app: 'link-deck'
  version: 1
  exportedAt: string
  deck: {
    id: string
    name: string
    categories: Category[]
    links: SavedLink[]
    iconFiles: ExportedIconFile[]
    createdAt: string
    updatedAt: string
  }
}

/** Creates a downloadable JSON backup from the current persisted deck state. */
export async function createDeckBackupPayload(
  deck: PersistedAppState,
  blobCodec: DeckBackupBlobCodec,
): Promise<DeckBackupPayload> {
  const iconFiles = await Promise.all(
    deck.iconFiles.map(async iconFile => ({
      id: iconFile.id,
      name: iconFile.name,
      mimeType: iconFile.mimeType,
      size: iconFile.size,
      createdAt: iconFile.createdAt,
      dataUrl: await blobCodec.encodeBlob(iconFile.blob, 'Icon file export failed'),
    })),
  )

  return {
    app: 'link-deck',
    version: 1,
    exportedAt: new Date().toISOString(),
    deck: {
      id: deck.id,
      name: deck.name,
      categories: deck.categories,
      links: deck.links,
      iconFiles,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    },
  }
}

/** Parses and validates a JSON backup file before replacing local data. */
export async function parseDeckBackupPayload(json: string, blobCodec: DeckBackupBlobCodec): Promise<PersistedAppState> {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Import file is not valid JSON')
  }

  if (!isRecord(parsed) || parsed.app !== 'link-deck' || parsed.version !== 1 || !isRecord(parsed.deck)) {
    throw new Error('Import file is not a Link Deck backup')
  }

  const deck = parsed.deck

  if (
    typeof deck.id !== 'string' ||
    typeof deck.name !== 'string' ||
    !Array.isArray(deck.categories) ||
    !Array.isArray(deck.links) ||
    !Array.isArray(deck.iconFiles) ||
    !isTimestamp(deck.createdAt) ||
    !isTimestamp(deck.updatedAt)
  ) {
    throw new Error('Import file is missing required deck data')
  }

  const categories = deck.categories
  const links = deck.links
  const exportedIconFiles = deck.iconFiles

  if (!categories.length || !categories.every(category => isCategory(category))) {
    throw new Error('Import file must contain at least one valid category')
  }

  if (!links.every(link => isSavedLink(link))) {
    throw new Error('Import file contains invalid links')
  }

  if (!exportedIconFiles.every(isExportedIconFile)) {
    throw new Error('Import file contains invalid icon files')
  }

  const categoryIds = new Set(categories.map(category => category.id))
  const iconFileIds = new Set(exportedIconFiles.map(iconFile => iconFile.id))

  if (categoryIds.size !== categories.length) {
    throw new Error('Import file contains duplicate categories')
  }

  if (new Set(links.map(link => link.id)).size !== links.length) {
    throw new Error('Import file contains duplicate links')
  }

  if (iconFileIds.size !== exportedIconFiles.length) {
    throw new Error('Import file contains duplicate icon files')
  }

  if (links.some(link => !categoryIds.has(link.categoryId))) {
    throw new Error('Import file contains links for missing categories')
  }

  if (links.some(link => link.icon.type === 'file' && !iconFileIds.has(link.icon.fileId))) {
    throw new Error('Import file contains links with missing icon files')
  }

  const iconFiles = await Promise.all(
    exportedIconFiles.map(async iconFile => ({
      id: iconFile.id,
      blob: await blobCodec.decodeDataUrl(iconFile.dataUrl, 'Imported icon file could not be read'),
      name: iconFile.name,
      mimeType: iconFile.mimeType,
      size: iconFile.size,
      createdAt: iconFile.createdAt,
    })),
  )

  return {
    id: deck.id,
    name: deck.name,
    categories,
    links,
    iconFiles,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  }
}

/** Validates imported icon metadata and encoded data before persistence. */
function isExportedIconFile(value: unknown): value is ExportedIconFile {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    typeof value.mimeType === 'string' &&
    typeof value.size === 'number' &&
    Number.isFinite(value.size) &&
    isTimestamp(value.createdAt) &&
    typeof value.dataUrl === 'string' &&
    value.dataUrl.startsWith('data:')
  )
}
