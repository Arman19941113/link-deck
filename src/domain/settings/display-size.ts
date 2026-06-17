// Defines display-size setting value, defaults, and validation helpers.

export type DisplaySize = 'compact' | 'normal' | 'spacious'

export const DEFAULT_DISPLAY_SIZE: DisplaySize = 'normal'

const DISPLAY_SIZE_VALUES = new Set<DisplaySize>(['compact', 'normal', 'spacious'])

/** Checks unknown stored settings before using them as display-size state. */
export function isDisplaySize(value: unknown): value is DisplaySize {
  return typeof value === 'string' && DISPLAY_SIZE_VALUES.has(value as DisplaySize)
}
