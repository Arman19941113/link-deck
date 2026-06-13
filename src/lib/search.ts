// Provides lightweight search text normalization for the initial app bundle.

const SEPARATORS = /[\s\-_/\\.:;,+?&#=|~`!@#$%^*()[\]{}'"<>\u3000-\u303f\uff00-\uffef]+/g

/** Normalizes search text by ignoring case, whitespace, and common separators. */
export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(SEPARATORS, '')
}

/** Checks whether a normalized query is included in normalized text fragments. */
export function matchesNormalizedSearchQuery(parts: string[], normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true
  }

  return parts
    .filter(part => part.trim())
    .map(normalizeSearchText)
    .join('')
    .includes(normalizedQuery)
}
