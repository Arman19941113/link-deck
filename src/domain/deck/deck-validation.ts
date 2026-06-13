// Provides shared validation helpers for deck data.

/** Cleans and validates a required name field. */
export function normalizeRequiredName(value: string, emptyMessage: string): string {
  const name = value.trim()

  if (!name) {
    throw createUserFacingError(emptyMessage)
  }

  return name
}

/** Creates a displayable business error. */
export function createUserFacingError(message: string): Error {
  return new Error(message)
}
