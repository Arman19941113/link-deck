// Centralizes deck runtime state transitions for the shell model hook.

import type { Category, SavedLink, SortMode } from '@/domain/deck/types'
import type { DisplaySize } from '@/domain/settings/types'

export type DeckDataSnapshot = {
  categories: Category[]
  links: SavedLink[]
  displaySize: DisplaySize
  sortMode: SortMode
}

export type DeckDataPatch = Partial<DeckDataSnapshot>

export type DeckRuntimeStore = DeckDataSnapshot & {
  query: string
  initialized: boolean
  error: string | null
}

type CreateDeckRuntimeStateInput = {
  fallbackDisplaySize: DisplaySize
  startupSnapshot: DeckDataSnapshot | null
}

export type DeckRuntimeAction =
  | {
      type: 'apply-loaded-deck-snapshot'
      deck: DeckDataSnapshot
    }
  | {
      type: 'apply-deck-data-patch'
      patch: DeckDataPatch
    }
  | {
      type: 'set-query'
      query: string
    }
  | {
      type: 'set-initialized'
      initialized: boolean
    }
  | {
      type: 'set-error'
      error: string | null
    }

export function createDeckRuntimeState({
  fallbackDisplaySize,
  startupSnapshot,
}: CreateDeckRuntimeStateInput): DeckRuntimeStore {
  return {
    categories: startupSnapshot?.categories ?? [],
    links: startupSnapshot?.links ?? [],
    displaySize: startupSnapshot?.displaySize ?? fallbackDisplaySize,
    sortMode: startupSnapshot?.sortMode ?? 'manual',
    query: '',
    initialized: Boolean(startupSnapshot),
    error: null,
  }
}

export function deckRuntimeReducer(state: DeckRuntimeStore, action: DeckRuntimeAction): DeckRuntimeStore {
  switch (action.type) {
    case 'apply-loaded-deck-snapshot':
      return {
        ...state,
        ...action.deck,
        query: '',
      }
    case 'apply-deck-data-patch':
      return {
        ...state,
        ...action.patch,
      }
    case 'set-query':
      return {
        ...state,
        query: action.query,
      }
    case 'set-initialized':
      return {
        ...state,
        initialized: action.initialized,
      }
    case 'set-error':
      return {
        ...state,
        error: action.error,
      }
  }
}
