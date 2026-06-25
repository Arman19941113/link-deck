// Provides pure selectors for temporary link drag ordering previews.

import { sortCategoriesByOrder } from './categories'
import type { Category, VisibleCategorySection, SavedLink } from './types'

export type LinkIdsByCategoryId = Record<string, string[]>

export type LinkTarget = {
  categoryId: string
  index: number
}

/** Builds sortable id groups from persisted link records. */
export function createLinkIdsByCategoryId(categories: Category[], links: SavedLink[]): LinkIdsByCategoryId {
  const orderedCategories = sortCategoriesByOrder(categories)
  const linkIdsByCategoryId = Object.fromEntries(orderedCategories.map(category => [category.id, [] as string[]]))

  for (const category of orderedCategories) {
    linkIdsByCategoryId[category.id] = getManuallySortedLinks(links, category.id).map(link => link.id)
  }

  return linkIdsByCategoryId
}

/** Builds visible category sections from lightweight sortable id groups. */
export function createLinkDragPreviewSections(
  categories: Category[],
  links: SavedLink[],
  linkIdsByCategoryId: LinkIdsByCategoryId,
): VisibleCategorySection[] {
  const linkById = new Map(links.map(link => [link.id, link]))

  return sortCategoriesByOrder(categories).map(category => ({
    category,
    links: (linkIdsByCategoryId[category.id] ?? [])
      .map(linkId => linkById.get(linkId))
      .filter((link): link is SavedLink => Boolean(link)),
  }))
}

/** Compares sortable id groups so pointer moves that do not change a target avoid rerendering. */
export function areLinkIdsByCategoryIdEqual(left: LinkIdsByCategoryId, right: LinkIdsByCategoryId): boolean {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(key => {
      const leftIds = left[key] ?? []
      const rightIds = right[key] ?? []

      return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index])
    })
  )
}

/** Finds the final category and index for a link in sortable id groups. */
export function getLinkTargetFromCategoryGroups(
  linkIdsByCategoryId: LinkIdsByCategoryId,
  linkId: string,
): LinkTarget | null {
  for (const [categoryId, linkIds] of Object.entries(linkIdsByCategoryId)) {
    const index = linkIds.indexOf(linkId)

    if (index >= 0) {
      return { categoryId, index }
    }
  }

  return null
}

/** Gets the full manually ordered link sequence for a category so visible drop positions can map to real indexes. */
function getManuallySortedLinks(links: SavedLink[], categoryId: string): SavedLink[] {
  return links.filter(link => link.categoryId === categoryId).sort((left, right) => left.order - right.order)
}
