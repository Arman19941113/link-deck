// Owns deck runtime state, latest-value refs, and startup snapshot synchronization.

import { useCallback, useReducer, useRef, useState } from 'react'

import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, SavedLink } from '@/domain/deck/types'
import type { DisplaySize } from '@/domain/settings/display-size'
import { localAppCacheService } from '@/services/local-app-cache'
import {
  createDeckRuntimeState,
  deckRuntimeReducer,
  type DeckDataPatch,
  type DeckDataSnapshot,
} from './deck-runtime-reducer'

export type { DeckDataSnapshot }

export type CurrentRef<T> = {
  current: T
}

export type DeckRuntimeStateApi = {
  categories: Category[]
  links: SavedLink[]
  displaySize: DisplaySize
  sortMode: SortMode
  query: string
  initialized: boolean
  error: string | null
  categoriesRef: CurrentRef<Category[]>
  linksRef: CurrentRef<SavedLink[]>
  setQuery: (query: string) => void
  setInitialized: (initialized: boolean) => void
  setError: (error: string | null) => void
  applyDeckDataPatch: (patch: DeckDataPatch) => void
  applyLoadedDeckSnapshot: (deck: DeckDataSnapshot) => void
  getCurrentDeckDataSnapshot: () => DeckDataSnapshot
}

/** Creates the runtime controller consumed by the deck view model, visible sections, and action hooks. */
export function useDeckRuntimeState(): DeckRuntimeStateApi {
  const [startupSnapshot] = useState(localAppCacheService.getStartupDeckSnapshot)
  const [state, dispatch] = useReducer(
    deckRuntimeReducer,
    {
      fallbackDisplaySize: localAppCacheService.getDisplaySize(),
      fallbackSortMode: localAppCacheService.getSortMode(),
      startupSnapshot,
    },
    createDeckRuntimeState,
  )
  const categoriesRef = useRef<Category[]>(state.categories)
  const linksRef = useRef<SavedLink[]>(state.links)
  const displaySizeRef = useRef<DisplaySize>(state.displaySize)
  const sortModeRef = useRef<SortMode>(state.sortMode)

  const saveDeckDataSnapshot = useCallback((snapshot: DeckDataSnapshot) => {
    if (!snapshot.categories.length && !snapshot.links.length) {
      return
    }

    localAppCacheService.setStartupDeckSnapshot(snapshot)
  }, [])

  const syncDeckDataRefs = useCallback((snapshot: DeckDataSnapshot) => {
    categoriesRef.current = snapshot.categories
    linksRef.current = snapshot.links
    displaySizeRef.current = snapshot.displaySize
    sortModeRef.current = snapshot.sortMode
  }, [])

  const getCurrentDeckDataSnapshot = useCallback(
    (): DeckDataSnapshot => ({
      categories: categoriesRef.current,
      links: linksRef.current,
      displaySize: displaySizeRef.current,
      sortMode: sortModeRef.current,
    }),
    [],
  )

  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'set-query', query })
  }, [])

  const setInitialized = useCallback((initialized: boolean) => {
    dispatch({ type: 'set-initialized', initialized })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'set-error', error })
  }, [])

  const applyDeckDataPatch = useCallback(
    (patch: DeckDataPatch) => {
      const normalizedPatch = createDefinedDeckDataPatch(patch)

      if (isEmptyDeckDataPatch(normalizedPatch)) {
        return
      }

      const nextSnapshot = createDeckDataSnapshotFromPatch(normalizedPatch, getCurrentDeckDataSnapshot())

      syncDeckDataRefs(nextSnapshot)
      dispatch({ type: 'apply-deck-data-patch', patch: normalizedPatch })
      saveDeckDataSnapshot(nextSnapshot)
    },
    [getCurrentDeckDataSnapshot, saveDeckDataSnapshot, syncDeckDataRefs],
  )

  const applyLoadedDeckSnapshot = useCallback(
    (deck: DeckDataSnapshot) => {
      syncDeckDataRefs(deck)
      dispatch({ type: 'apply-loaded-deck-snapshot', deck })
      saveDeckDataSnapshot(deck)
    },
    [saveDeckDataSnapshot, syncDeckDataRefs],
  )

  return {
    categories: state.categories,
    links: state.links,
    displaySize: state.displaySize,
    sortMode: state.sortMode,
    query: state.query,
    initialized: state.initialized,
    error: state.error,
    categoriesRef,
    linksRef,
    setQuery,
    setInitialized,
    setError,
    applyDeckDataPatch,
    applyLoadedDeckSnapshot,
    getCurrentDeckDataSnapshot,
  }
}

function createDefinedDeckDataPatch(patch: DeckDataPatch): DeckDataPatch {
  return {
    ...(patch.categories ? { categories: patch.categories } : {}),
    ...(patch.links ? { links: patch.links } : {}),
    ...(patch.displaySize ? { displaySize: patch.displaySize } : {}),
    ...(patch.sortMode ? { sortMode: patch.sortMode } : {}),
  }
}

function isEmptyDeckDataPatch(patch: DeckDataPatch): boolean {
  return !patch.categories && !patch.links && !patch.displaySize && !patch.sortMode
}

function createDeckDataSnapshotFromPatch(patch: DeckDataPatch, currentSnapshot: DeckDataSnapshot): DeckDataSnapshot {
  return {
    categories: patch.categories ?? currentSnapshot.categories,
    links: patch.links ?? currentSnapshot.links,
    displaySize: patch.displaySize ?? currentSnapshot.displaySize,
    sortMode: patch.sortMode ?? currentSnapshot.sortMode,
  }
}
