// Segmented picker for the app appearance preference.

import { Monitor, Moon, Sun } from 'lucide-react'

import { THEME_PREFERENCE_OPTIONS, type ThemePreference } from '@/domain/settings/theme'
import { SegmentedSettingsPicker } from './segmented-settings-picker'
import { cn } from '@/lib/utils'

type ThemePickerProps = {
  value: ThemePreference
  onChange: (value: ThemePreference) => void
}

const THEME_ICONS = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
} satisfies Record<ThemePreference, typeof Monitor>

/** Lets users choose the app theme with the same segmented interaction as display size. */
export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <SegmentedSettingsPicker
      id="settings-theme-label"
      label="Theme"
      name="theme"
      options={THEME_PREFERENCE_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={(option, isSelected) => {
        const Icon = THEME_ICONS[option.value]

        return (
          <>
            <Icon className={cn('size-4 shrink-0', isSelected && 'text-accent')} aria-hidden="true" />
            <span className="truncate">{option.label}</span>
          </>
        )
      }}
    />
  )
}
