// Composes deck runtime state, visible selectors, and deck actions for the app shell.

import { useDeckRuntimeState } from './use-deck-runtime-state'
import { useDeckActions, type DeckActions } from './use-deck-actions'
import { useDeckLifecycle } from './use-deck-lifecycle'
import { useVisibleDeckSections } from './use-visible-deck-sections'
import type { Category, VisibleCategorySection, SavedLink, SortMode } from '@/domain/deck/types'
import type { DisplaySize } from '@/domain/settings/types'

/** State, derived data, and deck actions consumed by the shell. */
type DeckShellViewModel = {
  categories: Category[]
  links: SavedLink[]
  displaySize: DisplaySize
  sortMode: SortMode
  query: string
  initialized: boolean
  error: string | null
  filteredSections: VisibleCategorySection[]
  setQuery: (query: string) => void
} & DeckActions

/** Creates the deck model consumed directly by the app shell. */
export function useDeckShellViewModel(): DeckShellViewModel {
  const runtimeState = useDeckRuntimeState()

  useDeckLifecycle({
    applyLoadedDeckSnapshot: runtimeState.applyLoadedDeckSnapshot,
    setError: runtimeState.setError,
    setInitialized: runtimeState.setInitialized,
  })

  const filteredSections = useVisibleDeckSections({
    categories: runtimeState.categories,
    links: runtimeState.links,
    query: runtimeState.query,
    sortMode: runtimeState.sortMode,
    setError: runtimeState.setError,
  })
  const actions = useDeckActions({
    categoriesRef: runtimeState.categoriesRef,
    linksRef: runtimeState.linksRef,
    setError: runtimeState.setError,
    applyDeckDataPatch: runtimeState.applyDeckDataPatch,
    getCurrentDeckDataSnapshot: runtimeState.getCurrentDeckDataSnapshot,
  })

  return {
    categories: runtimeState.categories,
    links: runtimeState.links,
    displaySize: runtimeState.displaySize,
    sortMode: runtimeState.sortMode,
    query: runtimeState.query,
    initialized: runtimeState.initialized,
    error: runtimeState.error,
    filteredSections,
    setQuery: runtimeState.setQuery,
    ...actions,
  }
}
