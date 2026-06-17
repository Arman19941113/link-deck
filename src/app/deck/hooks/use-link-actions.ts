// Creates optimistic link mutation, opening, movement, and icon cleanup actions.

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { createDeckRecordId, getDeckActionErrorMessage } from './deck-action-utils'
import type { DeckActionDeps } from './deck-action-deps'
import { createFileIcon, createStoredIconFile, getLocalIconId, isIconReferenced } from '@/domain/deck/link-icons'
import { createLinkUpsertPlan, type UpsertLinkInput } from '@/domain/deck/link-upsert-plan'
import { getChangedLinks, mergeLinks, removeLinks } from '@/domain/deck/deck-collection'
import { createUserFacingError } from '@/domain/deck/deck-validation'
import { moveLinkWithReorderedSiblings } from '@/domain/deck/reorder'
import type { SavedLink, StoredIconFile } from '@/domain/deck/types'
import { deckPersistenceService } from '@/services/deck-persistence'

type LinkActionContext = Pick<
  DeckActionDeps,
  'categoriesRef' | 'commitOptimisticDeckDataPatch' | 'linksRef' | 'setError'
>

/** Creates link actions that operate against the latest deck state refs. */
export function useLinkActions({
  categoriesRef,
  commitOptimisticDeckDataPatch,
  linksRef,
  setError,
}: LinkActionContext) {
  const { t } = useTranslation()
  const cleanupIconIfUnused = useCallback(
    async (iconId: string, nextLinks: SavedLink[]) => {
      if (isIconReferenced(nextLinks, iconId)) {
        return
      }

      try {
        await deckPersistenceService.deleteIconFile(iconId)
      } catch (cleanupError) {
        setError(t('deck.errors.iconCleanupFailed', { message: getDeckActionErrorMessage(cleanupError) }))
      }
    },
    [setError, t],
  )

  const upsertLink = useCallback(
    async (input: UpsertLinkInput): Promise<SavedLink> => {
      const latestCategories = categoriesRef.current
      const latestLinks = linksRef.current
      const savedIconFile: StoredIconFile | null = input.iconFile ? createStoredIconFile(input.iconFile) : null
      let upsertPlan: ReturnType<typeof createLinkUpsertPlan>

      try {
        upsertPlan = createLinkUpsertPlan({
          input: {
            ...input,
            icon: savedIconFile ? createFileIcon(savedIconFile) : input.icon,
          },
          latestCategories,
          latestLinks,
          createLinkId: () => createDeckRecordId('link'),
        })
      } catch (upsertPlanError) {
        setError(getDeckActionErrorMessage(upsertPlanError))
        throw upsertPlanError
      }

      const nextLinks = mergeLinks(latestLinks, upsertPlan.changedLinks)

      commitOptimisticDeckDataPatch(
        { links: nextLinks },
        async () => {
          if (savedIconFile) {
            await deckPersistenceService.saveIconFileRecord(savedIconFile)
          }

          if (upsertPlan.changedLinks.length === 1) {
            await deckPersistenceService.saveLink(upsertPlan.changedLinks[0])
          } else {
            await deckPersistenceService.saveLinks(upsertPlan.changedLinks)
          }

          if (upsertPlan.previousLocalIconId && upsertPlan.previousLocalIconId !== upsertPlan.nextLocalIconId) {
            await cleanupIconIfUnused(upsertPlan.previousLocalIconId, nextLinks)
          }
        },
        {
          onRollback: () => {
            if (savedIconFile) {
              void deckPersistenceService.deleteIconFile(savedIconFile.id)
            }
          },
        },
      )

      return upsertPlan.link
    },
    [categoriesRef, cleanupIconIfUnused, commitOptimisticDeckDataPatch, linksRef, setError],
  )

  const deleteLink = useCallback(
    async (link: SavedLink): Promise<void> => {
      const latestLinks = linksRef.current
      const targetLink = latestLinks.find(currentLink => currentLink.id === link.id) ?? link
      const localIconId = getLocalIconId(targetLink.icon)
      const nextLinks = removeLinks(latestLinks, [link.id])

      commitOptimisticDeckDataPatch({ links: nextLinks }, async () => {
        await deckPersistenceService.deleteLink(link.id)

        if (localIconId) {
          await cleanupIconIfUnused(localIconId, nextLinks)
        }
      })
    },
    [cleanupIconIfUnused, commitOptimisticDeckDataPatch, linksRef],
  )

  const openLinkInNewWindow = useCallback((link: SavedLink): void => {
    const openedWindow = window.open(link.url, '_blank')

    if (openedWindow) {
      openedWindow.opener = null
    }
  }, [])

  const moveLinkToCategory = useCallback(
    async (activeLinkId: string, categoryId: string, index: number): Promise<void> => {
      const latestCategories = categoriesRef.current
      const latestLinks = linksRef.current

      if (!latestCategories.some(category => category.id === categoryId)) {
        const missingCategoryError = createUserFacingError(t('deck.errors.chooseExistingMoveCategory'))

        setError(missingCategoryError.message)
        throw missingCategoryError
      }

      const nextLinks = moveLinkWithReorderedSiblings(latestLinks, activeLinkId, categoryId, index)
      const changedLinks = getChangedLinks(latestLinks, nextLinks)

      commitOptimisticDeckDataPatch({ links: nextLinks }, () => deckPersistenceService.saveLinks(changedLinks))
    },
    [categoriesRef, commitOptimisticDeckDataPatch, linksRef, setError, t],
  )

  return {
    cleanupIconIfUnused,
    deleteLink,
    moveLinkToCategory,
    openLinkInNewWindow,
    upsertLink,
  }
}
