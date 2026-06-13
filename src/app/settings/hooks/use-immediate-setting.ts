// Keeps settings controls responsive while committing changes through app-level actions.

import { startTransition, useEffect, useState } from 'react'

/** Mirrors a committed setting locally, then schedules the app-wide update after user changes. */
export function useImmediateSetting<TValue>(
  value: TValue,
  onChange: (value: TValue) => void,
): readonly [TValue, (value: TValue) => void] {
  const [localValue, setLocalValue] = useState<TValue>(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  function commitValue(nextValue: TValue): void {
    setLocalValue(nextValue)
    startTransition(() => {
      onChange(nextValue)
    })
  }

  return [localValue, commitValue] as const
}
