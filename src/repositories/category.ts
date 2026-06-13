// Category repository operations over IndexedDB.

import type { Category, SavedLink } from '@/domain/deck/types'
import { dbPromise, putStoreRecords, queueDeleteRecords, queuePutRecords } from './schema'

export type CategoryDeletePersistenceChanges = {
  categoryIdToDelete: string
  nextCategories: Category[]
  movedLinks: SavedLink[]
  deletedLinkIds: string[]
}

/** Saves category records in bulk. */
export async function saveCategories(categories: Category[]): Promise<void> {
  await putStoreRecords('categories', categories)
}

/** Saves a single category record. */
export async function saveCategory(category: Category): Promise<void> {
  await saveCategories([category])
}

/** Persists a category deletion and its link changes in one transaction. */
export async function persistCategoryDeleteChanges({
  categoryIdToDelete,
  nextCategories,
  movedLinks,
  deletedLinkIds,
}: CategoryDeletePersistenceChanges): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')

  await Promise.all([
    ...queuePutRecords(linkStore, movedLinks),
    ...queueDeleteRecords(linkStore, deletedLinkIds),
    ...queueDeleteRecords(categoryStore, [categoryIdToDelete]),
    ...queuePutRecords(categoryStore, nextCategories),
    tx.done,
  ])
}
