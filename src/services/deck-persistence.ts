// Provides deck-level persistence operations over IndexedDB and portable backup files.

import { createDeckBackupPayload, type DeckBackupPayload } from '@/domain/deck/deck-transfer'
import { persistCategoryDeleteChanges, saveCategories, saveCategory } from '@/repositories/category'
import { loadDeck, replaceDeck } from '@/repositories/deck'
import { deleteIconFile, getIconFile, saveIconFileRecord } from '@/repositories/icon'
import { deleteLink, saveLink, saveLinks } from '@/repositories/link'
import { saveDisplaySize, saveSortMode } from '@/repositories/settings'

/** Public deck persistence operations used by the React store. */
export const deckPersistenceService = {
  deleteIconFile,
  deleteLink,
  exportDeck,
  getIconFile,
  loadDeck,
  replaceDeck,
  persistCategoryDeleteChanges,
  saveCategories,
  saveCategory,
  saveDisplaySize,
  saveIconFileRecord,
  saveLink,
  saveLinks,
  saveSortMode,
}

/** Loads the current persisted deck and converts it to a portable backup file. */
async function exportDeck(): Promise<DeckBackupPayload> {
  return createDeckBackupPayload(await loadDeck())
}
