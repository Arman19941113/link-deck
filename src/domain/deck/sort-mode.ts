// Defines saved-link sort mode defaults and validation helpers.

import type { SortMode } from './types'

export const DEFAULT_SORT_MODE: SortMode = 'manual'
export const SORT_MODE_OPTIONS = ['manual', 'name'] as const satisfies readonly SortMode[]

const SORT_MODE_VALUES = new Set<SortMode>(SORT_MODE_OPTIONS)

/** Checks unknown stored settings before using them as sort-mode state. */
export function isSortMode(value: unknown): value is SortMode {
  return typeof value === 'string' && SORT_MODE_VALUES.has(value as SortMode)
}
