// Manages settings tab state, roving focus, and keyboard navigation.

import { type KeyboardEvent, useRef, useState } from 'react'

import type { SettingsTab } from '../types'

export const SETTINGS_TABS: Array<{ value: SettingsTab; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'data', label: 'Data' },
  { value: 'categories', label: 'Categories' },
  { value: 'shortcuts', label: 'Shortcuts' },
]

/** Manages tab selection and keyboard focus for the settings navigation. */
export function useSettingsTabNavigation(initialTab: SettingsTab) {
  const settingsTabRefs = useRef(new Map<SettingsTab, HTMLButtonElement>())
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  /** Switches settings panels now that category edits save as they happen. */
  function requestSettingsTabChange(nextTab: SettingsTab): boolean {
    if (activeTab === nextTab) {
      return false
    }

    setActiveTab(nextTab)
    return true
  }

  /** Keeps dialog auto-focus aligned with the active settings tab. */
  function focusActiveSettingsTab(): void {
    settingsTabRefs.current.get(activeTab)?.focus({ preventScroll: true })
  }

  function registerSettingsTabButton(tab: SettingsTab, node: HTMLButtonElement | null): void {
    if (node) {
      settingsTabRefs.current.set(tab, node)
      return
    }

    settingsTabRefs.current.delete(tab)
  }

  /** Moves between settings panels from the settings navigation. */
  function handleSettingsTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, tab: SettingsTab): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return
    }

    event.preventDefault()

    const direction = event.key === 'ArrowDown' ? 1 : -1
    const nextTab = getNextSettingsTab(tab, direction)

    if (!nextTab) {
      return
    }

    if (requestSettingsTabChange(nextTab)) {
      settingsTabRefs.current.get(nextTab)?.focus({ preventScroll: true })
    }
  }

  return {
    activeTab,
    focusActiveSettingsTab,
    handleSettingsTabKeyDown,
    registerSettingsTabButton,
    requestSettingsTabChange,
  }
}

function getNextSettingsTab(tab: SettingsTab, direction: 1 | -1): SettingsTab | null {
  const currentIndex = SETTINGS_TABS.findIndex(settingsTab => settingsTab.value === tab)

  if (currentIndex < 0) {
    return null
  }

  const nextIndex = (currentIndex + direction + SETTINGS_TABS.length) % SETTINGS_TABS.length

  return SETTINGS_TABS[nextIndex]?.value ?? null
}
