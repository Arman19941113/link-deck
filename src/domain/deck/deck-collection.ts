// Provides immutable merge and diff helpers for deck collections.

import type { Category, SavedLink } from './types'

/** Merges one link into the latest state while preserving other concurrently produced links. */
export function mergeLink(links: SavedLink[], link: SavedLink): SavedLink[] {
  return links.some(currentLink => currentLink.id === link.id)
    ? links.map(currentLink => (currentLink.id === link.id ? link : currentLink))
    : [...links, link]
}

/** Merges a set of affected links into the latest state. */
export function mergeLinks(links: SavedLink[], changedLinks: SavedLink[]): SavedLink[] {
  const changedLinkMap = new Map(changedLinks.map(link => [link.id, link]))
  const mergedLinks = links.map(link => changedLinkMap.get(link.id) ?? link)
  const existingLinkIds = new Set(mergedLinks.map(link => link.id))

  for (const link of changedLinks) {
    if (!existingLinkIds.has(link.id)) {
      mergedLinks.push(link)
    }
  }

  return mergedLinks
}

/** Deletes the link with the given id while preserving the latest state for others. */
export function removeLinks(links: SavedLink[], linkIds: string[]): SavedLink[] {
  const deletedLinkIds = new Set(linkIds)

  return links.filter(link => !deletedLinkIds.has(link.id))
}

/** Merges one category into the latest state. */
export function mergeCategory(categories: Category[], category: Category): Category[] {
  return categories.some(currentCategory => currentCategory.id === category.id)
    ? categories.map(currentCategory => (currentCategory.id === category.id ? category : currentCategory))
    : [...categories, category]
}

/** Filters link records that actually changed compared with old state. */
export function getChangedLinks(previousLinks: SavedLink[], nextLinks: SavedLink[]): SavedLink[] {
  const previousLinkMap = new Map(previousLinks.map(link => [link.id, link]))

  return nextLinks.filter(link => hasLinkChanged(previousLinkMap.get(link.id), link))
}

/** Checks whether persisted link fields changed. */
function hasLinkChanged(left: SavedLink | undefined, right: SavedLink): boolean {
  return (
    !left ||
    left.categoryId !== right.categoryId ||
    left.name !== right.name ||
    left.url !== right.url ||
    left.note !== right.note ||
    left.order !== right.order ||
    left.updatedAt !== right.updatedAt ||
    JSON.stringify(left.icon) !== JSON.stringify(right.icon)
  )
}
