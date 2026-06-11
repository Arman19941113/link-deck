// Builds link search indexes with raw text, full pinyin, and pinyin initial matching.

import { pinyin } from "pinyin-pro";

/** Stores raw text, pinyin, and initials for search. */
export interface SearchIndex {
  raw: string;
  pinyin: string;
  initials: string;
  combined: string;
}

const SEPARATORS = /[\s\-_/\\.:;,+?&#=|~`!@#$%^*()[\]{}'"<>\u3000-\u303f\uff00-\uffef]+/g;

/** Normalizes search text by ignoring case, whitespace, and common separators. */
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(SEPARATORS, "");
}

/** Converts Chinese text to full pinyin without tones. */
function toPinyinText(value: string): string {
  return pinyin(value, {
    toneType: "none",
    type: "array",
    nonZh: "consecutive",
    traditional: true,
    v: true,
  }).join("");
}

/** Converts Chinese text to pinyin initials. */
function toPinyinInitials(value: string): string {
  return pinyin(value, {
    toneType: "none",
    pattern: "first",
    type: "array",
    nonZh: "consecutive",
    traditional: true,
    v: true,
  }).join("");
}

/** Creates a reusable search index for text fragments. */
export function createSearchIndex(parts: string[]): SearchIndex {
  const normalizedParts = parts.filter((part) => part.trim());
  const raw = normalizedParts.map(normalizeSearchText).join("");
  const fullPinyin = normalizedParts
    .map((part) => normalizeSearchText(toPinyinText(part)))
    .join("");
  const initials = normalizedParts
    .map((part) => normalizeSearchText(toPinyinInitials(part)))
    .join("");
  const combined = [raw, fullPinyin, initials].filter(Boolean).join(" ");

  return {
    raw,
    pinyin: fullPinyin,
    initials,
    combined,
  };
}

/** Checks whether a query matches raw text, full pinyin, or initials. */
export function matchesSearchIndex(query: string, index: SearchIndex): boolean {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  return (
    index.raw.includes(normalizedQuery) ||
    index.pinyin.includes(normalizedQuery) ||
    index.initials.includes(normalizedQuery)
  );
}
