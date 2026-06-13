// Provides saved-link ordering helpers.

import type { SavedLink } from './types'

/** Calculates order for a new link at the end of a category. */
export function getNextLinkOrder(links: SavedLink[], categoryId: string): number {
  return (
    links.filter(link => link.categoryId === categoryId).reduce((maxOrder, link) => Math.max(maxOrder, link.order), 0) +
    1
  )
}
