// Search, load, and metadata helpers for locally bundled built-in link icons.

import type { SavedLinkIcon } from '@/domain/deck/icon-types'

import { BUILTIN_ICONS_DATA, type BuiltinIconData } from './builtin-icons-data'

export type BuiltinIconValue = Extract<SavedLinkIcon, { type: 'builtin' }>

export type BuiltinIconOption = {
  key: string
  title: string
  color: string
  source: BuiltinIconData['source'] | 'lucide'
  sourceLabel: string
}

type BuiltinIconRenderData = BuiltinIconOption & {
  body: string
  width: number
  height: number
}

export type BuiltinIconRenderModel =
  | { type: 'generic'; title: string; color: string }
  | { type: 'svg'; title: string; color: string; body: string; width: number; height: number }
  | { type: 'missing'; title: string; color: string }

type SearchIndexEntry = {
  icon: BuiltinIconOption
  normalizedTitle: string
}

const DEFAULT_ICON_KEYS = [
  'material-icon-theme:google',
  'simple-icons:github',
  'simple-icons:youtube',
  'simple-icons:x',
  'simple-icons:instagram',
  'logos:openai-icon',
  'simple-icons:notion',
  'simple-icons:excalidraw',
  'simple-icons:bilibili',
  'simple-icons:discord',
  'logos:linkedin-icon',
  'fa6-brands:amazon',
]

let searchIndex: SearchIndexEntry[] | null = null

const GENERIC_LINK_ICON_KEY = 'lucide:link'
const builtinIconsData: readonly BuiltinIconData[] = BUILTIN_ICONS_DATA
const builtinIconsByKey: ReadonlyMap<string, BuiltinIconData> = new Map(builtinIconsData.map(icon => [icon.key, icon]))

export const DEFAULT_BUILTIN_ICON: BuiltinIconValue = {
  type: 'builtin',
  slug: GENERIC_LINK_ICON_KEY,
  title: 'Link',
  hex: '64748B',
}

const GENERIC_LINK_ICON_OPTION: BuiltinIconOption = {
  key: GENERIC_LINK_ICON_KEY,
  title: DEFAULT_BUILTIN_ICON.title,
  color: DEFAULT_BUILTIN_ICON.hex,
  source: 'lucide',
  sourceLabel: 'Lucide',
}

const DEFAULT_BUILTIN_ICON_RESULTS = DEFAULT_ICON_KEYS.map(key => builtinIconsByKey.get(key))
  .filter((icon): icon is BuiltinIconData => Boolean(icon))
  .map(toSearchResult)

const BUILTIN_ICON_CANDIDATES = builtinIconsData.map(toSearchResult)

/** Loads SVG render data for a built-in icon key. */
export function loadBuiltinIcon(key: string): BuiltinIconRenderData | null {
  if (isGenericLinkBuiltinIcon(key)) {
    return null
  }

  const icon = builtinIconsByKey.get(key)

  return icon
    ? {
        key: icon.key,
        title: icon.title,
        color: icon.color,
        source: icon.source,
        sourceLabel: icon.sourceLabel,
        body: icon.body,
        width: icon.width,
        height: icon.height,
      }
    : null
}

/** Resolves a built-in icon candidate into the data needed by renderers. */
export function resolveBuiltinIconRenderModel(
  icon: Pick<BuiltinIconOption, 'key' | 'title' | 'color'>,
): BuiltinIconRenderModel {
  if (isGenericLinkBuiltinIcon(icon.key)) {
    return {
      type: 'generic',
      title: icon.title,
      color: icon.color,
    } satisfies BuiltinIconRenderModel
  }

  const loadedIcon = loadBuiltinIcon(icon.key)

  return loadedIcon
    ? ({
        type: 'svg',
        title: loadedIcon.title,
        color: loadedIcon.color,
        body: loadedIcon.body,
        width: loadedIcon.width,
        height: loadedIcon.height,
      } satisfies BuiltinIconRenderModel)
    : ({
        type: 'missing',
        title: icon.title,
        color: icon.color,
      } satisfies BuiltinIconRenderModel)
}

/** Returns normalized display metadata for a saved built-in icon reference. */
export function getBuiltinIconMetadata(icon: BuiltinIconValue): BuiltinIconOption {
  if (isGenericLinkBuiltinIcon(icon.slug)) {
    return GENERIC_LINK_ICON_OPTION
  }

  const loadedIcon = loadBuiltinIcon(icon.slug)

  return loadedIcon
    ? {
        key: loadedIcon.key,
        title: loadedIcon.title,
        color: loadedIcon.color,
        source: loadedIcon.source,
        sourceLabel: loadedIcon.sourceLabel,
      }
    : {
        key: icon.slug,
        title: icon.title,
        color: icon.hex,
        source: 'custom',
        sourceLabel: 'Built-in',
      }
}

/** Identifies the generic Lucide link icon used as the first built-in default. */
export function isGenericLinkBuiltinIcon(key: string): boolean {
  return key === GENERIC_LINK_ICON_KEY
}

/** Creates the serializable icon reference saved with a link. */
export function createBuiltinIconRef(icon: BuiltinIconOption): BuiltinIconValue {
  return {
    type: 'builtin',
    slug: icon.key,
    title: icon.title,
    hex: icon.color,
  }
}

/** Picks a random icon from the curated default set. */
export function getRandomDefaultBuiltinIcon(excludeKey?: string): BuiltinIconValue {
  const candidates = getDefaultBuiltinIcons().filter(icon => icon.key !== excludeKey)
  const fallbackCandidates = candidates.length ? candidates : getDefaultBuiltinIcons()
  const icon = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)]

  return icon ? createBuiltinIconRef(icon) : DEFAULT_BUILTIN_ICON
}

/** Searches built-in icons by brand title. */
export function searchBuiltinIcons(query: string): BuiltinIconOption[] {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return getBuiltinIconCandidates()
  }

  return getSearchIndex()
    .filter(({ normalizedTitle }) => normalizedTitle.includes(normalizedQuery))
    .map(({ icon }) => icon)
}

/** Returns the curated default set shown before the user searches. */
function getDefaultBuiltinIcons(): BuiltinIconOption[] {
  return DEFAULT_BUILTIN_ICON_RESULTS
}

/** Returns the common built-in icon candidates shown by the picker. */
function getBuiltinIconCandidates(): BuiltinIconOption[] {
  return BUILTIN_ICON_CANDIDATES
}

function getSearchIndex(): SearchIndexEntry[] {
  searchIndex ??= builtinIconsData.map(icon => ({
    icon: toSearchResult(icon),
    normalizedTitle: normalizeSearchValue(icon.title),
  }))

  return searchIndex
}

function toSearchResult(icon: BuiltinIconData): BuiltinIconOption {
  return {
    key: icon.key,
    title: icon.title,
    color: icon.color,
    source: icon.source,
    sourceLabel: icon.sourceLabel,
  }
}

/** Normalizes brand titles into a compact search key. */
function normalizeSearchValue(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '')
}
