import {
  COLOR_SCHEME_MEDIA_QUERY,
  THEME_COLOR_BY_RESOLVED_THEME,
  resolveThemePreference,
  type ThemePreference,
  type ResolvedTheme,
} from '@/domain/settings/theme'
import {
  DEFAULT_DESIGN_STYLE_PREFERENCE,
  DESIGN_STYLE_ASSETS,
  isDesignStylePreference,
  type DesignStylePreference,
} from '@/domain/settings/design-style'

const PRISM_THEME_COLOR_BY_RESOLVED_THEME: Record<ResolvedTheme, string> = {
  light: '#f6f6f6',
  dark: '#242424',
}

/** Applies the selected or system-resolved theme to the document root. */
export function applyThemePreference(themePreference: ThemePreference): ResolvedTheme {
  return applyAppearancePreference(themePreference, getAppliedDesignStylePreference())
}

/** Applies the selected style and selected or system-resolved theme to the document root. */
export function applyAppearancePreference(
  themePreference: ThemePreference,
  designStylePreference: DesignStylePreference,
): ResolvedTheme {
  const resolvedTheme = resolveThemePreference(themePreference, prefersDarkColorScheme())

  if (typeof document === 'undefined') {
    return resolvedTheme
  }

  const root = document.documentElement

  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.theme = themePreference
  root.dataset.designStyle = designStylePreference
  root.style.colorScheme = resolvedTheme
  updateThemeColor(resolvedTheme, designStylePreference)
  updateFavicon(designStylePreference)

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

/** Reads the current document style safely for compatibility callers. */
function getAppliedDesignStylePreference(): DesignStylePreference {
  if (typeof document === 'undefined') {
    return DEFAULT_DESIGN_STYLE_PREFERENCE
  }

  const designStylePreference = document.documentElement.dataset.designStyle

  return isDesignStylePreference(designStylePreference) ? designStylePreference : DEFAULT_DESIGN_STYLE_PREFERENCE
}

/** Keeps browser chrome color aligned with the rendered app theme. */
function updateThemeColor(resolvedTheme: ResolvedTheme, designStylePreference: DesignStylePreference): void {
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

  if (!themeColor) {
    return
  }

  themeColor.content =
    designStylePreference === 'prism'
      ? PRISM_THEME_COLOR_BY_RESOLVED_THEME[resolvedTheme]
      : THEME_COLOR_BY_RESOLVED_THEME[resolvedTheme]
}

/** Keeps the browser favicon aligned with the selected design style. */
function updateFavicon(designStylePreference: DesignStylePreference): void {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!favicon) {
    return
  }

  favicon.href = `${import.meta.env.BASE_URL}${DESIGN_STYLE_ASSETS[designStylePreference].favicon}`
}
