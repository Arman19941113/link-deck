// Icon file repository operations over IndexedDB.

import type { StoredIconFile } from '@/domain/deck/types'
import { dbPromise, deleteStoreRecords, putStoreRecords } from './schema'

/** Saves a prebuilt user-uploaded icon record. */
export async function saveIconFileRecord(iconFile: StoredIconFile): Promise<void> {
  await putStoreRecords('icons', [iconFile])
}

/** Reads a saved local icon file by id. */
export async function getIconFile(id: string): Promise<StoredIconFile | undefined> {
  const db = await dbPromise

  return db.get('icons', id)
}

/** Deletes a saved local icon file. */
export async function deleteIconFile(id: string): Promise<void> {
  await deleteStoreRecords('icons', [id])
}
