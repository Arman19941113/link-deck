import {
  COLOR_SCHEME_MEDIA_QUERY,
  THEME_COLOR_BY_RESOLVED_THEME,
  resolveThemePreference,
  type ThemePreference,
  type ResolvedTheme,
} from '@/domain/settings/theme'

/** Applies the selected or system-resolved theme to the document root. */
export function applyThemePreference(themePreference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(themePreference, prefersDarkColorScheme())

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

/** Watches the system color scheme only when the app is set to Auto. */
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

  themeColor.content = THEME_COLOR_BY_RESOLVED_THEME[resolvedTheme]
}
