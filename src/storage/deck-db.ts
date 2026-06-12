// Wraps Link Deck IndexedDB reads and writes so UI code does not depend on low-level database APIs.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import { createDefaultCategory, DEFAULT_CATEGORY_ID } from '@/domain/categories'
import { createDefaultDeck } from '@/domain/default-data'
import { DEFAULT_INTERFACE_SIZE, isInterfaceSize } from '@/domain/interface-size'
import type { Category, DeckSnapshot, IconFile, InterfaceSize, Link, LinkIcon, SortMode } from '@/domain/types'
import { getLocalStorage, setLocalStorage } from '@/lib/storage'

type SettingsRecord = {
  id: 'settings'
  interfaceSize: InterfaceSize
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
  interfaceSize: InterfaceSize
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
const INTERFACE_SIZE_STORAGE_KEY = 'link-deck.interface-size'
const DECK_SNAPSHOT_STORAGE_KEY = 'link-deck.deck-snapshot'
const DECK_SNAPSHOT_MIRROR_VERSION = 1
const SORT_MODE_VALUES = new Set<SortMode>(['manual', 'mostVisited', 'recentVisited', 'name'])

/** Lightweight deck data mirrored for synchronous first-paint rendering. */
export type DeckSnapshotMirror = {
  version: typeof DECK_SNAPSHOT_MIRROR_VERSION
  categories: Category[]
  links: Link[]
  interfaceSize: InterfaceSize
  sortMode: SortMode
}

/** Checks whether a parsed JSON value can be inspected as an object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/** Checks unknown stored settings before using them as sort-mode state. */
function isSortMode(value: unknown): value is SortMode {
  return typeof value === 'string' && SORT_MODE_VALUES.has(value as SortMode)
}

/** Checks persisted icon settings before trusting a mirrored link record. */
function isLinkIcon(value: unknown): value is LinkIcon {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  if (value.type === 'auto') {
    return true
  }

  if (value.type === 'builtin') {
    return typeof value.slug === 'string' && typeof value.title === 'string' && typeof value.hex === 'string'
  }

  if (value.type === 'url') {
    return typeof value.url === 'string'
  }

  if (value.type === 'file') {
    return typeof value.fileId === 'string' && typeof value.name === 'string' && typeof value.mimeType === 'string'
  }

  return false
}

/** Checks a mirrored category before using it for the first render. */
function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.order === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

/** Checks a mirrored link before using it for the first render. */
function isLink(value: unknown): value is Link {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.categoryId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.url === 'string' &&
    (value.note === undefined || typeof value.note === 'string') &&
    isLinkIcon(value.icon) &&
    typeof value.order === 'number' &&
    typeof value.visitCount === 'number' &&
    (value.lastVisitedAt === undefined || typeof value.lastVisitedAt === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  )
}

/** Checks a parsed first-paint mirror before using it as initial UI data. */
function isDeckSnapshotMirror(value: unknown): value is DeckSnapshotMirror {
  return (
    isRecord(value) &&
    value.version === DECK_SNAPSHOT_MIRROR_VERSION &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategory) &&
    Array.isArray(value.links) &&
    value.links.every(isLink) &&
    isInterfaceSize(value.interfaceSize) &&
    isSortMode(value.sortMode)
  )
}

/** Reads the synchronous interface-size mirror used to avoid first-paint layout jumps. */
function readInterfaceSizeMirror(): InterfaceSize | null {
  const storedInterfaceSize = getLocalStorage<unknown>(INTERFACE_SIZE_STORAGE_KEY)

  return isInterfaceSize(storedInterfaceSize) ? storedInterfaceSize : null
}

/** Keeps a small settings mirror outside IndexedDB so initial React state can match the last choice. */
function saveInterfaceSizeMirror(interfaceSize: InterfaceSize): void {
  setLocalStorage(INTERFACE_SIZE_STORAGE_KEY, interfaceSize)
}

/** Returns the best synchronous initial interface size before IndexedDB has opened. */
export function getInitialInterfaceSize(): InterfaceSize {
  return readInterfaceSizeMirror() ?? DEFAULT_INTERFACE_SIZE
}

/** Reads the synchronous deck mirror used to avoid a blank first render on refresh. */
export function getInitialDeckSnapshotMirror(): DeckSnapshotMirror | null {
  const storedDeckSnapshot = getLocalStorage<unknown>(DECK_SNAPSHOT_STORAGE_KEY)

  return isDeckSnapshotMirror(storedDeckSnapshot) ? storedDeckSnapshot : null
}

