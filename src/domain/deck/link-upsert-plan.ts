// Provides pure planning for adding or editing saved link records.

import { moveLinkWithReorderedSiblings } from './reorder'
import { getNextLinkOrder } from './link-order'
import { getLocalIconId } from './link-icons'
import { getChangedLinks } from './deck-collection'
import { createUserFacingError, normalizeRequiredName } from './deck-validation'
import { normalizeLinkUrl } from './link-url'
import type { SavedLinkIcon } from './icon-types'
import type { Category, SavedLink } from './types'

export type UpsertLinkInput = {
  id?: string
  categoryId: string
  name: string
  url: string
  note?: string
  icon?: SavedLinkIcon
  iconFile?: File | null
}

type LinkUpsertPlan = {
  link: SavedLink
  changedLinks: SavedLink[]
  previousLocalIconId: string | null
  nextLocalIconId: string | null
}

type LinkUpsertPlanInput = {
  input: UpsertLinkInput
  latestCategories: Category[]
  latestLinks: SavedLink[]
  createLinkId: () => string
  now?: string
}

const EMPTY_ICON: SavedLinkIcon = { type: 'auto' }

/** Builds the changed link records for adding or editing a link without mutating existing state. */
export function createLinkUpsertPlan({
  input,
  latestCategories,
  latestLinks,
  createLinkId,
  now = new Date().toISOString(),
}: LinkUpsertPlanInput): LinkUpsertPlan {
  const name = normalizeRequiredName(input.name, 'Enter a link title')
  const normalizedUrl = normalizeLinkUrl(input.url)

  if (!normalizedUrl) {
    throw createUserFacingError('Enter a valid http/https address')
  }

  if (!latestCategories.some(category => category.id === input.categoryId)) {
    throw createUserFacingError('Select a valid category')
  }

  const existingLink = input.id ? latestLinks.find(link => link.id === input.id) : undefined

  if (input.id && !existingLink) {
    throw createUserFacingError('Link not found')
  }

  const nextIcon = input.icon ?? existingLink?.icon ?? EMPTY_ICON
  const previousLocalIconId = getLocalIconId(existingLink?.icon)
  const nextLocalIconId = getLocalIconId(nextIcon)
  const note = input.note?.trim() || undefined
  let nextLink: SavedLink
  let changedLinks: SavedLink[]

  if (existingLink) {
    nextLink = {
      ...existingLink,
      categoryId: input.categoryId,
      name,
      url: normalizedUrl,
      note,
      icon: nextIcon,
      updatedAt: now,
    }

    if (existingLink.categoryId === input.categoryId) {
      changedLinks = [nextLink]
    } else {
      const editedInSourceCategory = {
        ...nextLink,
        categoryId: existingLink.categoryId,
      }
      const linksWithEdit = latestLinks.map(link => (link.id === existingLink.id ? editedInSourceCategory : link))
      const movedLinks = moveLinkWithReorderedSiblings(
        linksWithEdit,
        existingLink.id,
        input.categoryId,
        latestLinks.filter(link => link.categoryId === input.categoryId).length,
      )

      nextLink = movedLinks.find(link => link.id === existingLink.id) ?? nextLink
      changedLinks = getChangedLinks(latestLinks, movedLinks)
    }
  } else {
    nextLink = {
      id: createLinkId(),
      categoryId: input.categoryId,
      name,
      url: normalizedUrl,
      note,
      icon: nextIcon,
      order: getNextLinkOrder(latestLinks, input.categoryId),
      createdAt: now,
      updatedAt: now,
    }
    changedLinks = [nextLink]
  }

  return {
    link: nextLink,
    changedLinks,
    previousLocalIconId,
    nextLocalIconId,
  }
}
