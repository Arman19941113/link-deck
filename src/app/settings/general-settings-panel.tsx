// General settings panel for display, theme, and language preferences.

import { DisplaySizePicker } from './components/display-size-picker'
import { ThemePicker } from './components/theme-picker'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortMode } from '@/domain/deck/types'
import type { ThemePreference } from '@/domain/settings/theme'
import type { DisplaySize } from '@/domain/settings/types'
import type { SettingsLanguage } from './types'
import { cn } from '@/lib/utils'

type GeneralSettingsPanelProps = {
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
    <div className="flex max-w-none flex-col gap-4">
      <div className="flex flex-col gap-2">
        <ThemePicker value={themePreference} onChange={onThemePreferenceChange} />
      </div>

      <div className="flex flex-col gap-2">
        <DisplaySizePicker value={displaySize} onChange={onDisplaySizeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-link-order" className="text-sm">
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
            className={cn('h-11 w-full rounded-md bg-card px-3 text-base md:text-sm')}
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-language" className="text-sm">
          Language
        </Label>
        <Select value={language} disabled onValueChange={value => onLanguageChange(value as SettingsLanguage)}>
          <SelectTrigger
            id="settings-language"
            className={cn('h-11 w-full rounded-md bg-card px-3 text-base md:text-sm')}
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
