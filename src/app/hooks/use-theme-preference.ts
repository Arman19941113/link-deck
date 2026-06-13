// Coordinates persisted theme preference and document theme application.

import { useEffect, useState } from 'react'

import type { ThemePreference } from '@/domain/settings/theme'
import { localAppCacheService } from '@/services/local-app-cache'
import { applyThemePreference, subscribeThemePreference } from '@/services/theme'

/** Applies the selected theme preference and tracks system changes for Auto mode. */
export function useThemePreference() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(localAppCacheService.getThemePreference)

  useEffect(() => {
    function applyCurrentThemePreference(): void {
      applyThemePreference(themePreference)
    }

    applyCurrentThemePreference()

    return subscribeThemePreference(themePreference, applyCurrentThemePreference)
  }, [themePreference])

  /** Persists the app appearance preference and applies it to the document root. */
  function setThemePreference(nextThemePreference: ThemePreference): void {
    setThemePreferenceState(nextThemePreference)
    localAppCacheService.setThemePreference(nextThemePreference)
    applyThemePreference(nextThemePreference)
  }

  return {
    setThemePreference,
    themePreference,
  }
}
