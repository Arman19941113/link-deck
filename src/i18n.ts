// Initializes i18next resources for the React app.

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import zh from '@/locales/zh.json'
import { localAppCacheService } from '@/services/local-app-cache'
import { DEFAULT_LANGUAGE, resolveAppLanguage } from '@/domain/settings/language'

const initialLanguage = localAppCacheService.getLanguagePreference() ?? resolveAppLanguage(navigator.language)

void i18n.use(initReactI18next).init({
  fallbackLng: DEFAULT_LANGUAGE,
  lng: initialLanguage,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
})

export default i18n
