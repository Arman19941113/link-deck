// Shared helpers for deck view model and action hooks.

/** Generates a locally unique id for new deck records. */
export function createDeckRecordId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

/** Converts unknown errors into messages that can be shown directly to users. */
export function getDeckActionErrorMessage(
  error: unknown,
  fallbackMessage = 'Action failed. Please try again later.',
): string {
  return error instanceof Error ? error.message : fallbackMessage
}
