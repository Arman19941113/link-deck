// Provides best-effort browser cache operations for startup state and local preferences.

import type { Category, SavedLink, SortMode } from '@/domain/deck/types'
import { DEFAULT_SORT_MODE, isSortMode } from '@/domain/deck/sort-mode'
import { DEFAULT_DISPLAY_SIZE, isDisplaySize } from '@/domain/settings/display-size'
import {
  DEFAULT_DESIGN_STYLE_PREFERENCE,
  isDesignStylePreference,
  type DesignStylePreference,
} from '@/domain/settings/design-style'
import type { DisplaySize } from '@/domain/settings/types'
import { DEFAULT_THEME_PREFERENCE, isThemePreference, type ThemePreference } from '@/domain/settings/theme'
import { isCategory, isRecord, isSavedLink } from '@/domain/deck/deck-guards'
import { readLocalStorageJsonOrString, writeLocalStorageJson } from '@/lib/local-storage'

const LOCAL_STORAGE_KEY_THEME = 'link-deck.theme'
const LOCAL_STORAGE_KEY_DESIGN_STYLE = 'link-deck.design-style'
const LOCAL_STORAGE_KEY_DISPLAY_SIZE = 'link-deck.display-size'
const LOCAL_STORAGE_KEY_SORT_MODE = 'link-deck.sort-mode'
const LOCAL_STORAGE_KEY_STARTUP_DECK_SNAPSHOT = 'link-deck.deck-snapshot'
const STARTUP_DECK_SNAPSHOT_VERSION = 1

/** Lightweight deck data cached for synchronous startup rendering. */
type StartupDeckSnapshot = {
  version: typeof STARTUP_DECK_SNAPSHOT_VERSION
  categories: Category[]
  links: SavedLink[]
  displaySize: DisplaySize
  sortMode: SortMode
}

/** Public localStorage cache operations; IndexedDB persistence belongs in the deck repositories. */
export const localAppCacheService = {
  getStartupDeckSnapshot,
  getDesignStylePreference,
  getDisplaySize,
  getSortMode,
  getThemePreference,
  setStartupDeckSnapshot,
  setDesignStylePreference,
  setDisplaySize,
  setSortMode,
  setThemePreference,
}

/** Returns the best synchronous initial display size before IndexedDB has opened. */
function getDisplaySize(): DisplaySize {
  return getDisplaySizeMirror() ?? DEFAULT_DISPLAY_SIZE
}

/** Reads the saved sort mode from localStorage. */
function getSortMode(): SortMode {
  const storedSortMode = readLocalStorageJsonOrString<unknown>(LOCAL_STORAGE_KEY_SORT_MODE)

  return isSortMode(storedSortMode) ? storedSortMode : DEFAULT_SORT_MODE
}

/** Reads the saved theme preference from localStorage. */
function getThemePreference(): ThemePreference {
  const storedThemePreference = readLocalStorageJsonOrString<unknown>(LOCAL_STORAGE_KEY_THEME)

  return isThemePreference(storedThemePreference) ? storedThemePreference : DEFAULT_THEME_PREFERENCE
}

/** Reads the saved design style preference from localStorage. */
function getDesignStylePreference(): DesignStylePreference {
  const storedDesignStylePreference = readLocalStorageJsonOrString<unknown>(LOCAL_STORAGE_KEY_DESIGN_STYLE)

  return isDesignStylePreference(storedDesignStylePreference)
    ? storedDesignStylePreference
    : DEFAULT_DESIGN_STYLE_PREFERENCE
}

/** Saves the selected theme preference to localStorage. */
function setThemePreference(themePreference: ThemePreference): void {
  writeLocalStorageJson(LOCAL_STORAGE_KEY_THEME, themePreference)
}

/** Saves the selected design style preference to localStorage. */
function setDesignStylePreference(designStylePreference: DesignStylePreference): void {
  writeLocalStorageJson(LOCAL_STORAGE_KEY_DESIGN_STYLE, designStylePreference)
}

/** Reads the synchronous deck snapshot used to avoid a blank first render on refresh. */
function getStartupDeckSnapshot(): StartupDeckSnapshot | null {
  const storedStartupDeckSnapshot = readLocalStorageJsonOrString<unknown>(LOCAL_STORAGE_KEY_STARTUP_DECK_SNAPSHOT)

  return isStartupDeckSnapshot(storedStartupDeckSnapshot) ? storedStartupDeckSnapshot : null
}

/** Keeps a lightweight deck snapshot outside IndexedDB so refresh can paint existing content immediately. */
function setStartupDeckSnapshot(snapshot: Omit<StartupDeckSnapshot, 'version'>): void {
  writeLocalStorageJson(LOCAL_STORAGE_KEY_STARTUP_DECK_SNAPSHOT, {
    version: STARTUP_DECK_SNAPSHOT_VERSION,
    categories: snapshot.categories,
    links: snapshot.links,
    displaySize: snapshot.displaySize,
    sortMode: snapshot.sortMode,
  })
}

/** Saves the current global display size cache. */
function setDisplaySize(displaySize: DisplaySize): void {
  setDisplaySizeMirror(displaySize)
}

/** Saves the current link sort mode preference. */
function setSortMode(sortMode: SortMode): void {
  writeLocalStorageJson(LOCAL_STORAGE_KEY_SORT_MODE, sortMode)
}

/** Checks a parsed startup snapshot before using it as initial UI data. */
function isStartupDeckSnapshot(value: unknown): value is StartupDeckSnapshot {
  return (
    isRecord(value) &&
    value.version === STARTUP_DECK_SNAPSHOT_VERSION &&
    Array.isArray(value.categories) &&
    value.categories.every(category => isCategory(category)) &&
    Array.isArray(value.links) &&
    value.links.every(link => isSavedLink(link)) &&
    isDisplaySize(value.displaySize) &&
    isSortMode(value.sortMode)
  )
}

/** Reads the synchronous display-size cache used to avoid startup layout jumps. */
function getDisplaySizeMirror(): DisplaySize | null {
  const storedDisplaySize = readLocalStorageJsonOrString<unknown>(LOCAL_STORAGE_KEY_DISPLAY_SIZE)

  return isDisplaySize(storedDisplaySize) ? storedDisplaySize : null
}

/** Keeps a small settings cache outside IndexedDB so initial React state can match the last choice. */
function setDisplaySizeMirror(displaySize: DisplaySize): void {
  writeLocalStorageJson(LOCAL_STORAGE_KEY_DISPLAY_SIZE, displaySize)
}
