// Computes category and link changes for a direct category deletion.

import { isDefaultCategory } from './categories'
import { getLocalIconId } from './link-icons'
import { getNextLinkOrder } from './link-order'
import type { Category, SavedLink } from './types'

/** Strategy chosen when deleting a category that contains saved links. */
export type DeleteCategoryLinksStrategy =
  | {
      mode: 'move-links'
      targetCategoryId: string
    }
  | {
      mode: 'delete-links'
    }

type CategoryDeleteChanges = {
  categoryIdToDelete: string
  nextCategories: Category[]
  movedLinks: SavedLink[]
  deletedLinkIds: string[]
  localIconIdsToCleanup: string[]
}

type CategoryDeleteChangesInput = {
  categoryId: string
  options?: DeleteCategoryLinksStrategy
  latestCategories: Category[]
  latestLinks: SavedLink[]
  now?: string
}

/** Creates the category/link persistence changes for deleting one category. */
export function createCategoryDeleteChanges({
  categoryId,
  options,
  latestCategories,
  latestLinks,
  now = new Date().toISOString(),
}: CategoryDeleteChangesInput): CategoryDeleteChanges {
  if (latestCategories.length <= 1) {
    throw new Error('Keep at least one category')
  }

  const category = latestCategories.find(categoryItem => categoryItem.id === categoryId)

  if (!category) {
    throw new Error('Category not found')
  }

  if (isDefaultCategory(categoryId)) {
    throw new Error('The default category cannot be deleted')
  }

  const categoryLinks = latestLinks.filter(link => link.categoryId === categoryId)
  const nextCategories = compactCategoryOrders(
    latestCategories.filter(categoryItem => categoryItem.id !== categoryId),
    now,
  )

  if (categoryLinks.length > 0 && !options) {
    throw new Error('This category contains links. Choose whether to move or delete them.')
  }

  if (options?.mode === 'move-links') {
    if (options.targetCategoryId === categoryId) {
      throw new Error('Choose another category to move links to')
    }

    if (!nextCategories.some(nextCategory => nextCategory.id === options.targetCategoryId)) {
      throw new Error('Choose an existing category to move links to')
    }

    let order = getNextLinkOrder(latestLinks, options.targetCategoryId)
    const movedLinks = categoryLinks.map(link => ({
      ...link,
      categoryId: options.targetCategoryId,
      order: order++,
      updatedAt: now,
    }))

    return {
      categoryIdToDelete: categoryId,
      nextCategories,
      movedLinks,
      deletedLinkIds: [],
      localIconIdsToCleanup: [],
    }
  }

  return {
    categoryIdToDelete: categoryId,
    nextCategories,
    movedLinks: [],
    deletedLinkIds: categoryLinks.map(link => link.id),
    localIconIdsToCleanup: [
      ...new Set(
        categoryLinks.map(link => getLocalIconId(link.icon)).filter((iconId): iconId is string => iconId !== null),
      ),
    ],
  }
}

/** Regenerates continuous order by category order. */
function compactCategoryOrders(categories: Category[], now: string): Category[] {
  return [...categories]
    .sort((left, right) => left.order - right.order)
    .map((category, index) => ({
      ...category,
      order: index + 1,
      updatedAt: now,
    }))
}
