import {
  COLOR_SCHEME_MEDIA_QUERY,
  THEME_COLOR_BY_RESOLVED_THEME,
  resolveThemeColorPreference,
  type ResolvedThemeColor,
  type ThemeColorPreference,
} from '@/domain/settings/theme-color'
import {
  DEFAULT_DESIGN_STYLE_PREFERENCE,
  DESIGN_STYLE_ASSETS,
  isDesignStylePreference,
  type DesignStylePreference,
} from '@/domain/settings/design-style'

const THEME_COLOR_BY_DESIGN_STYLE: Record<DesignStylePreference, Record<ResolvedThemeColor, string>> = {
  paper: THEME_COLOR_BY_RESOLVED_THEME,
  slate: {
    light: '#f6f6f6',
    dark: '#242424',
  },
  cobalt: {
    light: '#ffffff',
    dark: '#111827',
  },
}

/** Applies the selected or system-resolved theme color mode to the document root. */
export function applyThemeColorPreference(themeColorPreference: ThemeColorPreference): ResolvedThemeColor {
  return applyAppearancePreference(themeColorPreference, getAppliedDesignStylePreference())
}

/** Applies the selected style and selected or system-resolved theme color mode to the document root. */
export function applyAppearancePreference(
  themeColorPreference: ThemeColorPreference,
  designStylePreference: DesignStylePreference,
): ResolvedThemeColor {
  const resolvedTheme = resolveThemeColorPreference(themeColorPreference, prefersDarkColorScheme())

  if (typeof document === 'undefined') {
    return resolvedTheme
  }

  const root = document.documentElement

  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.dataset.themeColor = themeColorPreference
  root.dataset.designStyle = designStylePreference
  root.style.colorScheme = resolvedTheme
  updateThemeColor(resolvedTheme, designStylePreference)
  updateFavicon(designStylePreference)

  return resolvedTheme
}

/** Watches the system color scheme only when the app is set to Auto. */
export function subscribeThemeColorPreference(
  themeColorPreference: ThemeColorPreference,
  onChange: () => void,
): () => void {
  if (themeColorPreference !== 'auto' || typeof window === 'undefined' || !window.matchMedia) {
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
function updateThemeColor(resolvedTheme: ResolvedThemeColor, designStylePreference: DesignStylePreference): void {
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

  if (!themeColor) {
    return
  }

  themeColor.content = THEME_COLOR_BY_DESIGN_STYLE[designStylePreference][resolvedTheme]
}

/** Keeps the browser favicon aligned with the selected design style. */
function updateFavicon(designStylePreference: DesignStylePreference): void {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!favicon) {
    return
  }

  favicon.href = `${import.meta.env.BASE_URL}${DESIGN_STYLE_ASSETS[designStylePreference].favicon}`
}
