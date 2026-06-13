import type { ThemePreference } from '@/domain/types'

const LIGHT_THEME_COLOR = '#f5f1ec'
const DARK_THEME_COLOR = '#181715'
const COLOR_SCHEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'

type ResolvedTheme = 'light' | 'dark'

/** Applies the selected or system-resolved theme to the document root. */
export function applyThemePreference(themePreference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(themePreference)

  if (typeof document === 'undefined') {
    return resolvedTheme
  }

  const root = document.documentElement

  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.theme = themePreference
  root.style.colorScheme = resolvedTheme
  updateThemeColor(resolvedTheme)

  return resolvedTheme
}

/** Watches system theme changes when the app is set to Auto. */
export function subscribeThemePreference(themePreference: ThemePreference, onChange: () => void): () => void {
  if (themePreference !== 'auto' || typeof window === 'undefined' || !window.matchMedia) {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(COLOR_SCHEME_MEDIA_QUERY)

  mediaQuery.addEventListener('change', onChange)

  return () => {
    mediaQuery.removeEventListener('change', onChange)
  }
}

/** Returns the concrete theme that should be rendered for a preference. */
function resolveThemePreference(themePreference: ThemePreference): ResolvedTheme {
  if (themePreference === 'dark') {
    return 'dark'
  }

  if (themePreference === 'light') {
    return 'light'
  }

  return prefersDarkColorScheme() ? 'dark' : 'light'
}

/** Checks the current system color scheme in browsers that support matchMedia. */
function prefersDarkColorScheme(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(COLOR_SCHEME_MEDIA_QUERY).matches
}

/** Keeps browser chrome color aligned with the rendered app theme. */
function updateThemeColor(resolvedTheme: ResolvedTheme): void {
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

  if (!themeColor) {
    return
  }

  themeColor.content = resolvedTheme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
}
