// Derives visible deck sections and upgrades searches with the pinyin matcher when needed.

import { useEffect, useMemo, useState } from 'react'

import { getDeckActionErrorMessage } from './deck-action-utils'
import { loadPinyinSearchModule } from '@/domain/deck/pinyin-search-loader'
import { selectSearchMatchedSections } from '@/domain/deck/selectors'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, VisibleCategorySection, SavedLink } from '@/domain/deck/types'

type UseVisibleDeckSectionsParams = {
  categories: Category[]
  links: SavedLink[]
  query: string
  sortMode: SortMode
  setError: (error: string | null) => void
}

type PinyinSectionsState = {
  categories: Category[]
  links: SavedLink[]
  query: string
  sortMode: SortMode
  sections: VisibleCategorySection[]
}

/** Selects category sections with lightweight search first and pinyin search when loaded. */
export function useVisibleDeckSections({
  categories,
  links,
  query,
  sortMode,
  setError,
}: UseVisibleDeckSectionsParams): VisibleCategorySection[] {
  const [pinyinSectionsState, setPinyinSectionsState] = useState<PinyinSectionsState | null>(null)

  useEffect(() => {
    let canceled = false
    const hasQuery = query.trim().length > 0

    if (!hasQuery) {
      return
    }

    void loadPinyinSearchModule()
      .then(({ selectPinyinVisibleCategorySections }) => {
        if (!canceled) {
          setPinyinSectionsState({
            categories,
            links,
            query,
            sortMode,
            sections: selectPinyinVisibleCategorySections(categories, links, query, sortMode),
          })
        }
      })
      .catch((searchError: unknown) => {
        if (!canceled) {
          setError(`Search failed: ${getDeckActionErrorMessage(searchError)}`)
        }
      })

    return () => {
      canceled = true
    }
  }, [categories, links, query, setError, sortMode])

  const lightweightSections = useMemo(
    () => selectSearchMatchedSections(categories, links, query, sortMode),
    [categories, links, query, sortMode],
  )

  return pinyinSectionsState &&
    pinyinSectionsState.categories === categories &&
    pinyinSectionsState.links === links &&
    pinyinSectionsState.query === query &&
    pinyinSectionsState.sortMode === sortMode
    ? pinyinSectionsState.sections
    : lightweightSections
}
