// Provides shared runtime guards for deck data loaded from external storage.

import type { Category, SavedLink } from './types'
import type { SavedLinkIcon } from './icon-types'

/** Checks whether a parsed JSON value can be inspected as an object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Validates that a value is an ISO-like timestamp string. */
export function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

/** Checks persisted icon settings before trusting a link record. */
export function isSavedLinkIcon(value: unknown): value is SavedLinkIcon {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  if (value.type === 'auto') {
    return true
  }

  if (value.type === 'builtin') {
    return isNonEmptyString(value.slug) && isNonEmptyString(value.title) && isNonEmptyString(value.hex)
  }

  if (value.type === 'url') {
    return isNonEmptyString(value.url)
  }

  return (
    value.type === 'file' &&
    isNonEmptyString(value.fileId) &&
    typeof value.name === 'string' &&
    typeof value.mimeType === 'string'
  )
}

/** Checks a category before using it in deck state. */
export function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyText(value.name) &&
    isFiniteNumber(value.order) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  )
}

/** Checks a saved link before using it in deck state. */
export function isSavedLink(value: unknown): value is SavedLink {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.categoryId) &&
    isNonEmptyText(value.name) &&
    isNonEmptyString(value.url) &&
    (value.note === undefined || typeof value.note === 'string') &&
    isSavedLinkIcon(value.icon) &&
    isFiniteNumber(value.order) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  )
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
