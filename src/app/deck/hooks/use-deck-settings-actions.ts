// Creates local preference actions for deck display and sorting settings.

import { useCallback } from 'react'

import type { OptimisticDeckCommitter } from './use-deck-mutation-committer'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { DisplaySize } from '@/domain/settings/display-size'
import { localAppCacheService } from '@/services/local-app-cache'

/** Creates actions for settings that are stored outside deck persistence. */
export function useDeckSettingsActions({ commitOptimisticDeckDataPatch }: OptimisticDeckCommitter) {
  const setDisplaySize = useCallback(
    (nextDisplaySize: DisplaySize): void => {
      localAppCacheService.setDisplaySize(nextDisplaySize)
      commitOptimisticDeckDataPatch({ displaySize: nextDisplaySize }, async () => {})
    },
    [commitOptimisticDeckDataPatch],
  )

  const setSortMode = useCallback(
    (nextSortMode: SortMode): void => {
      localAppCacheService.setSortMode(nextSortMode)
      commitOptimisticDeckDataPatch({ sortMode: nextSortMode }, async () => {})
    },
    [commitOptimisticDeckDataPatch],
  )

  return {
    setDisplaySize,
    setSortMode,
  }
}
