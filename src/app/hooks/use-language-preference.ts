// Provides app language state backed by i18next and localStorage.

import { useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import { localAppCacheService } from '@/services/local-app-cache'
import { type AppLanguage, DEFAULT_LANGUAGE, isAppLanguage } from '@/domain/settings/language'

const LANGUAGE_CHANGE_EVENT = 'languageChanged'

/** Keeps React state synchronized with i18next language changes. */
export function useLanguagePreference() {
  const { i18n } = useTranslation()
  const language = useSyncExternalStore(
    callback => {
      i18n.on(LANGUAGE_CHANGE_EVENT, callback)

      return () => {
        i18n.off(LANGUAGE_CHANGE_EVENT, callback)
      }
    },
    () => getResolvedLanguage(i18n.resolvedLanguage ?? i18n.language),
    () => DEFAULT_LANGUAGE,
  )
  const setLanguage = useCallback(
    (nextLanguage: AppLanguage) => {
      localAppCacheService.setLanguagePreference(nextLanguage)
      void i18n.changeLanguage(nextLanguage)
    },
    [i18n],
  )

  return {
    language,
    setLanguage,
  }
}

function getResolvedLanguage(language: string | undefined): AppLanguage {
  return isAppLanguage(language) ? language : DEFAULT_LANGUAGE
}
