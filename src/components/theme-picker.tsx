// Segmented picker for the app appearance preference.

import { Monitor, Moon, Sun } from 'lucide-react'

import { THEME_PREFERENCE_OPTIONS } from '@/domain/theme'
import { Label } from '@/components/ui/label'
import type { ThemePreference } from '@/domain/types'
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

const THEME_OPTION_INDEX = {
  auto: 0,
  light: 1,
  dark: 2,
} satisfies Record<ThemePreference, number>

/** Lets users choose the app theme with the same segmented interaction as interface size. */
export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const selectedIndex = THEME_OPTION_INDEX[value]

  return (
    <div className="flex flex-col gap-2">
      <Label id="settings-theme-label">Theme</Label>
      <div
        className="relative grid h-9 grid-cols-3 overflow-hidden rounded-md border border-input bg-card p-0.5 shadow-xs"
        role="radiogroup"
        aria-labelledby="settings-theme-label"
      >
        <span
          className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded-sm bg-muted shadow-xs transition-transform duration-200 ease-app-hover motion-reduce:transition-none"
          style={{ transform: `translateX(${selectedIndex * 100}%)` }}
          aria-hidden="true"
        />
        {THEME_PREFERENCE_OPTIONS.map(option => {
          const Icon = THEME_ICONS[option.value]
          const isSelected = option.value === value

          return (
            <label
              key={option.value}
              className={cn(
                'relative z-10 flex h-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium text-muted-foreground outline-none transition-colors duration-200 ease-app-hover hover:text-foreground has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/50',
                isSelected && 'text-foreground',
              )}
            >
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={isSelected}
                className="peer sr-only"
                onChange={() => onChange(option.value)}
              />
              <Icon className={cn('size-4 shrink-0', isSelected && 'text-accent')} aria-hidden="true" />
              <span className="truncate">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
