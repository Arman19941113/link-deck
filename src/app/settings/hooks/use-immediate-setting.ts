// Keeps settings controls responsive while committing changes through app-level actions.

import { startTransition, useState } from 'react'

/** Mirrors a committed setting locally, then schedules the app-wide update after user changes. */
export function useImmediateSetting<TValue>(
  value: TValue,
  onChange: (value: TValue) => void,
): readonly [TValue, (value: TValue) => void] {
  const [setting, setSetting] = useState({ committedValue: value, localValue: value })

  if (!Object.is(setting.committedValue, value)) {
    setSetting({ committedValue: value, localValue: value })
  }

  function commitValue(nextValue: TValue): void {
    setSetting(current => (Object.is(current.localValue, nextValue) ? current : { ...current, localValue: nextValue }))
    startTransition(() => {
      onChange(nextValue)
    })
  }

  return [setting.localValue, commitValue] as const
}
