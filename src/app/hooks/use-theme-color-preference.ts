// Coordinates persisted appearance preferences and document theme color application.

import { useEffect, useState } from 'react'

import type { DesignStylePreference } from '@/domain/settings/design-style'
import type { ThemeColorPreference } from '@/domain/settings/theme-color'
import { localAppCacheService } from '@/services/local-app-cache'
import { applyAppearancePreference, subscribeThemeColorPreference } from '@/services/theme-color'

/** Applies selected appearance preferences and tracks system changes for Auto mode. */
export function useThemeColorPreference() {
  const [themeColorPreference, setThemeColorPreferenceState] = useState<ThemeColorPreference>(
    localAppCacheService.getThemeColorPreference,
  )
  const [designStylePreference, setDesignStylePreferenceState] = useState<DesignStylePreference>(
    localAppCacheService.getDesignStylePreference,
  )

  useEffect(() => {
    function applyCurrentAppearancePreference(): void {
      applyAppearancePreference(themeColorPreference, designStylePreference)
    }

    applyCurrentAppearancePreference()

    return subscribeThemeColorPreference(themeColorPreference, applyCurrentAppearancePreference)
  }, [themeColorPreference, designStylePreference])

  /** Persists the app theme color preference and applies it to the document root. */
  function setThemeColorPreference(nextThemeColorPreference: ThemeColorPreference): void {
    setThemeColorPreferenceState(nextThemeColorPreference)
    localAppCacheService.setThemeColorPreference(nextThemeColorPreference)
    applyAppearancePreference(nextThemeColorPreference, designStylePreference)
  }

  /** Persists the app design style preference and applies it to the document root. */
  function setDesignStylePreference(nextDesignStylePreference: DesignStylePreference): void {
    setDesignStylePreferenceState(nextDesignStylePreference)
    localAppCacheService.setDesignStylePreference(nextDesignStylePreference)
    applyAppearancePreference(themeColorPreference, nextDesignStylePreference)
  }

  return {
    designStylePreference,
    setDesignStylePreference,
    setThemeColorPreference,
    themeColorPreference,
  }
}
