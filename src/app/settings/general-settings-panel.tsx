// General settings panel for display, theme, and language preferences.

import { DisplaySizePicker } from './components/display-size-picker'
import { ThemePicker } from './components/theme-picker'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { SortMode } from '@/domain/deck/types'
import type { ThemePreference } from '@/domain/settings/theme'
import type { DisplaySize } from '@/domain/settings/types'
import type { SettingsLanguage } from './types'
import { cn } from '@/lib/utils'

type GeneralSettingsPanelProps = {
  displaySizeConfig: DisplaySizeConfig
  displaySize: DisplaySize
  sortMode: SortMode
  themePreference: ThemePreference
  language: SettingsLanguage
  onDisplaySizeChange: (displaySize: DisplaySize) => void
  onSortModeChange: (sortMode: SortMode) => void
  onThemePreferenceChange: (themePreference: ThemePreference) => void
  onLanguageChange: (language: SettingsLanguage) => void
}

const SORT_LABELS: Record<SortMode, string> = {
  manual: 'Manual order',
  name: 'Title (A-Z)',
}

const LANGUAGE_LABELS: Record<SettingsLanguage, string> = {
  en: 'English',
}

/** Renders general preferences that apply immediately. */
export function GeneralSettingsPanel({
  displaySizeConfig,
  displaySize,
  sortMode,
  themePreference,
  language,
  onDisplaySizeChange,
  onSortModeChange,
  onThemePreferenceChange,
  onLanguageChange,
}: GeneralSettingsPanelProps) {
  return (
    <div className={cn('max-w-none', displaySizeConfig.dialog.formClassName)}>
      <div className={displaySizeConfig.dialog.fieldClassName}>
        <ThemePicker value={themePreference} onChange={onThemePreferenceChange} />
      </div>

      <div className={displaySizeConfig.dialog.fieldClassName}>
        <DisplaySizePicker value={displaySize} onChange={onDisplaySizeChange} />
      </div>

      <div className={displaySizeConfig.dialog.fieldClassName}>
        <Label htmlFor="settings-link-order" className={displaySizeConfig.control.labelClassName}>
          Link order
        </Label>
        <Select
          value={sortMode}
          onValueChange={value => {
            onSortModeChange(value as SortMode)
          }}
        >
          <SelectTrigger
            id="settings-link-order"
            className={cn('w-full bg-card', displaySizeConfig.control.inputClassName)}
          >
            <SelectValue placeholder="Select a link order">{SORT_LABELS[sortMode]}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className={displaySizeConfig.dialog.fieldClassName}>
        <Label htmlFor="settings-language" className={displaySizeConfig.control.labelClassName}>
          Language
        </Label>
        <Select value={language} disabled onValueChange={value => onLanguageChange(value as SettingsLanguage)}>
          <SelectTrigger
            id="settings-language"
            className={cn('w-full bg-card', displaySizeConfig.control.inputClassName)}
          >
            <SelectValue placeholder="Select a language">{LANGUAGE_LABELS[language]}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs leading-5 text-muted-foreground">English is currently the only display language.</p>
      </div>
    </div>
  )
}
