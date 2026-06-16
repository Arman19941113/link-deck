// Shared settings feature types used by app-level composition and shortcuts.

export type DestructiveDataAction = 'reset' | 'clear'

export type DataBusyAction = DestructiveDataAction | 'export' | 'import'

export type SettingsLanguage = 'en'

export type SettingsTab = 'general' | 'data' | 'categories' | 'shortcuts'
