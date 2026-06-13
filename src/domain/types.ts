// Defines navigation domain models shared by storage and UI layers.

export type SortMode = 'manual' | 'mostVisited' | 'recentVisited' | 'name'
export type DisplaySize = 'compact' | 'comfortable' | 'spacious'
export type ThemePreference = 'auto' | 'light' | 'dark'

export type LinkIcon =
  | { type: 'auto' }
  | { type: 'builtin'; slug: string; title: string; hex: string }
  | { type: 'url'; url: string }
  | { type: 'file'; fileId: string; name: string; mimeType: string }

/** Base metadata for a navigation category. */
export interface Category {
  id: string
  name: string
  order: number
  createdAt: string
  updatedAt: string
}

/** A saved link and its open statistics. */
export interface Link {
  id: string
  categoryId: string
  name: string
  url: string
  note?: string
  icon: LinkIcon
  order: number
  visitCount: number
  lastVisitedAt?: string
  createdAt: string
  updatedAt: string
}

/** A user-uploaded file that can be referenced by saved link icons. */
export interface IconFile {
  id: string
  blob: Blob
  name: string
  mimeType: string
  size: number
  createdAt: string
}

/** A complete deck snapshot that can be persisted, imported, and exported. */
export interface DeckSnapshot {
  id: string
  name: string
  categories: Category[]
  links: Link[]
  iconFiles: IconFile[]
  createdAt: string
  updatedAt: string
}

/** A selector output category with its visible saved link list. */
export interface CategorySection {
  category: Category
  links: Link[]
}
