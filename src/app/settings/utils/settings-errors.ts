// Shared settings dialog error message helpers.

export function getSettingsDialogErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Action failed. Please try again later.'
}

export function getImportErrorToastMessage(error: unknown): string {
  const message = getSettingsDialogErrorMessage(error)

  if (message === 'Unsupported backup format.') {
    return message
  }

  if (message === 'Import file is not valid JSON' || message === 'Import file is not a Link Deck backup') {
    return 'Choose a Link Deck backup file.'
  }

  if (message.startsWith('Import file')) {
    return 'Invalid backup file.'
  }

  return 'Import failed. Check the backup file.'
}
