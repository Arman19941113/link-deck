// Creates category mutation and ordering actions for the deck view model.

import { useCallback } from 'react'

import { createDeckRecordId, getDeckActionErrorMessage } from './deck-action-utils'
import type { DeckActionDeps } from './deck-action-deps'
import { createCategoryRecord, renameCategoryRecord } from '@/domain/deck/categories'
import { createCategoryDeleteChanges, type DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import { mergeCategory, mergeLinks, removeLinks } from '@/domain/deck/deck-collection'
import { reorderCategories } from '@/domain/deck/reorder'
import type { Category, SavedLink } from '@/domain/deck/types'
import { deckPersistenceService } from '@/services/deck-persistence'

type CategoryActionDeps = DeckActionDeps & {
  cleanupIconIfUnused: (iconId: string, nextLinks: SavedLink[]) => Promise<void>
}

/** Creates category actions that coordinate optimistic state and queued persistence. */
export function useCategoryActions({
  categoriesRef,
  cleanupIconIfUnused,
  commitOptimisticDeckDataPatch,
  linksRef,
  setError,
}: CategoryActionDeps) {
  const addCategory = useCallback(
    async (nameInput: string): Promise<Category> => {
      const latestCategories = categoriesRef.current
      const category = createCategoryRecord({
        latestCategories,
        nameInput,
        createCategoryId: () => createDeckRecordId('category'),
      })

      commitOptimisticDeckDataPatch({ categories: mergeCategory(categoriesRef.current, category) }, () =>
        deckPersistenceService.saveCategory(category),
      )

      return category
    },
    [categoriesRef, commitOptimisticDeckDataPatch],
  )

  const renameCategory = useCallback(
    async (categoryId: string, nameInput: string): Promise<void> => {
      const latestCategories = categoriesRef.current
      let nextCategory: Category

      try {
        nextCategory = renameCategoryRecord({
          categoryId,
          latestCategories,
          nameInput,
        })
      } catch (renameError) {
        setError(getDeckActionErrorMessage(renameError))
        throw renameError
      }

      commitOptimisticDeckDataPatch({ categories: mergeCategory(categoriesRef.current, nextCategory) }, () =>
        deckPersistenceService.saveCategory(nextCategory),
      )
    },
    [categoriesRef, commitOptimisticDeckDataPatch, setError],
  )

  const deleteCategory = useCallback(
    async (categoryId: string, options?: DeleteCategoryLinksStrategy): Promise<void> => {
      const latestCategories = categoriesRef.current
      const latestLinks = linksRef.current
      let deleteChanges: ReturnType<typeof createCategoryDeleteChanges>

      try {
        deleteChanges = createCategoryDeleteChanges({
          categoryId,
          options,
          latestCategories,
          latestLinks,
        })
      } catch (deleteChangesError) {
        setError(getDeckActionErrorMessage(deleteChangesError))
        throw deleteChangesError
      }

      if (!deleteChanges.movedLinks.length && !deleteChanges.deletedLinkIds.length) {
        commitOptimisticDeckDataPatch({ categories: deleteChanges.nextCategories }, () =>
          deckPersistenceService.persistCategoryDeleteChanges(deleteChanges),
        )
        return
      }

      if (deleteChanges.movedLinks.length) {
        const nextLinks = mergeLinks(linksRef.current, deleteChanges.movedLinks)

        commitOptimisticDeckDataPatch({ categories: deleteChanges.nextCategories, links: nextLinks }, () =>
          deckPersistenceService.persistCategoryDeleteChanges(deleteChanges),
        )
        return
      }

      const nextLinks = removeLinks(linksRef.current, deleteChanges.deletedLinkIds)

      commitOptimisticDeckDataPatch({ categories: deleteChanges.nextCategories, links: nextLinks }, async () => {
        await deckPersistenceService.persistCategoryDeleteChanges(deleteChanges)
        for (const iconId of deleteChanges.localIconIdsToCleanup) {
          await cleanupIconIfUnused(iconId, nextLinks)
        }
      })
    },
    [categoriesRef, cleanupIconIfUnused, commitOptimisticDeckDataPatch, linksRef, setError],
  )

  const reorderCategoryList = useCallback(
    async (activeCategoryId: string, overCategoryId: string): Promise<void> => {
      const latestCategories = categoriesRef.current
      const nextCategories = reorderCategories(latestCategories, activeCategoryId, overCategoryId)

      commitOptimisticDeckDataPatch({ categories: nextCategories }, () =>
        deckPersistenceService.saveCategories(nextCategories),
      )
    },
    [categoriesRef, commitOptimisticDeckDataPatch],
  )

  return {
    addCategory,
    deleteCategory,
    renameCategory,
    reorderCategoryList,
  }
}
