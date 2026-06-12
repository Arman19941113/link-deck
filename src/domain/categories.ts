// Defines category domain constants and helpers shared by storage and UI layers.

import type { Category } from './types'

export const DEFAULT_CATEGORY_ID = 'default'
export const DEFAULT_CATEGORY_NAME = 'Default'

/** Checks whether a category is the built-in default category. */
export function isDefaultCategory(categoryId: string): boolean {
  return categoryId === DEFAULT_CATEGORY_ID
}

/** Creates the built-in default category record. */
export function createDefaultCategory(now: string, order = 1): Category {
  return {
    id: DEFAULT_CATEGORY_ID,
    name: DEFAULT_CATEGORY_NAME,
    order,
    createdAt: now,
    updatedAt: now,
  }
}
