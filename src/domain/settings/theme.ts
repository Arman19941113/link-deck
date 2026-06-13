// Defines app theme preference options, validation helpers, and pure resolution rules.

export type ThemePreference = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'auto'
export const COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'
export const THEME_COLOR_BY_RESOLVED_THEME: Record<ResolvedTheme, string> = {
  light: '#f5f1ec',
  dark: '#181715',
}

export const THEME_PREFERENCE_OPTIONS: Array<{
  value: ThemePreference
  label: string
}> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const THEME_PREFERENCE_VALUES = new Set<ThemePreference>(THEME_PREFERENCE_OPTIONS.map(option => option.value))

/** Checks unknown stored settings before using them as theme preference state. */
export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && THEME_PREFERENCE_VALUES.has(value as ThemePreference)
}

/** Resolves Auto into the concrete theme that should be rendered. */
export function resolveThemePreference(
  themePreference: ThemePreference,
  prefersDarkColorScheme: boolean,
): ResolvedTheme {
  if (themePreference === 'dark') {
    return 'dark'
  }

  if (themePreference === 'light') {
    return 'light'
  }

  return prefersDarkColorScheme ? 'dark' : 'light'
}
