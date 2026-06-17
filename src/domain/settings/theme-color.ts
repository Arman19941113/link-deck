// Defines app theme color preference options, validation helpers, and pure resolution rules.

export type ThemeColorPreference = 'auto' | 'light' | 'dark'
export type ResolvedThemeColor = 'light' | 'dark'

export const DEFAULT_THEME_COLOR_PREFERENCE: ThemeColorPreference = 'auto'
export const COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'
export const THEME_COLOR_BY_RESOLVED_THEME: Record<ResolvedThemeColor, string> = {
  light: '#f5f1ec',
  dark: '#181715',
}

export const THEME_COLOR_PREFERENCE_OPTIONS: Array<{
  value: ThemeColorPreference
  label: string
}> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const THEME_COLOR_PREFERENCE_VALUES = new Set<ThemeColorPreference>(
  THEME_COLOR_PREFERENCE_OPTIONS.map(option => option.value),
)

/** Checks unknown stored settings before using them as theme color preference state. */
export function isThemeColorPreference(value: unknown): value is ThemeColorPreference {
  return typeof value === 'string' && THEME_COLOR_PREFERENCE_VALUES.has(value as ThemeColorPreference)
}

/** Resolves Auto into the concrete theme color mode that should be rendered. */
export function resolveThemeColorPreference(
  themeColorPreference: ThemeColorPreference,
  prefersDarkColorScheme: boolean,
): ResolvedThemeColor {
  if (themeColorPreference === 'dark') {
    return 'dark'
  }

  if (themeColorPreference === 'light') {
    return 'light'
  }

  return prefersDarkColorScheme ? 'dark' : 'light'
}
