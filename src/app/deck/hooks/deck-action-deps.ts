// Shared action hook dependencies for deck mutations.

import type { CurrentRef } from './use-deck-runtime-state'
import type { OptimisticDeckCommitter } from './use-deck-mutation-committer'
import type { Category, SavedLink } from '@/domain/deck/types'

export type DeckActionDeps = {
  categoriesRef: CurrentRef<Category[]>
  linksRef: CurrentRef<SavedLink[]>
  setError: (error: string | null) => void
} & OptimisticDeckCommitter
