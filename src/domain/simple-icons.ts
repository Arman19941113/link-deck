// Provides searchable common Simple Icons data and SVG render data for built-in link icons.

import type { LinkIcon } from "@/domain/types";
import type { CommonSimpleIcon } from "virtual:common-simple-icons";

export type BuiltinIconRef = Extract<LinkIcon, { type: "builtin" }>;

export type BuiltinIconSearchResult = {
  slug: string;
  title: string;
  hex: string;
};

export type BuiltinIconRenderData = BuiltinIconSearchResult & {
  path: string;
};

type SearchIndexEntry = {
  icon: CommonSimpleIcon;
  normalizedSlug: string;
  normalizedTitle: string;
};

const DEFAULT_ICON_SLUGS = [
  "linktree",
  "github",
  "gitlab",
  "google",
  "gmail",
  "youtube",
  "x",
  "facebook",
  "instagram",
  "tiktok",
  "figma",
  "notion",
  "discord",
  "vercel",
  "react",
  "typescript",
  "javascript",
  "anthropic",
  "claude",
];
let commonIconsPromise: Promise<CommonSimpleIcon[]> | null = null;
let searchIndex: SearchIndexEntry[] | null = null;
let iconBySlug: Map<string, CommonSimpleIcon> | null = null;

export const GENERIC_LINK_ICON_SLUG = "lucide-link";
export const DEFAULT_BUILTIN_ICON: BuiltinIconRef = {
  type: "builtin",
  slug: GENERIC_LINK_ICON_SLUG,
  title: "Link",
  hex: "64748B",
};

/** Normalizes brand titles and slugs into a compact search key. */
function normalizeSearchValue(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Converts bundled icon data into the smaller shape the picker needs. */
function toSearchResult(icon: CommonSimpleIcon): BuiltinIconSearchResult {
  return {
    slug: icon.slug,
    title: icon.title,
    hex: icon.hex,
  };
}

/** Loads the bundled 500-icon manifest only when the picker or renderer needs it. */
async function getCommonSimpleIcons(): Promise<CommonSimpleIcon[]> {
  commonIconsPromise ??= import("virtual:common-simple-icons").then(
    (module) => module.COMMON_SIMPLE_ICONS,
  );

  return commonIconsPromise;
}

/** Builds the common-icon lookup once per session. */
async function getIconBySlug(): Promise<Map<string, CommonSimpleIcon>> {
  iconBySlug ??= new Map((await getCommonSimpleIcons()).map((icon) => [icon.slug, icon]));

  return iconBySlug;
}

/** Builds the searchable common-icon index once per session. */
async function getSearchIndex(): Promise<SearchIndexEntry[]> {
  searchIndex ??= (await getCommonSimpleIcons()).map((icon) => ({
    icon,
    normalizedSlug: normalizeSearchValue(icon.slug),
    normalizedTitle: normalizeSearchValue(icon.title),
  }));

  return searchIndex;
}

/** Loads SVG render data for a built-in icon slug. */
export async function loadBuiltinIcon(slug: string): Promise<BuiltinIconRenderData | null> {
  if (isGenericLinkBuiltinIcon(slug)) {
    return null;
  }

  const icon = (await getIconBySlug()).get(slug);

  return icon
    ? {
        slug: icon.slug,
        title: icon.title,
        hex: icon.hex,
        path: icon.path,
      }
    : null;
}

/** Identifies the generic Lucide link icon used as the first built-in default. */
export function isGenericLinkBuiltinIcon(slug: string): boolean {
  return slug === GENERIC_LINK_ICON_SLUG;
}

/** Creates the serializable icon reference saved with a link. */
export function createBuiltinIconRef(icon: BuiltinIconSearchResult): BuiltinIconRef {
  return {
    type: "builtin",
    slug: icon.slug,
    title: icon.title,
    hex: icon.hex,
  };
}

/** Returns the curated default set shown before the user searches. */
export async function getDefaultBuiltinIcons(): Promise<BuiltinIconSearchResult[]> {
  const icons = await getIconBySlug();

  return DEFAULT_ICON_SLUGS.map((slug) => icons.get(slug))
    .filter((icon): icon is CommonSimpleIcon => Boolean(icon))
    .map(toSearchResult);
}

/** Returns the 500 common built-in icon candidates shown by the picker. */
export async function getBuiltinIconCandidates(): Promise<BuiltinIconSearchResult[]> {
  return (await getCommonSimpleIcons()).map(toSearchResult);
}

/** Picks a random icon from the curated default set. */
export async function getRandomDefaultBuiltinIcon(excludeSlug?: string): Promise<BuiltinIconRef> {
  const candidates = (await getDefaultBuiltinIcons()).filter((icon) => icon.slug !== excludeSlug);
  const fallbackCandidates = candidates.length ? candidates : await getDefaultBuiltinIcons();
  const icon = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];

  return icon ? createBuiltinIconRef(icon) : DEFAULT_BUILTIN_ICON;
}

/** Searches common built-in icons by brand title or slug. */
export async function searchBuiltinIcons(query: string): Promise<BuiltinIconSearchResult[]> {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return getBuiltinIconCandidates();
  }

  return (await getSearchIndex())
    .filter(
      ({ normalizedTitle, normalizedSlug }) =>
        normalizedTitle.includes(normalizedQuery) || normalizedSlug.includes(normalizedQuery),
    )
    .map(({ icon }) => toSearchResult(icon));
}
