// Provides optimistic deck mutation commits with automatic UI rollback.

import { useCallback } from 'react'

import { getDeckActionErrorMessage } from './deck-action-utils'
import type { DeckDataPatch, DeckDataSnapshot } from './deck-runtime-reducer'

type UseDeckMutationCommitterParams = {
  applyDeckDataPatch: (patch: DeckDataPatch) => void
  enqueuePersistence: (persist: () => Promise<void>) => Promise<void>
  getCurrentDeckDataSnapshot: () => DeckDataSnapshot
  setError: (error: string | null) => void
}

type OptimisticCommitOptions = {
  onRollback?: (rollbackPatch: DeckDataPatch) => void
}

export type OptimisticDeckCommitter = {
  commitOptimisticDeckDataPatch: (
    patch: DeckDataPatch,
    persist: () => Promise<void>,
    options?: OptimisticCommitOptions,
  ) => void
}

export function useDeckMutationCommitter({
  applyDeckDataPatch,
  enqueuePersistence,
  getCurrentDeckDataSnapshot,
  setError,
}: UseDeckMutationCommitterParams): OptimisticDeckCommitter {
  const applyDeckPatch = useCallback(
    (patch: DeckDataPatch, options?: { clearError?: boolean }): void => {
      applyDeckDataPatch(patch)

      if (options?.clearError !== false) {
        setError(null)
      }
    },
    [applyDeckDataPatch, setError],
  )

  const commitOptimisticDeckDataPatch = useCallback(
    (patch: DeckDataPatch, persist: () => Promise<void>, options?: OptimisticCommitOptions): void => {
      const rollbackPatch = createRollbackPatch(patch, getCurrentDeckDataSnapshot())

      applyDeckPatch(patch)

      void enqueuePersistence(persist).catch(persistenceError => {
        options?.onRollback?.(rollbackPatch)

        applyDeckPatch(rollbackPatch, { clearError: false })
        setError(getDeckActionErrorMessage(persistenceError))
      })
    },
    [applyDeckPatch, enqueuePersistence, getCurrentDeckDataSnapshot, setError],
  )

  return {
    commitOptimisticDeckDataPatch,
  }
}

function createRollbackPatch(patch: DeckDataPatch, snapshot: DeckDataSnapshot): DeckDataPatch {
  return {
    categories: patch.categories ? snapshot.categories : undefined,
    links: patch.links ? snapshot.links : undefined,
    displaySize: patch.displaySize ? snapshot.displaySize : undefined,
    sortMode: patch.sortMode ? snapshot.sortMode : undefined,
  }
}
