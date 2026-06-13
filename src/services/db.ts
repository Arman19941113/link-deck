import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import { createDefaultCategory, DEFAULT_CATEGORY_ID } from '@/domain/categories'
import { createDefaultDeck } from '@/domain/default-data'
import { DEFAULT_DISPLAY_SIZE } from '@/domain/display-size'
import type { Category, DeckSnapshot, IconFile, DisplaySize, Link, SortMode } from '@/domain/types'

type SettingsRecord = {
  id: 'settings'
  displaySize?: DisplaySize
  interfaceSize?: DisplaySize
  sortMode: SortMode
  updatedAt: string
}

interface LinkDeckDb extends DBSchema {
  categories: {
    key: string
    value: Category
  }
  links: {
    key: string
    value: Link
    indexes: { 'by-category': string }
  }
  icons: {
    key: string
    value: IconFile
  }
  settings: {
    key: string
    value: SettingsRecord
  }
}

interface LegacyLinkDeckDb extends LinkDeckDb {
  sites: {
    key: string
    value: Link
    indexes: { 'by-category': string }
  }
}

/** Snapshot loaded into the app, plus the sort mode from the separate settings store. */
export type StoredDeckSnapshot = DeckSnapshot & {
  displaySize: DisplaySize
  legacyLinksDetected: boolean
  sortMode: SortMode
}

/** Commits category draft category and link changes together so UI state does not update before storage. */
export type CategoryDraftPersistInput = {
  categoriesToSave: Category[]
  categoryIdsToDelete: string[]
  linksToSave: Link[]
  linkIdsToDelete: string[]
}

const DATABASE_NAME = 'link-deck'
const DATABASE_VERSION = 2
const SETTINGS_ID: SettingsRecord['id'] = 'settings'
const DEFAULT_SORT_MODE: SortMode = 'manual'

/** Public IndexedDB operations for deck data, settings, and uploaded icon blobs. */
export const dbService = {
  clearDeckData,
  deleteCategory,
  deleteIconFile,
  deleteLink,
  deleteLinks,
  getIconFile,
  loadDeck,
  recordLinkVisit,
  replaceDeck,
  resetDeckToDefaults,
  saveCategories,
  saveCategory,
  saveCategoryDraftChanges,
  saveIconFile,
  saveDisplaySize,
  saveLink,
  saveLinks,
  saveSortMode,
}

const dbPromise = openDB<LinkDeckDb>(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('categories')) {
      db.createObjectStore('categories', { keyPath: 'id' })
    }

    if (!db.objectStoreNames.contains('links')) {
      const links = db.createObjectStore('links', { keyPath: 'id' })

      links.createIndex('by-category', 'categoryId')
    }

    if (!db.objectStoreNames.contains('icons')) {
      db.createObjectStore('icons', { keyPath: 'id' })
    }

    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'id' })
    }
  },
})

/** Checks for pre-v2 local link data left in the legacy sites store. */
async function hasLegacySiteRecords(db: IDBPDatabase<LinkDeckDb>, linkCount: number): Promise<boolean> {
  const storeNames = Array.from(db.objectStoreNames as unknown as Iterable<string>)

  if (linkCount > 0 || !storeNames.includes('sites')) {
    return false
  }

  const legacyDb = db as unknown as IDBPDatabase<LegacyLinkDeckDb>

  return (await legacyDb.count('sites')) > 0
}

/** Derives stable deck metadata timestamps from snapshot records. */
function getDeckTimestamp(
  records: Array<Pick<Category | Link | IconFile, 'createdAt'> & { updatedAt?: string }>,
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

/** Writes default categories, links, and settings on first database open. */
async function seedIfEmpty(): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links', 'settings'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')
  const settingsStore = tx.objectStore('settings')
  const categoryCount = await categoryStore.count()

  if (categoryCount > 0) {
    await tx.done
    return
  }

  const deck = createDefaultDeck()

  for (const category of deck.categories) {
    categoryStore.put(category)
  }

  for (const link of deck.links) {
    linkStore.put(link)
  }

  settingsStore.put({
    id: SETTINGS_ID,
    displaySize: DEFAULT_DISPLAY_SIZE,
    interfaceSize: DEFAULT_DISPLAY_SIZE,
    sortMode: DEFAULT_SORT_MODE,
    updatedAt: deck.updatedAt,
  })

  await tx.done
}

