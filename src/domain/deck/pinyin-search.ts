// Builds pinyin-aware link search results for the deferred search chunk.

import { pinyin } from 'pinyin-pro'

import { normalizeSearchText } from '@/lib/search'
import { sortLinks } from './selectors'
import type { Category, VisibleCategorySection, SavedLink, SortMode } from '@/domain/deck/types'

/** Stores raw text, full pinyin, and initials for search matching. */
interface PinyinSearchIndex {
  raw: string
  pinyin: string
  initials: string
}

/** Builds displayable category groups with raw text, full pinyin, and initial matching. */
export function selectPinyinVisibleCategorySections(
  categories: Category[],
  links: SavedLink[],
  query: string,
  sortMode: SortMode,
): VisibleCategorySection[] {
  const normalizedQuery = normalizeSearchText(query)

  return [...categories]
    .sort((left, right) => left.order - right.order)
    .flatMap(category => {
      const categoryLinks = links.filter(link => link.categoryId === category.id)

      if (!categoryLinks.length) {
        return []
      }

      const categoryMatches = normalizedQuery
        ? matchesPinyinSearchIndex(normalizedQuery, createPinyinSearchIndex([category.name]))
        : false
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

/** Checks whether the link fields match the normalized pinyin-aware query. */
function linkMatchesQuery(link: SavedLink, normalizedQuery: string): boolean {
  return matchesPinyinSearchIndex(normalizedQuery, createPinyinSearchIndex([link.name, link.url, link.note ?? '']))
}

/** Checks whether a normalized query matches raw text, full pinyin, or initials. */
function matchesPinyinSearchIndex(normalizedQuery: string, index: PinyinSearchIndex): boolean {
  if (!normalizedQuery) {
    return true
  }

  return (
    index.raw.includes(normalizedQuery) ||
    index.pinyin.includes(normalizedQuery) ||
    index.initials.includes(normalizedQuery)
  )
}

/** Creates a reusable pinyin-aware search index for text fragments. */
function createPinyinSearchIndex(parts: string[]): PinyinSearchIndex {
  const normalizedParts = parts.filter(part => part.trim())
  const raw = normalizedParts.map(normalizeSearchText).join('')
  const fullPinyin = normalizedParts.map(part => normalizeSearchText(toPinyinText(part))).join('')
  const initials = normalizedParts.map(part => normalizeSearchText(toPinyinInitials(part))).join('')

  return {
    raw,
    pinyin: fullPinyin,
    initials,
  }
}

/** Converts Chinese text to full pinyin without tones. */
function toPinyinText(value: string): string {
  return pinyin(value, {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive',
    traditional: true,
    v: true,
  }).join('')
}

/** Converts Chinese text to pinyin initials. */
function toPinyinInitials(value: string): string {
  return pinyin(value, {
    toneType: 'none',
    pattern: 'first',
    type: 'array',
    nonZh: 'consecutive',
    traditional: true,
    v: true,
  }).join('')
}
