// Coordinates persisted appearance preferences and document theme application.

import { useEffect, useState } from 'react'

import type { DesignStylePreference } from '@/domain/settings/design-style'
import type { ThemePreference } from '@/domain/settings/theme'
import { localAppCacheService } from '@/services/local-app-cache'
import { applyAppearancePreference, subscribeThemePreference } from '@/services/theme'

/** Applies selected appearance preferences and tracks system changes for Auto mode. */
export function useThemePreference() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(localAppCacheService.getThemePreference)
  const [designStylePreference, setDesignStylePreferenceState] = useState<DesignStylePreference>(
    localAppCacheService.getDesignStylePreference,
  )

  useEffect(() => {
    function applyCurrentAppearancePreference(): void {
      applyAppearancePreference(themePreference, designStylePreference)
    }

    applyCurrentAppearancePreference()

    return subscribeThemePreference(themePreference, applyCurrentAppearancePreference)
  }, [themePreference, designStylePreference])

  /** Persists the app appearance preference and applies it to the document root. */
  function setThemePreference(nextThemePreference: ThemePreference): void {
    setThemePreferenceState(nextThemePreference)
    localAppCacheService.setThemePreference(nextThemePreference)
    applyAppearancePreference(nextThemePreference, designStylePreference)
  }

  /** Persists the app design style preference and applies it to the document root. */
  function setDesignStylePreference(nextDesignStylePreference: DesignStylePreference): void {
    setDesignStylePreferenceState(nextDesignStylePreference)
    localAppCacheService.setDesignStylePreference(nextDesignStylePreference)
    applyAppearancePreference(themePreference, nextDesignStylePreference)
  }

  return {
    designStylePreference,
    setDesignStylePreference,
    setThemePreference,
    themePreference,
  }
}
