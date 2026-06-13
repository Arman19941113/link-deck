// Keyboard shortcut definitions shared by global handlers and settings copy.

export type KeyboardShortcutId = 'search' | 'createLink' | 'openLink' | 'deleteLink' | 'keyboardShortcuts'

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    platform?: string
  }
}

type KeyboardShortcutKeys = {
  apple: string
  default: string
}

export type KeyboardShortcut = {
  id: KeyboardShortcutId
  label: string
  keys: KeyboardShortcutKeys
  ariaKeys: string
}

/** Returns platform-specific shortcut text for display. */
export function getKeyboardShortcutKeys(shortcut: KeyboardShortcut, currentNavigator = getCurrentNavigator()): string {
  return isAppleKeyboardPlatform(currentNavigator) ? shortcut.keys.apple : shortcut.keys.default
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    id: 'search',
    label: 'Search',
    keys: {
      apple: 'Cmd + K',
      default: 'Ctrl + K',
    },
    ariaKeys: 'Meta+K Control+K',
  },
  {
    id: 'openLink',
    label: 'Open selected link',
    keys: {
      apple: 'Cmd + Enter',
      default: 'Ctrl + Enter',
    },
    ariaKeys: 'Meta+Enter Control+Enter',
  },
  {
    id: 'createLink',
    label: 'New link',
    keys: {
      apple: 'Cmd + Shift + O',
      default: 'Ctrl + Shift + O',
    },
    ariaKeys: 'Meta+Shift+O Control+Shift+O',
  },
  {
    id: 'deleteLink',
    label: 'Delete selected link',
    keys: {
      apple: 'Cmd + Shift + Backspace',
      default: 'Ctrl + Shift + Backspace',
    },
    ariaKeys: 'Meta+Shift+Backspace Control+Shift+Backspace',
  },
  {
    id: 'keyboardShortcuts',
    label: 'Show shortcuts',
    keys: {
      apple: 'Cmd + /',
      default: 'Ctrl + /',
    },
    ariaKeys: 'Meta+/ Control+/',
  },
]

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
