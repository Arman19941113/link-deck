// Shared segmented radio picker used by settings controls.

import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type SegmentedSettingsPickerOption<TValue extends string> = {
  value: TValue
  label: string
  title?: string
}

type SegmentedSettingsPickerProps<TValue extends string> = {
  id: string
  label: string
  name: string
  options: ReadonlyArray<SegmentedSettingsPickerOption<TValue>>
  value: TValue
  onChange: (value: TValue) => void
  renderOptionContent: (option: SegmentedSettingsPickerOption<TValue>, isSelected: boolean) => ReactNode
}

/** Renders a settings segmented control with a sliding selected background. */
export function SegmentedSettingsPicker<TValue extends string>({
  id,
  label,
  name,
  options,
  value,
  onChange,
  renderOptionContent,
}: SegmentedSettingsPickerProps<TValue>) {
  const selectedIndex = Math.max(
    options.findIndex(option => option.value === value),
    0,
  )

  return (
    <div className="flex flex-col gap-2">
      <Label id={id}>{label}</Label>
      <div
        className="relative grid h-11 overflow-hidden rounded-md border border-input bg-card p-0.5 shadow-xs"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        }}
        role="radiogroup"
        aria-labelledby={id}
      >
        <span
          className="settings-segment-indicator pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-sm transition-transform duration-200 ease-app-hover motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.25rem) / ${options.length})`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
          aria-hidden="true"
        />
        {options.map(option => {
          const isSelected = option.value === value

          return (
            <label
              key={option.value}
              className={cn(
                'relative z-10 flex h-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-200 ease-app-hover hover:text-foreground has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50',
                isSelected && 'settings-segment-option-selected',
              )}
              title={option.title}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                className="peer sr-only"
                onChange={() => onChange(option.value)}
              />
              {renderOptionContent(option, isSelected)}
            </label>
          )
        })}
      </div>
    </div>
  )
}
