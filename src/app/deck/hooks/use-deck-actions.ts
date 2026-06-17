// Composes deck action groups into the public view-model action API.

import { useCategoryActions } from './use-category-actions'
import type { DeckActionDeps } from './deck-action-deps'
import { useDeckBackupActions } from './use-deck-backup-actions'
import { useDeckMutationCommitter } from './use-deck-mutation-committer'
import { useDeckSettingsActions } from './use-deck-settings-actions'
import type { DeckDataPatch } from './deck-runtime-reducer'
import type { CurrentRef, DeckDataSnapshot } from './use-deck-runtime-state'
import { useLinkActions } from './use-link-actions'
import { usePersistenceQueue } from './use-persistence-queue'
import type { DeckBackupPayload } from '@/domain/deck/deck-backup'
import type { DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import type { UpsertLinkInput } from '@/domain/deck/link-upsert-plan'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, SavedLink, StoredIconFile } from '@/domain/deck/types'
import type { AppLanguage } from '@/domain/settings/language'
import type { DisplaySize } from '@/domain/settings/display-size'
import { deckPersistenceService } from '@/services/deck-persistence'

type UseDeckActionsParams = {
  categoriesRef: CurrentRef<Category[]>
  linksRef: CurrentRef<SavedLink[]>
  setError: (error: string | null) => void
  applyDeckDataPatch: (patch: DeckDataPatch) => void
  getCurrentDeckDataSnapshot: () => DeckDataSnapshot
}

export type DeckActions = {
  setDisplaySize: (displaySize: DisplaySize) => void
  setSortMode: (sortMode: SortMode) => void
  upsertLink: (input: UpsertLinkInput) => Promise<SavedLink>
  deleteLink: (link: SavedLink) => Promise<void>
  openLinkInNewWindow: (link: SavedLink) => void
  addCategory: (name: string) => Promise<Category>
  renameCategory: (categoryId: string, name: string) => Promise<void>
  deleteCategory: (categoryId: string, options?: DeleteCategoryLinksStrategy) => Promise<void>
  moveLinkToCategory: (activeLinkId: string, categoryId: string, index: number) => Promise<void>
  reorderCategoryList: (activeCategoryId: string, overCategoryId: string) => Promise<void>
  loadStoredIconFile: (id: string) => Promise<StoredIconFile | undefined>
  exportDeck: () => Promise<DeckBackupPayload>
  importDeck: (json: string) => Promise<void>
  resetDeckToDefaults: (language: AppLanguage) => Promise<void>
  clearDeckData: (language: AppLanguage) => Promise<void>
}

/** Creates deck actions that operate against the latest deck state refs. */
export function useDeckActions({
  categoriesRef,
  linksRef,
  setError,
  applyDeckDataPatch,
  getCurrentDeckDataSnapshot,
}: UseDeckActionsParams): DeckActions {
  const enqueuePersistence = usePersistenceQueue()
  const mutationCommitter = useDeckMutationCommitter({
    applyDeckDataPatch,
    enqueuePersistence,
    getCurrentDeckDataSnapshot,
    setError,
  })
  const actionDeps: DeckActionDeps = {
    categoriesRef,
    linksRef,
    setError,
    ...mutationCommitter,
  }
  const settingsActions = useDeckSettingsActions(mutationCommitter)
  const backupActions = useDeckBackupActions({ ...mutationCommitter, setError })
  const linkActions = useLinkActions(actionDeps)
  const categoryActions = useCategoryActions({
    ...actionDeps,
    cleanupIconIfUnused: linkActions.cleanupIconIfUnused,
  })

  return {
    setDisplaySize: settingsActions.setDisplaySize,
    setSortMode: settingsActions.setSortMode,
    upsertLink: linkActions.upsertLink,
    deleteLink: linkActions.deleteLink,
    openLinkInNewWindow: linkActions.openLinkInNewWindow,
    addCategory: categoryActions.addCategory,
    renameCategory: categoryActions.renameCategory,
    deleteCategory: categoryActions.deleteCategory,
    moveLinkToCategory: linkActions.moveLinkToCategory,
    reorderCategoryList: categoryActions.reorderCategoryList,
    loadStoredIconFile: deckPersistenceService.getIconFile,
    exportDeck: backupActions.exportDeck,
    importDeck: backupActions.importDeck,
    resetDeckToDefaults: backupActions.resetDeckToDefaults,
    clearDeckData: backupActions.clearDeckData,
  }
}
