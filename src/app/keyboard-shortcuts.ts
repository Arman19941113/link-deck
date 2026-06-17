// Keyboard shortcut definitions, display helpers, and event matchers.

type KeyboardShortcutId = 'search' | 'createLink' | 'openLink' | 'deleteLink' | 'keyboardShortcuts'

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string
  }
}

type KeyboardShortcutKeys = {
  apple: string
  default: string
}

type KeyboardShortcut = {
  id: KeyboardShortcutId
  key: string
  shiftKey?: boolean
  keys: KeyboardShortcutKeys
  ariaKeys: string
}

type KeyboardShortcutDefinition = Omit<KeyboardShortcut, 'ariaKeys'>

type KeyboardShortcutEvent = {
  altKey: boolean
  ctrlKey: boolean
  isComposing?: boolean
  key: string
  metaKey: boolean
  shiftKey: boolean
}

const KEYBOARD_SHORTCUT_DEFINITIONS: KeyboardShortcutDefinition[] = [
  {
    id: 'search',
    key: 'k',
    keys: {
      apple: 'Cmd + K',
      default: 'Ctrl + K',
    },
  },
  {
    id: 'openLink',
    key: 'Enter',
    keys: {
      apple: 'Cmd + Enter',
      default: 'Ctrl + Enter',
    },
  },
  {
    id: 'createLink',
    key: 'o',
    shiftKey: true,
    keys: {
      apple: 'Cmd + Shift + O',
      default: 'Ctrl + Shift + O',
    },
  },
  {
    id: 'deleteLink',
    key: 'Backspace',
    shiftKey: true,
    keys: {
      apple: 'Cmd + Shift + Backspace',
      default: 'Ctrl + Shift + Backspace',
    },
  },
  {
    id: 'keyboardShortcuts',
    key: '/',
    keys: {
      apple: 'Cmd + /',
      default: 'Ctrl + /',
    },
  },
]

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = KEYBOARD_SHORTCUT_DEFINITIONS.map(shortcut => ({
  ...shortcut,
  ariaKeys: createKeyboardShortcutAriaKeys(shortcut),
}))

/** Returns platform-specific shortcut text for display. */
export function getKeyboardShortcutKeys(shortcut: KeyboardShortcut, currentNavigator = getCurrentNavigator()): string {
  return isAppleKeyboardPlatform(currentNavigator) ? shortcut.keys.apple : shortcut.keys.default
}

/** Returns aria-keyshortcuts text for a known shortcut id. */
export function getKeyboardShortcutAriaKeys(shortcutId: KeyboardShortcutId): string {
  return getKeyboardShortcut(shortcutId).ariaKeys
}

/** Checks whether a keyboard event matches a known shortcut. */
export function matchesKeyboardShortcut(event: KeyboardShortcutEvent, shortcutId: KeyboardShortcutId): boolean {
  const shortcut = getKeyboardShortcut(shortcutId)

  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.isComposing &&
    event.shiftKey === Boolean(shortcut.shiftKey) &&
    normalizeKeyboardKey(event.key) === normalizeKeyboardKey(shortcut.key)
  )
}

function getKeyboardShortcut(shortcutId: KeyboardShortcutId): KeyboardShortcut {
  const shortcut = KEYBOARD_SHORTCUTS.find(item => item.id === shortcutId)

  if (!shortcut) {
    throw new Error(`Unknown keyboard shortcut: ${shortcutId}`)
  }

  return shortcut
}

function createKeyboardShortcutAriaKeys(shortcut: KeyboardShortcutDefinition): string {
  const key = formatAriaKeyboardKey(shortcut.key)
  const shortcutKeys = shortcut.shiftKey ? `Shift+${key}` : key

  return `Meta+${shortcutKeys} Control+${shortcutKeys}`
}

function formatAriaKeyboardKey(key: string): string {
  return key.length === 1 && /[a-z]/i.test(key) ? key.toUpperCase() : key
}

function normalizeKeyboardKey(key: string): string {
  return key.toLowerCase()
}

function getCurrentNavigator(): Navigator | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator
}

function isAppleKeyboardPlatform(currentNavigator?: Navigator): boolean {
  if (!currentNavigator) {
    return true
  }

  const platform =
    (currentNavigator as NavigatorWithUserAgentData).userAgentData?.platform || currentNavigator.platform || ''

  return /mac|iphone|ipad|ipod/i.test(platform)
}
