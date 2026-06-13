// Loads persisted deck data on startup.

import { useEffect } from 'react'

import { getDeckActionErrorMessage } from './deck-action-utils'
import type { DeckDataSnapshot } from './use-deck-runtime-state'
import { deckPersistenceService } from '@/services/deck-persistence'

type UseDeckLifecycleParams = {
  applyLoadedDeckSnapshot: (deck: DeckDataSnapshot) => void
  setInitialized: (initialized: boolean) => void
  setError: (error: string | null) => void
}

/** Loads persisted deck state once and marks the view model as initialized. */
export function useDeckLifecycle({ applyLoadedDeckSnapshot, setError, setInitialized }: UseDeckLifecycleParams): void {
  useEffect(() => {
    let canceled = false

    async function load(): Promise<void> {
      try {
        const deck = await deckPersistenceService.loadDeck()

        if (canceled) {
          return
        }

        applyLoadedDeckSnapshot(deck)
        setError(null)
      } catch (loadError) {
        if (!canceled) {
          setError(getDeckActionErrorMessage(loadError))
        }
      } finally {
        if (!canceled) {
          setInitialized(true)
        }
      }
    }

    void load()

    return () => {
      canceled = true
    }
  }, [applyLoadedDeckSnapshot, setError, setInitialized])
}
