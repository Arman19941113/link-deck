// Settings dialog shell, tab navigation, and secondary confirmation dialogs.

import { type KeyboardEvent, useState } from 'react'

import { CategoriesSettingsPanel } from './categories-settings-panel'
import { DataSettingsPanel } from './data-settings-panel'
import { GeneralSettingsPanel } from './general-settings-panel'
import { useCategorySettingsViewModel } from './hooks/use-category-settings-view-model'
import { useImmediateSetting } from './hooks/use-immediate-setting'
import { SETTINGS_TABS, useSettingsTabNavigation } from './hooks/use-settings-tab-navigation'
import { useSettingsError } from './hooks/use-settings-error'
import { useSettingsBackupActions } from './hooks/use-settings-backup-actions'
import { CategoryDeleteConfirmDialog, DestructiveDataActionConfirmDialog } from './components/settings-confirm-dialogs'
import { ShortcutsSettingsPanel } from './shortcuts-settings-panel'
import type { DataBusyAction, SettingsLanguage, SettingsTab } from './types'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getDisplaySizeConfig, type DisplaySizeConfig } from '@/app/display-size-config'
import type { DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import type { Category, SavedLink, SortMode } from '@/domain/deck/types'
import type { ThemePreference } from '@/domain/settings/theme'
import type { DisplaySize } from '@/domain/settings/types'
import { cn } from '@/lib/utils'

export type SettingsDialogControllerProps = {
  initialTab?: SettingsTab
  categories: Category[]
  links: SavedLink[]
  displaySize: DisplaySize
  sortMode: SortMode
  themePreference: ThemePreference
  onOpenChange: (open: boolean) => void
  onDisplaySizeChange: (displaySize: DisplaySize) => void
  onSortModeChange: (sortMode: SortMode) => void
  onThemePreferenceChange: (themePreference: ThemePreference) => void
  addCategory: (name: string) => Promise<Category>
  renameCategory: (categoryId: string, name: string) => Promise<void>
  deleteCategory: (categoryId: string, options?: DeleteCategoryLinksStrategy) => Promise<void>
  reorderCategoryList: (activeCategoryId: string, overCategoryId: string) => Promise<void>
  exportDeck: () => Promise<unknown>
  importDeck: (json: string) => Promise<void>
  resetDeckToDefaults: () => Promise<void>
  clearDeckData: () => Promise<void>
}

/** Settings dialog content that keeps local control state responsive while global updates persist. */
export function SettingsDialogController({
  initialTab = 'general',
  categories,
  links,
  displaySize,
  sortMode,
  themePreference,
  onOpenChange,
  onDisplaySizeChange,
  onSortModeChange,
  onThemePreferenceChange,
  addCategory,
  renameCategory,
  deleteCategory,
  reorderCategoryList,
  exportDeck,
  importDeck,
  resetDeckToDefaults,
  clearDeckData,
}: SettingsDialogControllerProps) {
  const [busyAction, setBusyAction] = useState<DataBusyAction | null>(null)
  const {
    activeTab,
    focusActiveSettingsTab,
    handleSettingsTabKeyDown,
    registerSettingsTabButton,
    requestSettingsTabChange,
  } = useSettingsTabNavigation(initialTab)
  const [language, setLanguage] = useState<SettingsLanguage>('en')
  const [localDisplaySize, handleDisplaySizeChange] = useImmediateSetting(displaySize, onDisplaySizeChange)
  const [localSortMode, handleSortModeChange] = useImmediateSetting(sortMode, onSortModeChange)
  const [localThemePreference, handleThemePreferenceChange] = useImmediateSetting(
    themePreference,
    onThemePreferenceChange,
  )
  const settingsError = useSettingsError()
  const displaySizeConfig = getDisplaySizeConfig(displaySize)
  const isBusy = busyAction !== null
  const categorySettingsViewModel = useCategorySettingsViewModel({
    categories,
    links,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategoryList,
    settingsError,
  })
  const backupActions = useSettingsBackupActions({
    busyAction,
    clearError: settingsError.clearError,
    showError: settingsError.showError,
    setBusyAction,
    exportDeck,
    importDeck,
    resetDeckToDefaults,
    clearDeckData,
    onClose: () => onOpenChange(false),
  })
  const hasSecondaryDialogOpen =
    backupActions.pendingDestructiveDataAction !== null || categorySettingsViewModel.pendingDeleteCategory !== null

  /** Intercepts unsaved changes before closing the dialog. */
  function requestClose(): void {
    if (isBusy) {
      return
    }

    onOpenChange(false)
  }

  function renderActivePanel() {
    if (activeTab === 'general') {
      return (
        <GeneralSettingsPanel
          displaySizeConfig={displaySizeConfig}
          displaySize={localDisplaySize}
          sortMode={localSortMode}
          themePreference={localThemePreference}
          language={language}
          onDisplaySizeChange={handleDisplaySizeChange}
          onSortModeChange={handleSortModeChange}
          onThemePreferenceChange={handleThemePreferenceChange}
          onLanguageChange={setLanguage}
        />
      )
    }

    if (activeTab === 'shortcuts') {
      return <ShortcutsSettingsPanel displaySizeConfig={displaySizeConfig} />
    }

    if (activeTab === 'data') {
      return (
        <DataSettingsPanel
          displaySizeConfig={displaySizeConfig}
          importFileInputRef={backupActions.importFileInputRef}
          canUseDataControls={backupActions.canUseDataControls}
          busyAction={busyAction}
          onImportRequest={backupActions.requestImportDeck}
          onImportFileChange={event => void backupActions.handleImportFileChange(event)}
          onExportDeck={() => void backupActions.handleExportDeck()}
          onDestructiveDataActionRequest={backupActions.requestDestructiveDataAction}
        />
      )
    }

    return <CategoriesSettingsPanel displaySizeConfig={displaySizeConfig} viewModel={categorySettingsViewModel} />
  }

  return (
    <>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          displaySizeConfig.dialog.surfaceClassName,
          'grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0',
        )}
        showCloseButton={false}
        onOpenAutoFocus={event => {
          event.preventDefault()
          focusActiveSettingsTab()
        }}
        onEscapeKeyDown={event => {
          event.preventDefault()

          if (categorySettingsViewModel.editingCategoryId) {
            categorySettingsViewModel.cancelRename()
            return
          }

          requestClose()
        }}
        onPointerDownOutside={event => {
          if (hasSecondaryDialogOpen) {
            return
          }

          event.preventDefault()
          requestClose()
        }}
      >
        <DialogHeader className={cn('border-b px-4 py-4 sm:px-6', displaySizeConfig.dialog.headerClassName)}>
          <DialogTitle className={displaySizeConfig.dialog.titleClassName}>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]">
          <SettingsNavigation
            activeTab={activeTab}
            displaySizeConfig={displaySizeConfig}
            onTabButtonRef={registerSettingsTabButton}
            onTabChange={requestSettingsTabChange}
            onTabKeyDown={handleSettingsTabKeyDown}
          />

          <section className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">{renderActivePanel()}</section>
        </div>

        <DialogFooter className={cn('border-t px-4 py-2 sm:px-6', displaySizeConfig.dialog.footerClassName)}>
          <Button
            type="button"
            variant="outline"
            size={displaySizeConfig.control.buttonSize}
            disabled={isBusy}
            onClick={requestClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      <DestructiveDataActionConfirmDialog
        busyAction={busyAction}
        displaySizeConfig={displaySizeConfig}
        isBusy={isBusy}
        onConfirm={() => void backupActions.handleConfirmDestructiveDataAction()}
        onOpenChange={open => {
          if (!open && !isBusy) {
            backupActions.setPendingDestructiveDataAction(null)
          }
        }}
        pendingDestructiveDataAction={backupActions.pendingDestructiveDataAction}
      />

      <CategoryDeleteConfirmDialog
        categorySettingsViewModel={categorySettingsViewModel}
        displaySizeConfig={displaySizeConfig}
      />
    </>
  )
}

type SettingsNavigationProps = {
  activeTab: SettingsTab
  displaySizeConfig: DisplaySizeConfig
  onTabButtonRef: (tab: SettingsTab, node: HTMLButtonElement | null) => void
  onTabChange: (tab: SettingsTab) => void
  onTabKeyDown: (event: KeyboardEvent<HTMLButtonElement>, tab: SettingsTab) => void
}

function SettingsNavigation({
  activeTab,
  displaySizeConfig,
  onTabButtonRef,
  onTabChange,
  onTabKeyDown,
}: SettingsNavigationProps) {
  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b bg-muted/40 p-2 sm:flex-col sm:border-r sm:border-b-0"
      aria-label="Settings navigation"
    >
      {SETTINGS_TABS.map(tab => (
        <Button
          key={tab.value}
          ref={node => onTabButtonRef(tab.value, node)}
          type="button"
          variant={activeTab === tab.value ? 'secondary' : 'ghost'}
          size={displaySizeConfig.control.buttonSize}
          className="justify-start"
          aria-current={activeTab === tab.value ? 'page' : undefined}
          onClick={() => onTabChange(tab.value)}
          onKeyDown={event => onTabKeyDown(event, tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </nav>
  )
}
