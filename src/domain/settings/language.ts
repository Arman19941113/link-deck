// Defines supported interface languages and language resolution helpers.

export type AppLanguage = 'en' | 'zh'

export const DEFAULT_LANGUAGE: AppLanguage = 'en'
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'zh']

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES)

/** Checks unknown stored settings before using them as app language state. */
export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && SUPPORTED_LANGUAGE_SET.has(value)
}

/** Resolves browser language tags into one of the supported app languages. */
export function resolveAppLanguage(language?: string | null): AppLanguage {
  return language?.toLowerCase().startsWith('zh') ? 'zh' : DEFAULT_LANGUAGE
}
