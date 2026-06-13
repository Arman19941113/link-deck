// Settings repository operations over IndexedDB.

import { DEFAULT_SORT_MODE } from '@/domain/deck/sort-mode'
import type { SortMode } from '@/domain/deck/types'
import { DEFAULT_DISPLAY_SIZE } from '@/domain/settings/display-size'
import type { DisplaySize } from '@/domain/settings/types'
import { dbPromise, SETTINGS_ID, type SettingsRecord } from './schema'

/** Saves the current global display size. */
export async function saveDisplaySize(displaySize: DisplaySize): Promise<void> {
  return saveSettingsPatch({ displaySize })
}

/** Saves the current link sort mode. */
export async function saveSortMode(sortMode: SortMode): Promise<void> {
  return saveSettingsPatch({ sortMode })
}

/** Applies a partial settings update without overwriting concurrently changed fields. */
async function saveSettingsPatch(patch: Partial<Pick<SettingsRecord, 'displaySize' | 'sortMode'>>): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction('settings', 'readwrite')
  const previousSettings = await tx.store.get(SETTINGS_ID)

  const displaySize = patch.displaySize ?? previousSettings?.displaySize ?? DEFAULT_DISPLAY_SIZE

  tx.store.put({
    id: SETTINGS_ID,
    displaySize,
    sortMode: patch.sortMode ?? previousSettings?.sortMode ?? DEFAULT_SORT_MODE,
    updatedAt: new Date().toISOString(),
  })

  await tx.done
}
