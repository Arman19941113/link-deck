// Defines category domain constants and helpers shared by storage and UI layers.

import { createUserFacingError, normalizeRequiredName } from './deck-validation'
import type { Category, SavedLink } from '@/domain/deck/types'

export const DEFAULT_CATEGORY_ID = 'default'
const DEFAULT_CATEGORY_NAME = 'Default'

type CreateCategoryRecordInput = {
  nameInput: string
  latestCategories: Category[]
  createCategoryId: () => string
  now?: string
}

type RenameCategoryRecordInput = {
  categoryId: string
  nameInput: string
  latestCategories: Category[]
  now?: string
}

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

/** Creates a new user category with the next available order value. */
export function createCategoryRecord({
  createCategoryId,
  latestCategories,
  nameInput,
  now = new Date().toISOString(),
}: CreateCategoryRecordInput): Category {
  const name = normalizeRequiredName(nameInput, 'Enter a category name')

  return {
    id: createCategoryId(),
    name,
    order: getNextCategoryOrder(latestCategories),
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates an updated category record for a rename operation. */
export function renameCategoryRecord({
  categoryId,
  latestCategories,
  nameInput,
  now = new Date().toISOString(),
}: RenameCategoryRecordInput): Category {
  const name = normalizeRequiredName(nameInput, 'Enter a category name')
  const category = latestCategories.find(currentCategory => currentCategory.id === categoryId)

  if (!category) {
    throw createUserFacingError('Category not found')
  }

  return {
    ...category,
    name,
    updatedAt: now,
  }
}

/** Copies categories sorted by ascending order. */
export function sortCategoriesByOrder(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.order - right.order)
}

/** Checks whether two category lists have the same ordered id sequence. */
export function haveSameCategoryOrder(leftCategories: Category[], rightCategories: Category[]): boolean {
  const leftIds = sortCategoriesByOrder(leftCategories).map(category => category.id)
  const rightIds = sortCategoriesByOrder(rightCategories).map(category => category.id)

  return leftIds.length === rightIds.length && leftIds.every((categoryId, index) => categoryId === rightIds[index])
}

/** Derives display categories from inline edit state before the rename is applied. */
export function applyCategoryEditingName(
  categories: Category[],
  editingCategoryId: string | null,
  editingName: string,
): Category[] {
  if (!editingCategoryId) {
    return categories
  }

  return categories.map(category =>
    category.id === editingCategoryId ? { ...category, name: editingName.trim() } : category,
  )
}

/** Counts saved links per category id. */
export function countLinksByCategoryId(links: SavedLink[]): Map<string, number> {
  const countMap = new Map<string, number>()

  for (const link of links) {
    countMap.set(link.categoryId, (countMap.get(link.categoryId) ?? 0) + 1)
  }

  return countMap
}

function getNextCategoryOrder(categories: Category[]): number {
  return categories.reduce((maxOrder, category) => Math.max(maxOrder, category.order), 0) + 1
}
