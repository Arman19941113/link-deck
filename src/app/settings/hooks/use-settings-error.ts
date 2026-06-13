// Coordinates settings dialog field error state and toast presentation.

import { useState } from 'react'
import { toast } from 'sonner'

export type SettingsErrorController = {
  error: string | null
  clearError: () => void
  showError: (message: string) => void
}

export function useSettingsError(): SettingsErrorController {
  const [error, setError] = useState<string | null>(null)

  function showError(message: string): void {
    setError(message)
    toast.error(message, { id: 'settings-dialog-error' })
  }

  function clearError(): void {
    setError(null)
  }

  return {
    clearError,
    error,
    showError,
  }
}
