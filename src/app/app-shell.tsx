// Start page app shell that connects the deck view model and composes the main page regions.

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { LinkEditor } from '@/app/deck/components/link-editor'
import { DeckContainer } from '@/app/deck/deck-container'
import { useDeckShellViewModel } from '@/app/deck/hooks/use-deck-shell-view-model'
import { useLanguagePreference } from '@/app/hooks/use-language-preference'
import { useThemePreference } from '@/app/hooks/use-theme-preference'
import { preloadPinyinSearchModule } from '@/domain/deck/pinyin-search-loader'
import type { SavedLink } from '@/domain/deck/types'
import { SettingsDialog } from '@/app/settings/settings-dialog'
import type { SettingsTab } from '@/app/settings/types'
import { getDisplaySizeConfig } from '@/app/display-size-config'

/** Composes start page data, status messages, and navigation display regions. */
export function AppShell() {
  const { t } = useTranslation()
  const [linkEditorOpen, setLinkEditorOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null)
  const [newLinkDefaultCategoryId, setNewLinkDefaultCategoryId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('general')
  const { language, setLanguage } = useLanguagePreference()
  const { designStylePreference, setDesignStylePreference, setThemePreference, themePreference } = useThemePreference()
  const {
    categories,
    links,
    displaySize,
    sortMode,
    query,
    initialized,
    error,
    filteredSections,
    setDisplaySize,
    setQuery,
    setSortMode,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategoryList,
    upsertLink,
    deleteLink,
    moveLinkToCategory,
    openLinkInNewWindow,
    loadStoredIconFile,
    exportDeck,
    importDeck,
    resetDeckToDefaults,
    clearDeckData,
  } = useDeckShellViewModel(language)
  const displaySizeConfig = getDisplaySizeConfig(displaySize)

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: Window['requestIdleCallback']
      cancelIdleCallback?: Window['cancelIdleCallback']
    }

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(preloadPinyinSearchModule, { timeout: 3000 })

      return () => {
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = globalThis.setTimeout(preloadPinyinSearchModule, 1000)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error || t('deck.errors.actionFailed'), { id: 'deck-error' })
    }
  }, [error, t])

  /** Opens a blank form for adding a link from the global action. */
  function handleCreateLink(): void {
    setEditingLink(null)
    setNewLinkDefaultCategoryId(null)
    setLinkEditorOpen(true)
  }

  /** Opens settings to a specific tab. */
  function openSettings(tab: SettingsTab = 'general'): void {
    setSettingsInitialTab(tab)
    setSettingsOpen(true)
  }

  /** Opens a blank form for adding a link. */
  function handleAddLink(categoryId: string): void {
    setEditingLink(null)
    setNewLinkDefaultCategoryId(categoryId)
    setLinkEditorOpen(true)
  }

  /** Opens the edit form with the current link data. */
  function handleEditLink(link: SavedLink): void {
    setEditingLink(link)
    setNewLinkDefaultCategoryId(null)
    setLinkEditorOpen(true)
  }

  /** Clears edit state when closing the link editor so the next add does not reuse stale data. */
  function handleLinkEditorOpenChange(open: boolean): void {
    setLinkEditorOpen(open)

    if (!open) {
      setEditingLink(null)
      setNewLinkDefaultCategoryId(null)
    }
  }

  return (
    <main className="app-surface-root min-h-svh text-foreground">
      <DeckContainer
        categories={categories}
        links={links}
        designStylePreference={designStylePreference}
        displaySizeConfig={displaySizeConfig}
        error={error}
        loadStoredIconFile={loadStoredIconFile}
        initialized={initialized}
        query={query}
        sortMode={sortMode}
        filteredSections={filteredSections}
        onAddLinkToCategory={handleAddLink}
        onCreateLinkFromToolbar={handleCreateLink}
        onDeleteLink={deleteLink}
        onEditLink={handleEditLink}
        onMoveLinkToCategory={moveLinkToCategory}
        onOpenLinkInNewWindow={openLinkInNewWindow}
        onOpenSettings={openSettings}
        onSearchChange={setQuery}
        onSearchFocus={preloadPinyinSearchModule}
      />

      <LinkEditor
        open={linkEditorOpen}
        link={editingLink}
        defaultCategoryId={newLinkDefaultCategoryId}
        categories={categories}
        displaySizeConfig={displaySizeConfig}
        loadStoredIconFile={loadStoredIconFile}
        onOpenChange={handleLinkEditorOpenChange}
        upsertLink={upsertLink}
      />
      <SettingsDialog
        open={settingsOpen}
        initialTab={settingsInitialTab}
        categories={categories}
        links={links}
        displaySize={displaySize}
        designStylePreference={designStylePreference}
        sortMode={sortMode}
        themePreference={themePreference}
        language={language}
        onOpenChange={setSettingsOpen}
        onDisplaySizeChange={setDisplaySize}
        onDesignStylePreferenceChange={setDesignStylePreference}
        onLanguageChange={setLanguage}
        onSortModeChange={setSortMode}
        onThemePreferenceChange={setThemePreference}
        addCategory={addCategory}
        renameCategory={renameCategory}
        deleteCategory={deleteCategory}
        reorderCategoryList={reorderCategoryList}
        exportDeck={exportDeck}
        importDeck={importDeck}
        resetDeckToDefaults={resetDeckToDefaults}
        clearDeckData={clearDeckData}
      />
    </main>
  )
}
