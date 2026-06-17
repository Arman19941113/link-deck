// General settings panel for display, theme color, and language preferences.

import { DisplaySizePicker } from './components/display-size-picker'
import { LanguagePicker } from './components/language-picker'
import { LinkOrderPicker } from './components/link-order-picker'
import { StylePicker } from './components/style-picker'
import { ThemeColorPicker } from './components/theme-color-picker'
import type { SortMode } from '@/domain/deck/types'
import type { DesignStylePreference } from '@/domain/settings/design-style'
import type { AppLanguage } from '@/domain/settings/language'
import type { ThemeColorPreference } from '@/domain/settings/theme-color'
import type { DisplaySize } from '@/domain/settings/types'

type GeneralSettingsPanelProps = {
  displaySize: DisplaySize
  designStylePreference: DesignStylePreference
  sortMode: SortMode
  themeColorPreference: ThemeColorPreference
  language: AppLanguage
  onDisplaySizeChange: (displaySize: DisplaySize) => void
  onDesignStylePreferenceChange: (designStylePreference: DesignStylePreference) => void
  onSortModeChange: (sortMode: SortMode) => void
  onThemeColorPreferenceChange: (themeColorPreference: ThemeColorPreference) => void
  onLanguageChange: (language: AppLanguage) => void
}

/** Renders general preferences that apply immediately. */
export function GeneralSettingsPanel({
  displaySize,
  designStylePreference,
  sortMode,
  themeColorPreference,
  language,
  onDisplaySizeChange,
  onDesignStylePreferenceChange,
  onSortModeChange,
  onThemeColorPreferenceChange,
  onLanguageChange,
}: GeneralSettingsPanelProps) {
  return (
    <div className="flex max-w-none flex-col gap-4">
      <div className="flex flex-col gap-2">
        <ThemeColorPicker value={themeColorPreference} onChange={onThemeColorPreferenceChange} />
      </div>

      <div className="flex flex-col gap-2">
        <StylePicker value={designStylePreference} onChange={onDesignStylePreferenceChange} />
      </div>

      <div className="flex flex-col gap-2">
        <DisplaySizePicker value={displaySize} onChange={onDisplaySizeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <LinkOrderPicker value={sortMode} onChange={onSortModeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <LanguagePicker value={language} onChange={onLanguageChange} />
      </div>
    </div>
  )
}
