// Shared settings dialog error message helpers.

type TranslateSettingsError = (key: string) => string

export function getSettingsDialogErrorMessage(error: unknown, t?: TranslateSettingsError): string {
  return error instanceof Error
    ? error.message
    : (t?.('settings.errors.actionFailed') ?? 'Action failed. Please try again later.')
}

export function getImportErrorToastMessage(error: unknown, t?: TranslateSettingsError): string {
  const message = getSettingsDialogErrorMessage(error, t)

  if (message === 'Unsupported backup format.') {
    return message
  }

  if (message === 'Import file is not valid JSON' || message === 'Import file is not a Link Deck backup') {
    return t?.('settings.errors.chooseBackupFile') ?? 'Choose a Link Deck backup file.'
  }

  if (message.startsWith('Import file')) {
    return t?.('settings.errors.invalidBackupFile') ?? 'Invalid backup file.'
  }

  return t?.('settings.errors.importFailed') ?? 'Import failed. Check the backup file.'
}
