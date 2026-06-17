// Provides deck-level persistence operations over IndexedDB and portable backup files.

import { createDeckBackupPayload, type DeckBackupPayload } from '@/domain/deck/deck-transfer'
import { persistCategoryDeleteChanges, saveCategories, saveCategory } from '@/repositories/category'
import { loadDeck, replaceDeck } from '@/repositories/deck'
import { deleteIconFile, getIconFile, saveIconFileRecord } from '@/repositories/icon'
import { deleteLink, saveLink, saveLinks } from '@/repositories/link'
import type { AppLanguage } from '@/domain/settings/language'
import { DEFAULT_LANGUAGE } from '@/domain/settings/language'
import { localAppCacheService } from '@/services/local-app-cache'

/** Public deck persistence operations used by the React store. */
export const deckPersistenceService = {
  deleteIconFile,
  deleteLink,
  exportDeck,
  getIconFile,
  loadDeck: loadDeckWithLanguage,
  replaceDeck,
  persistCategoryDeleteChanges,
  saveCategories,
  saveCategory,
  saveIconFileRecord,
  saveLink,
  saveLinks,
}

/** Loads the current persisted deck and converts it to a portable backup file. */
async function exportDeck(): Promise<DeckBackupPayload> {
  return createDeckBackupPayload(await loadDeck(getCachedLanguage()))
}

/** Loads the current persisted deck using the selected seed language when empty. */
async function loadDeckWithLanguage(language: AppLanguage) {
  return loadDeck(language)
}

function getCachedLanguage(): AppLanguage {
  return localAppCacheService.getLanguagePreference() ?? DEFAULT_LANGUAGE
}
