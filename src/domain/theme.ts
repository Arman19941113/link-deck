// Defines app theme preference options and validation helpers.

import type { ThemePreference } from '@/domain/types'

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'auto'

export const THEME_PREFERENCE_OPTIONS: Array<{
  value: ThemePreference
  label: string
}> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const THEME_PREFERENCE_VALUES = new Set<ThemePreference>(['auto', 'light', 'dark'])

/** Checks unknown stored settings before using them as theme preference state. */
export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_PREFERENCE_VALUES.has(value as ThemePreference)
}
