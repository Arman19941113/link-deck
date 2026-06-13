import { DEFAULT_DISPLAY_SIZE, isDisplaySize } from '@/domain/display-size'
import { DEFAULT_THEME_PREFERENCE, isThemePreference } from '@/domain/theme'
import type { Category, DisplaySize, Link, SortMode, ThemePreference } from '@/domain/types'
import { getLocalStorage, setLocalStorage } from '@/lib/storage'

const NAME_THEME = 'link-deck.theme'
const NAME_DISPLAY_SIZE = 'link-deck.display-size'
const LEGACY_NAME_DISPLAY_SIZE = 'link-deck.interface-size'
const NAME_DECK_SNAPSHOT = 'link-deck.deck-snapshot'
const DECK_SNAPSHOT_MIRROR_VERSION = 1
const SORT_MODE_VALUES = new Set<SortMode>(['manual', 'mostVisited', 'recentVisited', 'name'])

/** Lightweight deck data mirrored for synchronous first-paint rendering. */
export type DeckSnapshotMirror = {
  version: typeof DECK_SNAPSHOT_MIRROR_VERSION
  categories: Category[]
  links: Link[]
  displaySize: DisplaySize
  sortMode: SortMode
}

type StoredDeckSnapshotMirror = Omit<DeckSnapshotMirror, 'displaySize'> & {
  displaySize?: DisplaySize
  interfaceSize?: DisplaySize
}

/** Public localStorage operations; IndexedDB data belongs in dbService. */
export const storageService = {
  getDeckSnapshotMirror,
  getDisplaySize,
  getTheme,
  setDeckSnapshotMirror,
  setDisplaySize,
  setTheme,
}

/** Returns the best synchronous initial display size before IndexedDB has opened. */
function getDisplaySize(): DisplaySize {
  return getDisplaySizeMirror() ?? DEFAULT_DISPLAY_SIZE
}

/** Reads the saved theme preference from localStorage. */
function getTheme(): ThemePreference {
  const storedThemePreference = getLocalStorage<unknown>(NAME_THEME)

  return isThemePreference(storedThemePreference) ? storedThemePreference : DEFAULT_THEME_PREFERENCE
}

/** Saves the selected theme preference to localStorage. */
function setTheme(themePreference: ThemePreference): void {
  setLocalStorage(NAME_THEME, themePreference)
}

/** Reads the synchronous deck mirror used to avoid a blank first render on refresh. */
function getDeckSnapshotMirror(): DeckSnapshotMirror | null {
  const storedDeckSnapshot = getLocalStorage<unknown>(NAME_DECK_SNAPSHOT)

  if (!isDeckSnapshotMirror(storedDeckSnapshot)) {
    return null
  }

  const displaySize = storedDeckSnapshot.displaySize ?? storedDeckSnapshot.interfaceSize

  if (!displaySize) {
    return null
  }

  return {
    ...storedDeckSnapshot,
    displaySize,
  }
}

/** Keeps a lightweight deck mirror outside IndexedDB so refresh can paint existing content immediately. */
function setDeckSnapshotMirror(snapshot: Omit<DeckSnapshotMirror, 'version'>): void {
  setLocalStorage(NAME_DECK_SNAPSHOT, {
    version: DECK_SNAPSHOT_MIRROR_VERSION,
    categories: snapshot.categories,
    links: snapshot.links,
    displaySize: snapshot.displaySize,
    sortMode: snapshot.sortMode,
  })
}

/** Saves the current global display size mirror. */
function setDisplaySize(displaySize: DisplaySize): void {
  setDisplaySizeMirror(displaySize)
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
function isLinkIcon(value: unknown): value is Link['icon'] {
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
function isDeckSnapshotMirror(value: unknown): value is StoredDeckSnapshotMirror {
  const displaySize = isRecord(value) ? (value.displaySize ?? value.interfaceSize) : undefined

  return (
    isRecord(value) &&
    value.version === DECK_SNAPSHOT_MIRROR_VERSION &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategory) &&
    Array.isArray(value.links) &&
    value.links.every(isLink) &&
    isDisplaySize(displaySize) &&
    isSortMode(value.sortMode)
  )
}

/** Reads the synchronous display-size mirror used to avoid first-paint layout jumps. */
function getDisplaySizeMirror(): DisplaySize | null {
  const storedDisplaySize = getLocalStorage<unknown>(NAME_DISPLAY_SIZE)
  const legacyStoredDisplaySize = getLocalStorage<unknown>(LEGACY_NAME_DISPLAY_SIZE)

  if (isDisplaySize(storedDisplaySize)) {
    return storedDisplaySize
  }

  return isDisplaySize(legacyStoredDisplaySize) ? legacyStoredDisplaySize : null
}

/** Keeps a small settings mirror outside IndexedDB so initial React state can match the last choice. */
function setDisplaySizeMirror(displaySize: DisplaySize): void {
  setLocalStorage(NAME_DISPLAY_SIZE, displaySize)
  setLocalStorage(LEGACY_NAME_DISPLAY_SIZE, displaySize)
}
