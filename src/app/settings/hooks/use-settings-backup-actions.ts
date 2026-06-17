// Coordinates backup and destructive replacement actions for the settings dialog.

import { type ChangeEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import { getImportErrorToastMessage, getSettingsDialogErrorMessage } from '../utils/settings-errors'
import type { DataBusyAction, DestructiveDataAction } from '../types'
import type { AppLanguage } from '@/domain/settings/language'

type UseSettingsBackupActionsParams = {
  busyAction: DataBusyAction | null
  clearError: () => void
  showError: (message: string) => void
  setBusyAction: (action: DataBusyAction | null) => void
  exportDeck: () => Promise<unknown>
  importDeck: (json: string) => Promise<void>
  resetDeckToDefaults: (language: AppLanguage) => Promise<void>
  clearDeckData: (language: AppLanguage) => Promise<void>
  language: AppLanguage
  onClose: () => void
}

/** Manages import/export and destructive replacement flows for settings data controls. */
export function useSettingsBackupActions({
  busyAction,
  clearError,
  showError,
  setBusyAction,
  exportDeck,
  importDeck,
  resetDeckToDefaults,
  clearDeckData,
  language,
  onClose,
}: UseSettingsBackupActionsParams) {
  const { t } = useTranslation()
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [pendingDestructiveDataAction, setPendingDestructiveDataAction] = useState<DestructiveDataAction | null>(null)
  const isBusy = busyAction !== null
  const isReplacingData = busyAction !== null && busyAction !== 'export'
  const canUseDataControls = !isReplacingData

  /** Downloads a JSON backup generated from the current persisted deck. */
  async function handleExportDeck(): Promise<void> {
    if (isBusy) {
      return
    }

    setBusyAction('export')
    clearError()

    try {
      const exportFile = await exportDeck()
      const blob = new Blob([JSON.stringify(exportFile, null, 2)], {
        type: 'application/json',
      })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = objectUrl
      link.download = `link-deck-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      clearError()
      toast.success(t('settings.toasts.backupExported'))
    } catch (exportError) {
      showError(getSettingsDialogErrorMessage(exportError, t))
    } finally {
      setBusyAction(null)
    }
  }

  /** Opens the hidden JSON import picker when data replacement is allowed. */
  function requestImportDeck(): void {
    if (isBusy) {
      return
    }

    importFileInputRef.current?.click()
  }

  /** Reads the selected JSON backup and replaces the current deck. */
  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0] ?? null

    event.target.value = ''

    if (!file || isBusy) {
      return
    }

    setBusyAction('import')
    clearError()

    try {
      await importDeck(await file.text())
      toast.success(t('settings.toasts.backupImported'))
      setBusyAction(null)
      onClose()
    } catch (importError) {
      toast.error(getImportErrorToastMessage(importError, t), { id: 'backup-import-error' })
      setBusyAction(null)
    }
  }

  /** Opens the destructive confirmation dialog for reset and clear actions. */
  function requestDestructiveDataAction(action: DestructiveDataAction): void {
    if (isBusy) {
      return
    }

    setPendingDestructiveDataAction(action)
    clearError()
  }

  /** Runs the confirmed destructive data replacement action. */
  async function handleConfirmDestructiveDataAction(): Promise<void> {
    if (!pendingDestructiveDataAction || isBusy) {
      return
    }

    setBusyAction(pendingDestructiveDataAction)
    clearError()

    try {
      if (pendingDestructiveDataAction === 'reset') {
        await resetDeckToDefaults(language)
        toast.success(t('settings.toasts.defaultDataRestored'))
      } else {
        await clearDeckData(language)
        toast.success(t('settings.toasts.dataCleared'))
      }

      setPendingDestructiveDataAction(null)
      setBusyAction(null)
      onClose()
    } catch (dataError) {
      showError(getSettingsDialogErrorMessage(dataError, t))
      setBusyAction(null)
    }
  }

  return {
    canUseDataControls,
    handleConfirmDestructiveDataAction,
    handleExportDeck,
    handleImportFileChange,
    importFileInputRef,
    pendingDestructiveDataAction,
    requestDestructiveDataAction,
    requestImportDeck,
    setPendingDestructiveDataAction,
  }
}
