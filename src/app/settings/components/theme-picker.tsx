// Segmented picker for the app appearance preference.

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  return (
    <SegmentedSettingsPicker
      id="settings-theme-label"
      label={t('settings.general.theme')}
      name="theme"
      options={THEME_PREFERENCE_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={(option, isSelected) => {
        const Icon = THEME_ICONS[option.value]

        return (
          <>
            <Icon className={cn('size-4 shrink-0', isSelected && 'text-accent')} aria-hidden="true" />
            <span className="truncate">{t(`settings.general.themes.${option.value}`)}</span>
          </>
        )
      }}
    />
  )
}
