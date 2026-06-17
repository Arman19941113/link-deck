// Creates deck backup, import, reset, and clear actions.

import { useCallback } from 'react'

import { getDeckActionErrorMessage } from './deck-action-utils'
import type { OptimisticDeckCommitter } from './use-deck-mutation-committer'
import { createDefaultPersistedDeck, createEmptyPersistedDeck } from '@/domain/deck/default-data'
import { parseDeckBackupPayload, type DeckBackupPayload } from '@/domain/deck/deck-transfer'
import type { PersistedAppState } from '@/domain/deck/types'
import type { AppLanguage } from '@/domain/settings/language'
import { deckPersistenceService } from '@/services/deck-persistence'

type UseDeckBackupActionsParams = OptimisticDeckCommitter & {
  setError: (error: string | null) => void
}

/** Creates backup and destructive replacement actions for deck data. */
export function useDeckBackupActions({ commitOptimisticDeckDataPatch, setError }: UseDeckBackupActionsParams) {
  const replaceDeckOptimistically = useCallback(
    (deck: PersistedAppState): void => {
      commitOptimisticDeckDataPatch(
        {
          categories: deck.categories,
          links: deck.links,
        },
        async () => {
          await deckPersistenceService.replaceDeck(deck)
        },
      )
    },
    [commitOptimisticDeckDataPatch],
  )

  const exportDeck = useCallback(async (): Promise<DeckBackupPayload> => {
    try {
      const exportFile = await deckPersistenceService.exportDeck()

      setError(null)

      return exportFile
    } catch (exportError) {
      setError(getDeckActionErrorMessage(exportError))
      throw exportError
    }
  }, [setError])

  const importDeck = useCallback(
    async (json: string): Promise<void> => {
      try {
        const importedDeck = await parseDeckBackupPayload(json)

        replaceDeckOptimistically(importedDeck)
      } catch (importError) {
        setError(getDeckActionErrorMessage(importError))
        throw importError
      }
    },
    [replaceDeckOptimistically, setError],
  )

  const resetDeckToDefaults = useCallback(
    async (language: AppLanguage): Promise<void> => {
      try {
        replaceDeckOptimistically(createDefaultPersistedDeck(language))
      } catch (resetError) {
        setError(getDeckActionErrorMessage(resetError))
        throw resetError
      }
    },
    [replaceDeckOptimistically, setError],
  )

  const clearDeckData = useCallback(
    async (language: AppLanguage): Promise<void> => {
      try {
        replaceDeckOptimistically(createEmptyPersistedDeck(language))
      } catch (clearError) {
        setError(getDeckActionErrorMessage(clearError))
        throw clearError
      }
    },
    [replaceDeckOptimistically, setError],
  )

  return {
    clearDeckData,
    exportDeck,
    importDeck,
    resetDeckToDefaults,
  }
}
