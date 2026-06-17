// Segmented picker for the app theme color preference.

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { THEME_COLOR_PREFERENCE_OPTIONS, type ThemeColorPreference } from '@/domain/settings/theme-color'
import { SegmentedSettingsPicker } from './segmented-settings-picker'
import { cn } from '@/lib/utils'

type ThemeColorPickerProps = {
  value: ThemeColorPreference
  onChange: (value: ThemeColorPreference) => void
}

const THEME_COLOR_ICONS = {
  auto: Monitor,
  light: Sun,
  dark: Moon,
} satisfies Record<ThemeColorPreference, typeof Monitor>

/** Lets users choose the app theme color with the same segmented interaction as display size. */
export function ThemeColorPicker({ value, onChange }: ThemeColorPickerProps) {
  const { t } = useTranslation()

  return (
    <SegmentedSettingsPicker
      id="settings-theme-color-label"
      label={t('settings.general.themeColor')}
      name="theme-color"
      options={THEME_COLOR_PREFERENCE_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={(option, isSelected) => {
        const Icon = THEME_COLOR_ICONS[option.value]

        return (
          <>
            <Icon className={cn('size-4 shrink-0', isSelected && 'text-accent')} aria-hidden="true" />
            <span className="truncate">{t(`settings.general.themeColors.${option.value}`)}</span>
          </>
        )
      }}
    />
  )
}
