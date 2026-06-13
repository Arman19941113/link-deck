// Defines navigation domain models shared by storage and UI layers.

import type { SavedLinkIcon } from './icon-types'
import type { DisplaySize } from '@/domain/settings/types'

export type { SavedLinkIcon } from './icon-types'

export type SortMode = 'manual' | 'name'

/** Base metadata for a navigation category. */
export interface Category {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

/** A saved navigation link. */
export interface SavedLink {
  id: string
  categoryId: string
  name: string
  url: string
  note?: string
  icon: SavedLinkIcon
  order: number
  createdAt: string
  updatedAt: string
}

/** A user-uploaded file that can be referenced by saved link icons. */
export interface StoredIconFile {
  id: string
  blob: Blob
  name: string
  mimeType: string
  size: number
  createdAt: string
}

/** A complete deck document that can be persisted, imported, and exported. */
export interface DeckDocument {
  id: string
  name: string
  categories: Category[]
  links: SavedLink[]
  iconFiles: StoredIconFile[]
  createdAt: string
  updatedAt: string
}

/** User preferences persisted alongside the deck document. */
export type DeckPreferences = {
  displaySize: DisplaySize
  sortMode: SortMode
}

/** The full app state loaded from local persistence. */
export type PersistedAppState = DeckDocument & DeckPreferences

/** A selector output category with its visible saved link list. */
export interface VisibleCategorySection {
  category: Category
  links: SavedLink[]
}
