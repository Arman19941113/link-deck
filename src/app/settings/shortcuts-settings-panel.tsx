// Shortcuts settings panel for displaying keyboard shortcut reference rows.

import { getKeyboardShortcutKeys, KEYBOARD_SHORTCUTS } from '@/app/keyboard-shortcuts'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

type ShortcutsSettingsPanelProps = {
  displaySizeConfig: DisplaySizeConfig
}

/** Renders the read-only keyboard shortcut reference list. */
export function ShortcutsSettingsPanel({ displaySizeConfig }: ShortcutsSettingsPanelProps) {
  return (
    <div className={cn('max-w-xl', displaySizeConfig.dialog.formClassName)}>
      <div className="flex flex-col gap-2">
        {KEYBOARD_SHORTCUTS.map(shortcut => (
          <div
            key={shortcut.id}
            className="flex flex-col gap-2 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{shortcut.label}</p>
            </div>
            <kbd className="inline-flex w-fit shrink-0 items-center rounded-sm border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
              {getKeyboardShortcutKeys(shortcut)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  )
}
