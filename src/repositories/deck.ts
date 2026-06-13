// Deck state repository operations over IndexedDB.

import { createDefaultDeck } from '@/domain/deck/default-data'
import { DEFAULT_SORT_MODE } from '@/domain/deck/sort-mode'
import type { Category, PersistedAppState, SavedLink, StoredIconFile } from '@/domain/deck/types'
import { DEFAULT_DISPLAY_SIZE } from '@/domain/settings/display-size'
import { dbPromise, queueClearStores, queuePutRecords, SETTINGS_ID } from './schema'

/** Reads the full persisted deck state, seeding default data first when the database is empty. */
export async function loadDeck(): Promise<PersistedAppState> {
  await seedIfEmpty()

  const db = await dbPromise
  const [categories, links, iconFiles, settings] = await Promise.all([
    db.getAll('categories'),
    db.getAll('links'),
    db.getAll('icons'),
    db.get('settings', SETTINGS_ID),
  ])
  const records = [...categories, ...links, ...iconFiles]
  const displaySize = settings?.displaySize ?? DEFAULT_DISPLAY_SIZE

  return {
    id: 'local',
    name: 'Local Deck',
    categories,
    links,
    iconFiles,
    displaySize,
    sortMode: settings?.sortMode ?? DEFAULT_SORT_MODE,
    createdAt: getDeckTimestamp(records, 'createdAt'),
    updatedAt: getDeckTimestamp(records, 'updatedAt'),
  }
}

/** Replaces all persisted deck data in one transaction. */
export async function replaceDeck(deck: PersistedAppState): Promise<PersistedAppState> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links', 'icons', 'settings'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')
  const iconStore = tx.objectStore('icons')
  const settingsStore = tx.objectStore('settings')

  await Promise.all([
    ...queueClearStores([categoryStore, linkStore, iconStore, settingsStore]),
    ...queuePutRecords(categoryStore, deck.categories),
    ...queuePutRecords(linkStore, deck.links),
    ...queuePutRecords(iconStore, deck.iconFiles),
    settingsStore.put(createSettingsRecord(deck)),
    tx.done,
  ])

  return deck
}

/** Writes default categories, links, and settings only before the deck has been initialized. */
async function seedIfEmpty(): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links', 'settings'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')
  const settingsStore = tx.objectStore('settings')
  const settings = await settingsStore.get(SETTINGS_ID)

  if (settings) {
    await tx.done
    return
  }

  const deck = createDefaultDeck()

  await Promise.all([
    ...queuePutRecords(categoryStore, deck.categories),
    ...queuePutRecords(linkStore, deck.links),
    settingsStore.put({
      id: SETTINGS_ID,
      displaySize: DEFAULT_DISPLAY_SIZE,
      sortMode: DEFAULT_SORT_MODE,
      updatedAt: deck.updatedAt,
    }),
    tx.done,
  ])
}

/** Builds the singleton settings record stored alongside deck content. */
function createSettingsRecord(deck: PersistedAppState) {
  return {
    id: SETTINGS_ID,
    displaySize: deck.displaySize,
    sortMode: deck.sortMode,
    updatedAt: deck.updatedAt,
  }
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
