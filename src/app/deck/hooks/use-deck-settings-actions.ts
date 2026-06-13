// Creates storage-backed deck display and sorting settings actions.

import { useCallback } from 'react'

import type { OptimisticDeckCommitter } from './use-deck-mutation-committer'
import type { SortMode } from '@/domain/deck/types'
import type { DisplaySize } from '@/domain/settings/types'
import { deckPersistenceService } from '@/services/deck-persistence'
import { localAppCacheService } from '@/services/local-app-cache'

/** Creates actions for settings that are cached immediately and persisted asynchronously. */
export function useDeckSettingsActions({ commitOptimisticDeckDataPatch }: OptimisticDeckCommitter) {
  const setDisplaySize = useCallback(
    (nextDisplaySize: DisplaySize): void => {
      localAppCacheService.setDisplaySize(nextDisplaySize)
      commitOptimisticDeckDataPatch(
        { displaySize: nextDisplaySize },
        () => deckPersistenceService.saveDisplaySize(nextDisplaySize),
        {
          onRollback: rollbackPatch => {
            if (rollbackPatch.displaySize) {
              localAppCacheService.setDisplaySize(rollbackPatch.displaySize)
            }
          },
        },
      )
    },
    [commitOptimisticDeckDataPatch],
  )

  const setSortMode = useCallback(
    (nextSortMode: SortMode): void => {
      commitOptimisticDeckDataPatch({ sortMode: nextSortMode }, () => deckPersistenceService.saveSortMode(nextSortMode))
    },
    [commitOptimisticDeckDataPatch],
  )

  return {
    setDisplaySize,
    setSortMode,
  }
}