/** Adds the built-in default category to existing local data. */
async function ensureDefaultCategory(): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')
  const defaultCategory = await tx.store.get(DEFAULT_CATEGORY_ID)

  if (defaultCategory) {
    await tx.done
    return
  }

  const categories = await tx.store.getAll()
  const now = new Date().toISOString()
  const minOrder = categories.reduce((currentMinOrder, category) => Math.min(currentMinOrder, category.order), 1)

  tx.store.put(createDefaultCategory(now, minOrder - 1))

  await tx.done
}

/** Reads the full deck snapshot, seeding default data first when the database is empty. */
async function loadDeck(): Promise<StoredDeckSnapshot> {
  await seedIfEmpty()
  await ensureDefaultCategory()

  const db = await dbPromise
  const [categories, links, iconFiles, settings] = await Promise.all([
    db.getAll('categories'),
    db.getAll('links'),
    db.getAll('icons'),
    db.get('settings', SETTINGS_ID),
  ])
  const legacyLinksDetected = await hasLegacySiteRecords(db, links.length)
  const records = [...categories, ...links, ...iconFiles]
  const displaySize = settings?.displaySize ?? settings?.interfaceSize ?? DEFAULT_DISPLAY_SIZE

  const snapshot: StoredDeckSnapshot = {
    id: 'local',
    name: 'Local Deck',
    categories,
    links,
    iconFiles,
    displaySize,
    legacyLinksDetected,
    sortMode: settings?.sortMode ?? DEFAULT_SORT_MODE,
    createdAt: getDeckTimestamp(records, 'createdAt'),
    updatedAt: getDeckTimestamp(records, 'updatedAt'),
  }

  return snapshot
}

/** Replaces all persisted deck data in one transaction. */
async function replaceDeck(deck: StoredDeckSnapshot): Promise<StoredDeckSnapshot> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links', 'icons', 'settings'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')
  const iconStore = tx.objectStore('icons')
  const settingsStore = tx.objectStore('settings')

  void categoryStore.clear()
  void linkStore.clear()
  void iconStore.clear()
  void settingsStore.clear()

  for (const category of deck.categories) {
    categoryStore.put(category)
  }

  for (const link of deck.links) {
    linkStore.put(link)
  }

  for (const iconFile of deck.iconFiles) {
    iconStore.put(iconFile)
  }

  settingsStore.put({
    id: SETTINGS_ID,
    displaySize: deck.displaySize,
    interfaceSize: deck.displaySize,
    sortMode: deck.sortMode,
    updatedAt: deck.updatedAt,
  })

  await tx.done

  return deck
}

/** Restores the bundled default deck and default sort mode. */
async function resetDeckToDefaults(): Promise<StoredDeckSnapshot> {
  const deck = createDefaultDeck()
  const storedDeck: StoredDeckSnapshot = {
    ...deck,
    displaySize: DEFAULT_DISPLAY_SIZE,
    legacyLinksDetected: false,
    sortMode: DEFAULT_SORT_MODE,
  }

  return replaceDeck(storedDeck)
}

/** Clears user data while leaving one usable default category. */
async function clearDeckData(): Promise<StoredDeckSnapshot> {
  const now = new Date().toISOString()
  const storedDeck: StoredDeckSnapshot = {
    id: 'local',
    name: 'Local Deck',
    categories: [createDefaultCategory(now)],
    links: [],
    iconFiles: [],
    displaySize: DEFAULT_DISPLAY_SIZE,
    legacyLinksDetected: false,
    sortMode: DEFAULT_SORT_MODE,
    createdAt: now,
    updatedAt: now,
  }

  return replaceDeck(storedDeck)
}

