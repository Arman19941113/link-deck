// Searchable grid for choosing a serializable built-in icon reference.

import { useMemo, useState, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  createBuiltinIconRef,
  getBuiltinIconMetadata,
  searchBuiltinIcons,
  type BuiltinIconValue,
} from './builtin-icon-registry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

import { BuiltinIconPreview } from './builtin-icon-preview'

export type BuiltinIconPickerProps = {
  value: BuiltinIconValue | null
  disabled?: boolean
  displaySizeConfig: DisplaySizeConfig
  onChange: (icon: BuiltinIconValue) => void
  onConfirm?: (icon: BuiltinIconValue) => void
}

/** Lets the user search and choose a serializable built-in icon reference. */
export function BuiltinIconPicker({
  value,
  disabled = false,
  displaySizeConfig,
  onChange,
  onConfirm,
}: BuiltinIconPickerProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const selectedIcon = useMemo(() => (value ? getBuiltinIconMetadata(value) : null), [value])
  const results = useMemo(() => searchBuiltinIcons(query), [query])

  function confirmIcon(icon: BuiltinIconValue): void {
    onChange(icon)
    onConfirm?.(icon)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || !value) {
      return
    }

    event.preventDefault()
    onConfirm?.(value)
  }

  function handleIconKeyDown(event: KeyboardEvent<HTMLButtonElement>, icon: BuiltinIconValue): void {
    if (event.nativeEvent.isComposing) {
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      confirmIcon(icon)
      return
    }

    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      return
    }

    event.preventDefault()
    focusIconOptionByKey(event.currentTarget, event.key)
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border bg-secondary/20 p-3">
      {value ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            {selectedIcon ? (
              <BuiltinIconPreview icon={selectedIcon} className="size-5" decorative />
            ) : (
              <span className="size-5 rounded-sm" style={{ backgroundColor: `#${value.hex}` }} aria-hidden="true" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{value.title}</span>
            </span>
          </span>
          <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
        </div>
      ) : null}

      <div className={displaySizeConfig.dialog.fieldClassName}>
        <Label htmlFor="link-editor-builtin-icon-search" className={displaySizeConfig.control.labelClassName}>
          {t('linkEditor.icon.searchLabel')}
        </Label>
        <Input
          id="link-editor-builtin-icon-search"
          className={displaySizeConfig.control.inputClassName}
          value={query}
          placeholder={t('linkEditor.icon.searchPlaceholder')}
          disabled={disabled}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {results.length ? (
        <div data-result-list className="mt-3 min-h-0 flex-1 overflow-y-auto p-1">
          <div className="grid gap-2 sm:grid-cols-3">
            {results.map(icon => {
              const selected = value?.slug === icon.key
              const iconRef = createBuiltinIconRef(icon)

              return (
                <Button
                  key={icon.key}
                  data-builtin-icon-option
                  type="button"
                  variant={selected ? 'secondary' : 'ghost'}
                  className={cn(
                    'h-9.5 justify-start gap-2 border border-transparent px-2 text-left',
                    selected && 'border-accent/50',
                  )}
                  disabled={disabled}
                  onClick={() => onChange(iconRef)}
                  onFocus={() => onChange(iconRef)}
                  onKeyDown={event => handleIconKeyDown(event, iconRef)}
                >
                  <BuiltinIconPreview icon={icon} decorative />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{icon.title}</span>
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      ) : (
        <div data-result-list className="mt-3 min-h-0 flex-1 overflow-y-auto p-1">
          <p className="rounded-md bg-background px-3 py-2 text-sm text-muted-foreground">
            {t('linkEditor.icon.noMatches')}
          </p>
        </div>
      )}
    </div>
  )
}

function focusIconOptionByKey(currentButton: HTMLButtonElement, key: string): void {
  const buttons = getEnabledIconOptionButtons(currentButton)
  const currentIndex = buttons.indexOf(currentButton)

  if (currentIndex === -1) {
    return
  }

  focusIconOption(buttons, currentIndex, getIconKeyboardOffset(currentButton, key))
}

function getEnabledIconOptionButtons(currentButton: HTMLButtonElement): HTMLButtonElement[] {
  const list = currentButton.closest('[data-result-list]')

  return Array.from(list?.querySelectorAll<HTMLButtonElement>('[data-builtin-icon-option]') ?? []).filter(
    button => !button.disabled,
  )
}

function getIconKeyboardOffset(button: HTMLButtonElement, key: string): number {
  const columnCount = getIconGridColumnCount(button)
  const offsetByKey: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -columnCount,
    ArrowDown: columnCount,
  }

  return offsetByKey[key] ?? 0
}

function getIconGridColumnCount(button: HTMLButtonElement): number {
  const grid = button.parentElement

  if (!grid) {
    return 1
  }

  return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1
}

function focusIconOption(buttons: HTMLButtonElement[], currentIndex: number, offset: number): void {
  const nextIndex = Math.min(Math.max(currentIndex + offset, 0), buttons.length - 1)
  const nextButton = buttons[nextIndex]

  nextButton?.focus()
  nextButton?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
