// Loads persisted deck data on startup.

import { useEffect, useRef } from 'react'

import { getDeckActionErrorMessage } from './deck-action-utils'
import type { DeckDataSnapshot } from './use-deck-runtime-state'
import { deckPersistenceService } from '@/services/deck-persistence'
import { localAppCacheService } from '@/services/local-app-cache'
import type { AppLanguage } from '@/domain/settings/language'

type UseDeckLifecycleParams = {
  applyLoadedDeckSnapshot: (deck: DeckDataSnapshot) => void
  language: AppLanguage
  setInitialized: (initialized: boolean) => void
  setError: (error: string | null) => void
}

/** Loads persisted deck state once and marks the view model as initialized. */
export function useDeckLifecycle({
  applyLoadedDeckSnapshot,
  language,
  setError,
  setInitialized,
}: UseDeckLifecycleParams): void {
  const initialLanguageRef = useRef(language)

  useEffect(() => {
    let canceled = false

    async function load(): Promise<void> {
      try {
        const deck = await deckPersistenceService.loadDeck(initialLanguageRef.current)

        if (canceled) {
          return
        }

        applyLoadedDeckSnapshot({
          ...deck,
          displaySize: localAppCacheService.getDisplaySize(),
          sortMode: localAppCacheService.getSortMode(),
        })
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
