// Segmented picker for the app design style preference.

import { GalleryHorizontalEnd, Sparkles } from 'lucide-react'

import { DESIGN_STYLE_OPTIONS, type DesignStylePreference } from '@/domain/settings/design-style'
import { SegmentedSettingsPicker } from './segmented-settings-picker'
import { cn } from '@/lib/utils'

type StylePickerProps = {
  value: DesignStylePreference
  onChange: (value: DesignStylePreference) => void
}

const STYLE_ICONS = {
  editorial: GalleryHorizontalEnd,
  prism: Sparkles,
} satisfies Record<DesignStylePreference, typeof GalleryHorizontalEnd>

/** Lets users switch the visual skin independently from light or dark color mode. */
export function StylePicker({ value, onChange }: StylePickerProps) {
  return (
    <SegmentedSettingsPicker
      id="settings-style-label"
      label="Style"
      name="style"
      options={DESIGN_STYLE_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={(option, isSelected) => {
        const Icon = STYLE_ICONS[option.value]

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
