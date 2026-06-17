// General settings panel for display, theme, and language preferences.

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { DisplaySizePicker } from './components/display-size-picker'
import { StylePicker } from './components/style-picker'
import { ThemePicker } from './components/theme-picker'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortMode } from '@/domain/deck/types'
import type { DesignStylePreference } from '@/domain/settings/design-style'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/domain/settings/language'
import type { ThemePreference } from '@/domain/settings/theme'
import type { DisplaySize } from '@/domain/settings/types'
import { cn } from '@/lib/utils'

type GeneralSettingsPanelProps = {
  displaySize: DisplaySize
  designStylePreference: DesignStylePreference
  sortMode: SortMode
  themePreference: ThemePreference
  language: AppLanguage
  onDisplaySizeChange: (displaySize: DisplaySize) => void
  onDesignStylePreferenceChange: (designStylePreference: DesignStylePreference) => void
  onSortModeChange: (sortMode: SortMode) => void
  onThemePreferenceChange: (themePreference: ThemePreference) => void
  onLanguageChange: (language: AppLanguage) => void
}

/** Renders general preferences that apply immediately. */
export function GeneralSettingsPanel({
  displaySize,
  designStylePreference,
  sortMode,
  themePreference,
  language,
  onDisplaySizeChange,
  onDesignStylePreferenceChange,
  onSortModeChange,
  onThemePreferenceChange,
  onLanguageChange,
}: GeneralSettingsPanelProps) {
  const { t } = useTranslation()
  const sortLabels = useMemo(
    () =>
      ({
        manual: t('settings.general.sortModes.manual'),
        name: t('settings.general.sortModes.name'),
      }) satisfies Record<SortMode, string>,
    [t],
  )

  return (
    <div className="flex max-w-none flex-col gap-4">
      <div className="flex flex-col gap-2">
        <ThemePicker value={themePreference} onChange={onThemePreferenceChange} />
      </div>

      <div className="flex flex-col gap-2">
        <StylePicker value={designStylePreference} onChange={onDesignStylePreferenceChange} />
      </div>

      <div className="flex flex-col gap-2">
        <DisplaySizePicker value={displaySize} onChange={onDisplaySizeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-link-order" className="text-sm">
          {t('settings.general.linkOrder')}
        </Label>
        <Select
          value={sortMode}
          onValueChange={value => {
            onSortModeChange(value as SortMode)
          }}
        >
          <SelectTrigger
            id="settings-link-order"
            className={cn('h-11 w-full rounded-md bg-card px-3 text-base md:text-sm')}
          >
            <SelectValue placeholder={t('settings.general.linkOrderPlaceholder')}>{sortLabels[sortMode]}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {Object.entries(sortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-language" className="text-sm">
          {t('settings.general.language')}
        </Label>
        <Select value={language} onValueChange={value => onLanguageChange(value as AppLanguage)}>
          <SelectTrigger
            id="settings-language"
            className={cn('h-11 w-full rounded-md bg-card px-3 text-base md:text-sm')}
          >
            <SelectValue placeholder={t('settings.general.languagePlaceholder')}>
              {t(`settings.general.languages.${language}`)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {SUPPORTED_LANGUAGES.map(value => (
                <SelectItem key={value} value={value}>
                  {t(`settings.general.languages.${value}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