/** Keeps a lightweight deck mirror outside IndexedDB so refresh can paint existing content immediately. */
export function saveDeckSnapshotMirror(snapshot: Omit<DeckSnapshotMirror, 'version'>): void {
  setLocalStorage(DECK_SNAPSHOT_STORAGE_KEY, {
    version: DECK_SNAPSHOT_MIRROR_VERSION,
    categories: snapshot.categories,
    links: snapshot.links,
    interfaceSize: snapshot.interfaceSize,
    sortMode: snapshot.sortMode,
  })
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
    interfaceSize: DEFAULT_INTERFACE_SIZE,
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
export async function loadDeck(): Promise<StoredDeckSnapshot> {
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
  const interfaceSize = settings?.interfaceSize ?? DEFAULT_INTERFACE_SIZE

  saveInterfaceSizeMirror(interfaceSize)

  const snapshot: StoredDeckSnapshot = {
    id: 'local',
    name: 'Local Deck',
    categories,
    links,
    iconFiles,
    interfaceSize,
    legacyLinksDetected,
    sortMode: settings?.sortMode ?? DEFAULT_SORT_MODE,
    createdAt: getDeckTimestamp(records, 'createdAt'),
    updatedAt: getDeckTimestamp(records, 'updatedAt'),
  }

  saveDeckSnapshotMirror(snapshot)

  return snapshot
}

/** Replaces all persisted deck data in one transaction. */
export async function replaceStoredDeck(deck: StoredDeckSnapshot): Promise<StoredDeckSnapshot> {
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
    interfaceSize: deck.interfaceSize,
    sortMode: deck.sortMode,
    updatedAt: deck.updatedAt,
  })

  await tx.done
  saveInterfaceSizeMirror(deck.interfaceSize)
  saveDeckSnapshotMirror(deck)

  return deck
}

/** Restores the bundled default deck and default sort mode. */
export async function resetStoredDeckToDefaults(): Promise<StoredDeckSnapshot> {
  const deck = createDefaultDeck()
  const storedDeck: StoredDeckSnapshot = {
    ...deck,
    interfaceSize: DEFAULT_INTERFACE_SIZE,
    legacyLinksDetected: false,
    sortMode: DEFAULT_SORT_MODE,
  }

  return replaceStoredDeck(storedDeck)
}

/** Clears user data while leaving one usable default category. */
export async function clearStoredDeckData(): Promise<StoredDeckSnapshot> {
  const now = new Date().toISOString()
  const storedDeck: StoredDeckSnapshot = {
    id: 'local',
    name: 'Local Deck',
    categories: [createDefaultCategory(now)],
    links: [],
    iconFiles: [],
    interfaceSize: DEFAULT_INTERFACE_SIZE,
    legacyLinksDetected: false,
    sortMode: DEFAULT_SORT_MODE,
    createdAt: now,
    updatedAt: now,
  }

  return replaceStoredDeck(storedDeck)
}

/** Saves category records in bulk. */
export async function saveCategories(categories: Category[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')

  for (const category of categories) {
    tx.store.put(category)
  }

  await tx.done
}

/** Saves a single category record. */
export async function saveCategory(category: Category): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')

  tx.store.put(category)

  await tx.done
}

/** Saves link records in bulk. */
export async function saveLinks(links: Link[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  for (const link of links) {
    tx.store.put(link)
  }

  await tx.done
}

/** Saves a single link record. */
export async function saveLink(link: Link): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  tx.store.put(link)

  await tx.done
}

/** Appends one visit count to the current database record. */
export async function recordLinkVisit(linkId: string, visitedAt = new Date().toISOString()): Promise<Link | undefined> {
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
export async function deleteLinkRecord(linkId: string): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  tx.store.delete(linkId)

  await tx.done
}

/** Deletes link records in bulk. */
export async function deleteLinks(linkIds: string[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('links', 'readwrite')

  for (const linkId of linkIds) {
    tx.store.delete(linkId)
  }

  await tx.done
}

/** Commits category and link changes from the category draft in one transaction. */
export async function saveCategoryDraftChanges({
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
export async function deleteCategoryRecord(categoryId: string): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('categories', 'readwrite')

  tx.store.delete(categoryId)

  await tx.done
}

/** Applies a partial settings update without overwriting concurrently changed fields. */
async function saveSettingsPatch(patch: Partial<Pick<SettingsRecord, 'interfaceSize' | 'sortMode'>>): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('settings', 'readwrite')
  const previousSettings = await tx.store.get(SETTINGS_ID)

  tx.store.put({
    id: SETTINGS_ID,
    interfaceSize: patch.interfaceSize ?? previousSettings?.interfaceSize ?? DEFAULT_INTERFACE_SIZE,
    sortMode: patch.sortMode ?? previousSettings?.sortMode ?? DEFAULT_SORT_MODE,
    updatedAt: new Date().toISOString(),
  })

  await tx.done
  if (patch.interfaceSize) {
    saveInterfaceSizeMirror(patch.interfaceSize)
  }
}

/** Saves the current global interface size. */
export async function saveInterfaceSize(interfaceSize: InterfaceSize): Promise<void> {
  return saveSettingsPatch({ interfaceSize })
}

/** Saves the current link sort mode. */
export async function saveSortMode(sortMode: SortMode): Promise<void> {
  return saveSettingsPatch({ sortMode })
}

/** Saves a user-uploaded icon file and returns a record links can reference. */
export async function saveIconFile(file: File): Promise<IconFile> {
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
export async function getIconFile(id: string): Promise<IconFile | undefined> {
  const db = await dbPromise

  return db.get('icons', id)
}

/** Deletes a saved local icon file. */
export async function deleteIconFile(id: string): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('icons', 'readwrite')

  tx.store.delete(id)

  await tx.done
}
