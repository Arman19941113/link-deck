// Shared deck view callback and loader types.

import type { StoredIconFile, SavedLink } from '@/domain/deck/types'

export type IconFileLoader = (id: string) => Promise<StoredIconFile | undefined>

export type DeckLinkHandlers = {
  onOpenLinkInNewWindow: (link: SavedLink) => void
  onEditLink: (link: SavedLink) => void
  onDeleteLink: (link: SavedLink) => Promise<void>
}
