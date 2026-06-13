// Link repository operations over IndexedDB.

import type { SavedLink } from '@/domain/deck/types'
import { deleteStoreRecords, putStoreRecords } from './schema'

/** Saves link records in bulk. */
export async function saveLinks(links: SavedLink[]): Promise<void> {
  await putStoreRecords('links', links)
}

/** Saves a single link record. */
export async function saveLink(link: SavedLink): Promise<void> {
  await saveLinks([link])
}

/** Deletes a single link record. */
export async function deleteLink(linkId: string): Promise<void> {
  await deleteStoreRecords('links', [linkId])
}
