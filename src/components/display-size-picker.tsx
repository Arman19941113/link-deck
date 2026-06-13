// Segmented picker with compact previews for the global display size.

import { DISPLAY_SIZE_OPTIONS } from '@/domain/display-size'
import { Label } from '@/components/ui/label'
import type { DisplaySize } from '@/domain/types'
import { cn } from '@/lib/utils'

type DisplaySizePickerProps = {
  value: DisplaySize
  onChange: (value: DisplaySize) => void
}

const PREVIEW_BLOCKS: Record<DisplaySize, number> = {
  compact: 4,
  comfortable: 3,
  spacious: 2,
}

/** Lets users pick the global display size from visible layout previews. */
export function DisplaySizePicker({ value, onChange }: DisplaySizePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label id="settings-display-size-label">Display size</Label>
      <div
        className="grid h-9 grid-cols-3 rounded-md border border-input bg-card p-0.5 shadow-xs"
        role="radiogroup"
        aria-labelledby="settings-display-size-label"
      >
        {DISPLAY_SIZE_OPTIONS.map(option => {
          const isSelected = option.value === value

          return (
            <label
              key={option.value}
              className={cn(
                'flex h-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium text-muted-foreground outline-none transition-[background-color,color,box-shadow] duration-200 ease-app-hover hover:bg-muted/70 hover:text-foreground has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50',
                isSelected && 'bg-muted text-foreground shadow-xs',
              )}
              title={option.description}
            >
              <input
                type="radio"
                name="display-size"
                value={option.value}
                checked={isSelected}
                className="peer sr-only"
                onChange={() => onChange(option.value)}
              />
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
              <span className="truncate">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
