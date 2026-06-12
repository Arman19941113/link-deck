// Provides searchable local BrandIcon data and SVG render data for built-in link icons.

import { BUILTIN_BRAND_ICONS, type BuiltinBrandIcon } from "@/domain/builtin-brand-icons";
import type { LinkIcon } from "@/domain/types";

export type BuiltinIconRef = Extract<LinkIcon, { type: "builtin" }>;

export type BrandIconSearchResult = {
  key: string;
  title: string;
  color: string;
  source: BuiltinBrandIcon["source"] | "lucide";
  sourceLabel: string;
};

export type BrandIconRenderData = BrandIconSearchResult & {
  body: string;
  width: number;
  height: number;
};

type SearchIndexEntry = {
  icon: BuiltinBrandIcon;
  normalizedKey: string;
  normalizedTitle: string;
  normalizedSource: string;
};

const BUILTIN_BRAND_ICON_LIST: readonly BuiltinBrandIcon[] = BUILTIN_BRAND_ICONS;

const DEFAULT_ICON_KEYS = [
  "material-icon-theme:google",
  "simple-icons:github",
  "simple-icons:youtube",
  "simple-icons:x",
  "simple-icons:instagram",
  "logos:openai-icon",
  "simple-icons:notion",
  "simple-icons:excalidraw",
  "simple-icons:bilibili",
  "simple-icons:discord",
  "logos:linkedin-icon",
  "fa6-brands:amazon",
];

let searchIndex: SearchIndexEntry[] | null = null;

export const GENERIC_LINK_ICON_KEY = "lucide:link";
export const DEFAULT_BUILTIN_ICON: BuiltinIconRef = {
  type: "builtin",
  slug: GENERIC_LINK_ICON_KEY,
  title: "Link",
  hex: "64748B",
};

const GENERIC_LINK_SEARCH_RESULT: BrandIconSearchResult = {
  key: GENERIC_LINK_ICON_KEY,
  title: DEFAULT_BUILTIN_ICON.title,
  color: DEFAULT_BUILTIN_ICON.hex,
  source: "lucide",
  sourceLabel: "Lucide",
};

/** Normalizes brand titles, keys, and sources into a compact search key. */
function normalizeSearchValue(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toSearchResult(icon: BuiltinBrandIcon): BrandIconSearchResult {
  return {
    key: icon.key,
    title: icon.title,
    color: icon.color,
    source: icon.source,
    sourceLabel: icon.sourceLabel,
  };
}

function getSearchIndex(): SearchIndexEntry[] {
  searchIndex ??= BUILTIN_BRAND_ICON_LIST.map((icon) => ({
    icon,
    normalizedKey: normalizeSearchValue(icon.key),
    normalizedTitle: normalizeSearchValue(icon.title),
    normalizedSource: normalizeSearchValue(icon.sourceLabel),
  }));

  return searchIndex;
}

/** Converts old Simple Icons slugs into the current BrandIcon key format. */
export function normalizeBuiltinIconKey(key: string): string {
  if (isGenericLinkBuiltinIcon(key) || key.includes(":")) {
    return key;
  }

  return `simple-icons:${key}`;
}

/** Loads SVG render data for a built-in BrandIcon key. */
export function loadBuiltinIcon(key: string): BrandIconRenderData | null {
  const normalizedKey = normalizeBuiltinIconKey(key);

  if (isGenericLinkBuiltinIcon(normalizedKey)) {
    return null;
  }

  const icon = BUILTIN_BRAND_ICON_LIST.find((icon) => icon.key === normalizedKey);

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
    : null;
}

/** Returns normalized display metadata for a saved built-in icon reference. */
export function getBuiltinIconMetadata(icon: BuiltinIconRef): BrandIconSearchResult {
  const normalizedKey = normalizeBuiltinIconKey(icon.slug);

  if (isGenericLinkBuiltinIcon(normalizedKey)) {
    return GENERIC_LINK_SEARCH_RESULT;
  }

  const loadedIcon = loadBuiltinIcon(normalizedKey);

  return loadedIcon
    ? {
        key: loadedIcon.key,
        title: loadedIcon.title,
        color: loadedIcon.color,
        source: loadedIcon.source,
        sourceLabel: loadedIcon.sourceLabel,
      }
    : {
        key: normalizedKey,
        title: icon.title,
        color: icon.hex,
        source: "custom",
        sourceLabel: "Built-in",
      };
}

/** Identifies the generic Lucide link icon used as the first built-in default. */
export function isGenericLinkBuiltinIcon(key: string): boolean {
  return key === GENERIC_LINK_ICON_KEY || key === "lucide-link";
}

/** Creates the serializable icon reference saved with a link. */
export function createBuiltinIconRef(icon: BrandIconSearchResult): BuiltinIconRef {
  return {
    type: "builtin",
    slug: icon.key,
    title: icon.title,
    hex: icon.color,
  };
}

/** Returns the curated default set shown before the user searches. */
export function getDefaultBuiltinIcons(): BrandIconSearchResult[] {
  const iconsByKey = new Map(BUILTIN_BRAND_ICON_LIST.map((icon) => [icon.key, icon]));

  return DEFAULT_ICON_KEYS.map((key) => iconsByKey.get(key))
    .filter((icon): icon is BuiltinBrandIcon => Boolean(icon))
    .map(toSearchResult);
}

/** Returns the common built-in BrandIcon candidates shown by the picker. */
export function getBuiltinIconCandidates(): BrandIconSearchResult[] {
  return BUILTIN_BRAND_ICON_LIST.map(toSearchResult);
}

/** Picks a random icon from the curated default set. */
export function getRandomDefaultBuiltinIcon(excludeKey?: string): BuiltinIconRef {
  const normalizedExcludeKey = excludeKey ? normalizeBuiltinIconKey(excludeKey) : undefined;
  const candidates = getDefaultBuiltinIcons().filter((icon) => icon.key !== normalizedExcludeKey);
  const fallbackCandidates = candidates.length ? candidates : getDefaultBuiltinIcons();
  const icon = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];

  return icon ? createBuiltinIconRef(icon) : DEFAULT_BUILTIN_ICON;
}

/** Searches common built-in BrandIcons by brand title, key, or source. */
export function searchBuiltinIcons(query: string): BrandIconSearchResult[] {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return getBuiltinIconCandidates();
  }

  return getSearchIndex()
    .filter(
      ({ normalizedTitle, normalizedKey, normalizedSource }) =>
        normalizedTitle.includes(normalizedQuery) ||
        normalizedKey.includes(normalizedQuery) ||
        normalizedSource.includes(normalizedQuery),
    )
    .map(({ icon }) => toSearchResult(icon));
}
