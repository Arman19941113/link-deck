// Segmented picker for the saved-link display order preference.

import { ArrowDownAZ, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SORT_MODE_OPTIONS } from '@/domain/deck/sort-mode'
import type { SortMode } from '@/domain/deck/sort-mode'
import { cn } from '@/lib/utils'
import { SegmentedSettingsPicker } from './segmented-settings-picker'

type LinkOrderPickerProps = {
  value: SortMode
  onChange: (value: SortMode) => void
}

const LINK_ORDER_ICONS = {
  manual: GripVertical,
  name: ArrowDownAZ,
} satisfies Record<SortMode, typeof GripVertical>

const LINK_ORDER_PICKER_OPTIONS = SORT_MODE_OPTIONS.map(value => ({
  value,
  label: value,
}))

/** Lets users choose how links are ordered inside each category. */
export function LinkOrderPicker({ value, onChange }: LinkOrderPickerProps) {
  const { t } = useTranslation()

  return (
    <SegmentedSettingsPicker
      id="settings-link-order-label"
      label={t('settings.general.linkOrder')}
      name="link-order"
      options={LINK_ORDER_PICKER_OPTIONS}
      value={value}
      onChange={onChange}
      renderOptionContent={(option, isSelected) => {
        const Icon = LINK_ORDER_ICONS[option.value]

        return (
          <>
            <Icon className={cn('size-4 shrink-0', isSelected && 'text-accent')} aria-hidden="true" />
            <span className="truncate">{t(`settings.general.sortModes.${option.value}`)}</span>
          </>
        )
      }}
    />
  )
}
