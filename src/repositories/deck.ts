// Deck state repository operations over IndexedDB.

import { createDefaultDeck } from '@/domain/deck/default-data'
import type { Category, PersistedAppState, SavedLink, StoredIconFile } from '@/domain/deck/types'
import { dbPromise, queueClearStores, queuePutRecords } from './schema'

/** Reads the full persisted deck state, seeding default data first when the database is empty. */
export async function loadDeck(): Promise<PersistedAppState> {
  await seedIfEmpty()

  const db = await dbPromise
  const [categories, links, iconFiles] = await Promise.all([
    db.getAll('categories'),
    db.getAll('links'),
    db.getAll('icons'),
  ])
  const records = [...categories, ...links, ...iconFiles]

  return {
    id: 'local',
    name: 'Local Deck',
    categories,
    links,
    iconFiles,
    createdAt: getDeckTimestamp(records, 'createdAt'),
    updatedAt: getDeckTimestamp(records, 'updatedAt'),
  }
}

/** Replaces all persisted deck data in one transaction. */
export async function replaceDeck(deck: PersistedAppState): Promise<PersistedAppState> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links', 'icons'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')
  const iconStore = tx.objectStore('icons')

  await Promise.all([
    ...queueClearStores([categoryStore, linkStore, iconStore]),
    ...queuePutRecords(categoryStore, deck.categories),
    ...queuePutRecords(linkStore, deck.links),
    ...queuePutRecords(iconStore, deck.iconFiles),
    tx.done,
  ])

  return deck
}

/** Writes default categories and links only before the deck has been initialized. */
async function seedIfEmpty(): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')
  const existingCategoryCount = await categoryStore.count()

  if (existingCategoryCount > 0) {
    await tx.done
    return
  }

  const deck = createDefaultDeck()

  await Promise.all([
    ...queuePutRecords(categoryStore, deck.categories),
    ...queuePutRecords(linkStore, deck.links),
    tx.done,
  ])
}

/** Derives stable deck metadata timestamps from persisted records. */
function getDeckTimestamp(
  records: Array<Pick<Category | SavedLink | StoredIconFile, 'createdAt'> & { updatedAt?: string }>,
  type: 'createdAt' | 'updatedAt',
): string {
  const timestamps = records
    .flatMap(record => (type === 'createdAt' ? [record.createdAt] : [record.updatedAt, record.createdAt]))
    .filter((value): value is string => Boolean(value))
    .map(value => Date.parse(value))
    .filter(timestamp => Number.isFinite(timestamp))

  if (!timestamps.length) {
    return new Date().toISOString()
  }

  return new Date(type === 'createdAt' ? Math.min(...timestamps) : Math.max(...timestamps)).toISOString()
}
