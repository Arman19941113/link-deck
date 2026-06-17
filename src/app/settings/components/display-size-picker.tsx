// Segmented picker with compact previews for the global display size.

import { useTranslation } from 'react-i18next'

import type { DisplaySize } from '@/domain/settings/types'
import { DISPLAY_SIZE_OPTIONS } from '@/app/display-size-config'
import { SegmentedSettingsPicker } from './segmented-settings-picker'
import { cn } from '@/lib/utils'

type DisplaySizePickerProps = {
  value: DisplaySize
  onChange: (value: DisplaySize) => void
}

const PREVIEW_BLOCKS: Record<DisplaySize, number> = {
  compact: 4,
  normal: 3,
  spacious: 2,
}

const DISPLAY_SIZE_PICKER_OPTIONS = DISPLAY_SIZE_OPTIONS.map(option => ({
  value: option.value,
  label: option.label,
  title: option.description,
}))

/** Lets users pick the global display size from visible layout previews. */
export function DisplaySizePicker({ value, onChange }: DisplaySizePickerProps) {
  const { t } = useTranslation()

  return (
    <SegmentedSettingsPicker
      id="settings-display-size-label"
      label={t('settings.general.displaySize')}
      name="display-size"
      options={DISPLAY_SIZE_PICKER_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={(option, isSelected) => (
        <>
          <span
            className="grid h-3.5 w-7 gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${PREVIEW_BLOCKS[option.value]}, minmax(0, 1fr))`,
            }}
            aria-hidden="true"
          >
            {Array.from({ length: PREVIEW_BLOCKS[option.value] }, (_, index) => (
              <span key={index} className={cn('rounded-xs bg-border', isSelected && 'bg-accent')} />
            ))}
          </span>
          <span className="truncate">{t(`settings.general.displaySizes.${option.value}`)}</span>
        </>
      )}
    />
  )
}
