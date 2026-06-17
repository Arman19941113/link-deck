// Provides domain selectors for UI display.

import { matchesNormalizedSearchQuery, normalizeSearchText } from './search-text'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, VisibleCategorySection, SavedLink } from '@/domain/deck/types'

/** Builds the final deck sections for rendering, optionally including empty categories. */
export function selectRenderableSections({
  categories,
  includeEmptyCategories,
  sections,
}: {
  categories: Category[]
  includeEmptyCategories: boolean
  sections: VisibleCategorySection[]
}): VisibleCategorySection[] {
  if (!includeEmptyCategories) {
    return sections
  }

  const sectionByCategoryId = new Map(sections.map(section => [section.category.id, section] as const))

  return sortByOrder(categories).map(category => sectionByCategoryId.get(category.id) ?? { category, links: [] })
}

/** Applies the display sort mode to a link list. */
export function sortLinks(links: SavedLink[], sortMode: SortMode): SavedLink[] {
  switch (sortMode) {
    case 'name':
      return [...links].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN') || left.order - right.order)
    case 'manual':
      return sortByOrder(links)
  }
}

/** Builds displayable category groups from categories, query, and sort mode. */
export function selectSearchMatchedSections(
  categories: Category[],
  links: SavedLink[],
  query: string,
  sortMode: SortMode,
): VisibleCategorySection[] {
  const normalizedQuery = normalizeSearchText(query)

  return sortByOrder(categories).flatMap(category => {
    const categoryLinks = links.filter(link => link.categoryId === category.id)

    if (!categoryLinks.length) {
      return []
    }

    const categoryMatches = normalizedQuery ? matchesNormalizedSearchQuery([category.name], normalizedQuery) : false
    const visibleLinks =
      !normalizedQuery || categoryMatches
        ? categoryLinks
        : categoryLinks.filter(link => linkMatchesQuery(link, normalizedQuery))

    if (!visibleLinks.length) {
      return []
    }

    return [
      {
        category,
        links: sortLinks(visibleLinks, sortMode),
      },
    ]
  })
}

/** Creates a stable new array sorted by the domain order field. */
function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order)
}

/** Checks whether the link fields match the query. */
function linkMatchesQuery(link: SavedLink, normalizedQuery: string): boolean {
  return matchesNormalizedSearchQuery([link.name, link.url, link.note ?? ''], normalizedQuery)
}
