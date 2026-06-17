// Segmented picker for the app language preference.

import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/domain/settings/language'
import { SegmentedSettingsPicker } from './segmented-settings-picker'

type LanguagePickerProps = {
  value: AppLanguage
  onChange: (value: AppLanguage) => void
}

const LANGUAGE_PICKER_OPTIONS = SUPPORTED_LANGUAGES.map(value => ({
  value,
  label: value,
}))

const LANGUAGE_FLAGS = {
  en: '\u{1F1FA}\u{1F1F8}',
  zh: '\u{1F1E8}\u{1F1F3}',
} satisfies Record<AppLanguage, string>

/** Lets users switch the app interface language from a compact segmented control. */
export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const { t } = useTranslation()

  return (
    <SegmentedSettingsPicker
      id="settings-language-label"
      label={t('settings.general.language')}
      name="language"
      options={LANGUAGE_PICKER_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={option => (
        <>
          <span className="shrink-0 text-base leading-none" aria-hidden="true">
            {LANGUAGE_FLAGS[option.value]}
          </span>
          <span className="truncate">{t(`settings.general.languages.${option.value}`)}</span>
        </>
      )}
    />
  )
}