/** Saves category records in bulk. */
async function saveCategories(categories: Category[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')

  for (const category of categories) {
    tx.store.put(category)
  }

  await tx.done
}

/** Saves a single category record. */
async function saveCategory(category: Category): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')

  tx.store.put(category)

  await tx.done
}

/** Saves link records in bulk. */
async function saveLinks(links: Link[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  for (const link of links) {
    tx.store.put(link)
  }

  await tx.done
}

/** Saves a single link record. */
async function saveLink(link: Link): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  tx.store.put(link)

  await tx.done
}

/** Appends one visit count to the current database record. */
async function recordLinkVisit(linkId: string, visitedAt = new Date().toISOString()): Promise<Link | undefined> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')
  const link = await tx.store.get(linkId)

  if (!link) {
    await tx.done
    return undefined
  }

  const nextLink: Link = {
    ...link,
    visitCount: link.visitCount + 1,
    lastVisitedAt: visitedAt,
    updatedAt: visitedAt,
  }

  tx.store.put(nextLink)

  await tx.done

  return nextLink
}

/** Deletes a single link record. */
async function deleteLink(linkId: string): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  tx.store.delete(linkId)

  await tx.done
}

/** Deletes link records in bulk. */
async function deleteLinks(linkIds: string[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  for (const linkId of linkIds) {
    tx.store.delete(linkId)
  }

  await tx.done
}

/** Commits category and link changes from the category draft in one transaction. */
async function saveCategoryDraftChanges({
  categoriesToSave,
  categoryIdsToDelete,
  linksToSave,
  linkIdsToDelete,
}: CategoryDraftPersistInput): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(['categories', 'links'], 'readwrite')
  const categoryStore = tx.objectStore('categories')
  const linkStore = tx.objectStore('links')

  for (const linkId of linkIdsToDelete) {
    linkStore.delete(linkId)
  }

  for (const link of linksToSave) {
    linkStore.put(link)
  }

  for (const categoryId of categoryIdsToDelete) {
    categoryStore.delete(categoryId)
  }

  for (const category of categoriesToSave) {
    categoryStore.put(category)
  }

  await tx.done
}

/** Deletes a single category record. */
async function deleteCategory(categoryId: string): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')

  tx.store.delete(categoryId)

  await tx.done
}

/** Applies a partial settings update without overwriting concurrently changed fields. */
async function saveSettingsPatch(patch: Partial<Pick<SettingsRecord, 'displaySize' | 'sortMode'>>): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('settings', 'readwrite')
  const previousSettings = await tx.store.get(SETTINGS_ID)

  const displaySize =
    patch.displaySize ?? previousSettings?.displaySize ?? previousSettings?.interfaceSize ?? DEFAULT_DISPLAY_SIZE

  tx.store.put({
    id: SETTINGS_ID,
    displaySize,
    interfaceSize: displaySize,
    sortMode: patch.sortMode ?? previousSettings?.sortMode ?? DEFAULT_SORT_MODE,
    updatedAt: new Date().toISOString(),
  })

  await tx.done
}

/** Saves the current global display size. */
async function saveDisplaySize(displaySize: DisplaySize): Promise<void> {
  return saveSettingsPatch({ displaySize })
}

/** Saves the current link sort mode. */
async function saveSortMode(sortMode: SortMode): Promise<void> {
  return saveSettingsPatch({ sortMode })
}

/** Saves a user-uploaded icon file and returns a record links can reference. */
async function saveIconFile(file: File): Promise<IconFile> {
  const iconFile: IconFile = {
    id: crypto.randomUUID(),
    blob: file,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: new Date().toISOString(),
  }
  const db = await dbPromise
  const tx = db.transaction('icons', 'readwrite')

  tx.store.put(iconFile)

  await tx.done

  return iconFile
}

/** Reads a saved local icon file by id. */
async function getIconFile(id: string): Promise<IconFile | undefined> {
  const db = await dbPromise

  return db.get('icons', id)
}

/** Deletes a saved local icon file. */
async function deleteIconFile(id: string): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('icons', 'readwrite')

  tx.store.delete(id)

  await tx.done
}
