// IndexedDB schema, constants, and connection setup for Link Deck persistence.

import { openDB, type DBSchema, type StoreKey, type StoreNames, type StoreValue } from 'idb'

import type { Category, SavedLink, StoredIconFile } from '@/domain/deck/types'

export interface LinkDeckDb extends DBSchema {
  categories: {
    key: string
    value: Category
  }
  links: {
    key: string
    value: SavedLink
    indexes: { 'by-category': string }
  }
  icons: {
    key: string
    value: StoredIconFile
  }
}

const DATABASE_NAME = 'link-deck'
const DATABASE_VERSION = 2

export const dbPromise = openDB<LinkDeckDb>(DATABASE_NAME, DATABASE_VERSION, {
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
  },
})

type LinkDeckStoreName = StoreNames<LinkDeckDb>

type WritableStore<TValue> = {
  put(value: TValue): Promise<unknown>
}

type DeletableStore<TKey extends IDBValidKey> = {
  delete(key: TKey | IDBKeyRange): Promise<unknown>
}

type ClearableStore = {
  clear(): Promise<unknown>
}

/** Saves records to one object store inside a short read/write transaction. */
export async function putStoreRecords<TStoreName extends LinkDeckStoreName>(
  storeName: TStoreName,
  records: readonly StoreValue<LinkDeckDb, TStoreName>[],
): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(storeName, 'readwrite')

  await Promise.all([...queuePutRecords(tx.store, records), tx.done])
}

/** Deletes records from one object store inside a short read/write transaction. */
export async function deleteStoreRecords<TStoreName extends LinkDeckStoreName>(
  storeName: TStoreName,
  keys: readonly StoreKey<LinkDeckDb, TStoreName>[],
): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(storeName, 'readwrite')

  await Promise.all([...queueDeleteRecords(tx.store, keys), tx.done])
}

/** Queues put requests without yielding control so IndexedDB transactions stay active. */
export function queuePutRecords<TValue>(store: WritableStore<TValue>, records: readonly TValue[]): Promise<unknown>[] {
  return records.map(record => store.put(record))
}

/** Queues delete requests without yielding control so IndexedDB transactions stay active. */
export function queueDeleteRecords<TKey extends IDBValidKey>(
  store: DeletableStore<TKey>,
  keys: readonly TKey[],
): Promise<unknown>[] {
  return keys.map(key => store.delete(key))
}

/** Queues clear requests without yielding control so IndexedDB transactions stay active. */
export function queueClearStores(stores: readonly ClearableStore[]): Promise<unknown>[] {
  return stores.map(store => store.clear())
}
