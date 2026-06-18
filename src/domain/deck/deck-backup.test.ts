// Verifies portable deck backup payload creation and import validation.

import { describe, expect, it, vi } from 'vitest'

import { createDeckBackupPayload, parseDeckBackupPayload } from './deck-backup'
import type { Category, PersistedAppState, SavedLink, StoredIconFile } from './types'

const blobCodec = {
  encodeBlob: vi.fn(async () => 'data:image/svg+xml;base64,PHN2Zy8+'),
  decodeDataUrl: vi.fn(async () => new Blob(['svg'], { type: 'image/svg+xml' })),
}

describe('deck backup payloads', () => {
  it('exports a portable payload with encoded icon files', async () => {
    const payload = await createDeckBackupPayload(deckDocument(), blobCodec)

    expect(payload).toMatchObject({
      app: 'link-deck',
      version: 1,
      deck: {
        id: 'deck-1',
        categories: [category('default', 'Default', 1)],
        links: [link('github', 'default')],
        iconFiles: [
          {
            id: 'icon-1',
            dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
          },
        ],
      },
    })
    expect(payload.exportedAt).toEqual(expect.any(String))
    expect(blobCodec.encodeBlob).toHaveBeenCalledWith(expect.any(Blob), 'Icon file export failed')
  })

  it('parses a valid backup and decodes icon file data URLs', async () => {
    const backup = await createDeckBackupPayload(deckDocument(), blobCodec)

    const parsedDeck = await parseDeckBackupPayload(JSON.stringify(backup), blobCodec)

    expect(parsedDeck).toMatchObject({
      id: 'deck-1',
      categories: [category('default', 'Default', 1)],
      links: [link('github', 'default')],
      iconFiles: [
        {
          id: 'icon-1',
          name: 'github.svg',
          mimeType: 'image/svg+xml',
          size: 3,
        },
      ],
    })
    expect(parsedDeck.iconFiles[0]?.blob).toBeInstanceOf(Blob)
    expect(blobCodec.decodeDataUrl).toHaveBeenCalledWith(
      'data:image/svg+xml;base64,PHN2Zy8+',
      'Imported icon file could not be read',
    )
  })

  it('rejects malformed JSON and non-Link Deck backups', async () => {
    await expect(parseDeckBackupPayload('{broken', blobCodec)).rejects.toThrow('Import file is not valid JSON')
    await expect(parseDeckBackupPayload(JSON.stringify({ app: 'other', version: 1 }), blobCodec)).rejects.toThrow(
      'Import file is not a Link Deck backup',
    )
  })

  it('rejects duplicate categories, missing category references, and missing icon files', async () => {
    const duplicateCategories = backupJson({
      categories: [category('default', 'Default', 1), category('default', 'Default Copy', 2)],
    })
    const missingCategory = backupJson({
      links: [link('github', 'missing')],
    })
    const missingIcon = backupJson({
      links: [
        link('github', 'default', {
          icon: { type: 'file', fileId: 'missing-icon', name: 'missing.svg', mimeType: 'image/svg+xml' },
        }),
      ],
    })

    await expect(parseDeckBackupPayload(duplicateCategories, blobCodec)).rejects.toThrow(
      'Import file contains duplicate categories',
    )
    await expect(parseDeckBackupPayload(missingCategory, blobCodec)).rejects.toThrow(
      'Import file contains links for missing categories',
    )
    await expect(parseDeckBackupPayload(missingIcon, blobCodec)).rejects.toThrow(
      'Import file contains links with missing icon files',
    )
  })
})

function backupJson(overrides: Partial<DeckBackupShape> = {}): string {
  const deck = deckDocument()

  return JSON.stringify({
    app: 'link-deck',
    version: 1,
    exportedAt: '2026-01-02T00:00:00.000Z',
    deck: {
      id: deck.id,
      name: deck.name,
      categories: deck.categories,
      links: deck.links,
      iconFiles: [
        {
          id: 'icon-1',
          name: 'github.svg',
          mimeType: 'image/svg+xml',
          size: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
          dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
        },
      ],
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      ...overrides,
    },
  })
}

type DeckBackupShape = {
  categories: Category[]
  links: SavedLink[]
}

function deckDocument(): PersistedAppState {
  return {
    id: 'deck-1',
    name: 'Default Deck',
    categories: [category('default', 'Default', 1)],
    links: [link('github', 'default')],
    iconFiles: [iconFile('icon-1')],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function category(id: string, name: string, order: number): Category {
  return {
    id,
    name,
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function link(id: string, categoryId: string, overrides: Partial<SavedLink> = {}): SavedLink {
  return {
    id,
    categoryId,
    name: 'GitHub',
    url: 'https://github.com/',
    note: 'Code hosting',
    icon: { type: 'auto' },
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function iconFile(id: string): StoredIconFile {
  return {
    id,
    blob: new Blob(['svg'], { type: 'image/svg+xml' }),
    name: 'github.svg',
    mimeType: 'image/svg+xml',
    size: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}
