// Settings dialog shell, tab navigation, and secondary confirmation dialogs.

import { type KeyboardEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
import type { DataBusyAction, SettingsTab } from './types'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, SavedLink } from '@/domain/deck/types'
import type { DesignStylePreference } from '@/domain/settings/design-style'
import type { AppLanguage } from '@/domain/settings/language'
import type { ThemeColorPreference } from '@/domain/settings/theme-color'
import type { DisplaySize } from '@/domain/settings/display-size'

export type SettingsDialogControllerProps = {
  initialTab?: SettingsTab
  categories: Category[]
  links: SavedLink[]
  displaySize: DisplaySize
  designStylePreference: DesignStylePreference
  sortMode: SortMode
  themeColorPreference: ThemeColorPreference
  language: AppLanguage
  onCloseAutoFocus?: () => void
  onOpenChange: (open: boolean) => void
  onDisplaySizeChange: (displaySize: DisplaySize) => void
  onDesignStylePreferenceChange: (designStylePreference: DesignStylePreference) => void
  onLanguageChange: (language: AppLanguage) => void
  onSortModeChange: (sortMode: SortMode) => void
  onThemeColorPreferenceChange: (themeColorPreference: ThemeColorPreference) => void
  addCategory: (name: string) => Promise<Category>
  renameCategory: (categoryId: string, name: string) => Promise<void>
  deleteCategory: (categoryId: string, options?: DeleteCategoryLinksStrategy) => Promise<void>
  reorderCategoryList: (activeCategoryId: string, overCategoryId: string) => Promise<void>
  exportDeck: () => Promise<unknown>
  importDeck: (json: string) => Promise<void>
  resetDeckToDefaults: (language: AppLanguage) => Promise<void>
  clearDeckData: (language: AppLanguage) => Promise<void>
}

/** Settings dialog content that keeps local control state responsive while global updates persist. */
export function SettingsDialogController({
  initialTab = 'general',
  categories,
  links,
  displaySize,
  designStylePreference,
  sortMode,
  themeColorPreference,
  language,
  onCloseAutoFocus,
  onOpenChange,
  onDisplaySizeChange,
  onDesignStylePreferenceChange,
  onLanguageChange,
  onSortModeChange,
  onThemeColorPreferenceChange,
  addCategory,
  renameCategory,
  deleteCategory,
  reorderCategoryList,
  exportDeck,
  importDeck,
  resetDeckToDefaults,
  clearDeckData,
}: SettingsDialogControllerProps) {
  const { t } = useTranslation()
  const [busyAction, setBusyAction] = useState<DataBusyAction | null>(null)
  const {
    activeTab,
    focusActiveSettingsTab,
    handleSettingsTabKeyDown,
    registerSettingsTabButton,
    requestSettingsTabChange,
  } = useSettingsTabNavigation(initialTab)
  const [localDisplaySize, handleDisplaySizeChange] = useImmediateSetting(displaySize, onDisplaySizeChange)
  const [localDesignStylePreference, handleDesignStylePreferenceChange] = useImmediateSetting(
    designStylePreference,
    onDesignStylePreferenceChange,
  )
  const [localSortMode, handleSortModeChange] = useImmediateSetting(sortMode, onSortModeChange)
  const [localThemeColorPreference, handleThemeColorPreferenceChange] = useImmediateSetting(
    themeColorPreference,
    onThemeColorPreferenceChange,
  )
  const settingsError = useSettingsError()
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
    language,
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
          displaySize={localDisplaySize}
          designStylePreference={localDesignStylePreference}
          sortMode={localSortMode}
          themeColorPreference={localThemeColorPreference}
          language={language}
          onDisplaySizeChange={handleDisplaySizeChange}
          onDesignStylePreferenceChange={handleDesignStylePreferenceChange}
          onSortModeChange={handleSortModeChange}
          onThemeColorPreferenceChange={handleThemeColorPreferenceChange}
          onLanguageChange={onLanguageChange}
        />
      )
    }

    if (activeTab === 'categories') {
      return <CategoriesSettingsPanel viewModel={categorySettingsViewModel} />
    }

    if (activeTab === 'data') {
      return (
        <DataSettingsPanel
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

    return <ShortcutsSettingsPanel />
  }

  return (
    <>
      <DialogContent
        aria-describedby={undefined}
        className="grid h-148 w-2xl max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-none"
        showCloseButton={false}
        onOpenAutoFocus={event => {
          event.preventDefault()
          focusActiveSettingsTab()
        }}
        onCloseAutoFocus={event => {
          event.preventDefault()
          onCloseAutoFocus?.()
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
        <DialogHeader className="gap-2 border-b px-4 py-4 sm:px-6">
          <DialogTitle className="text-lg leading-none font-semibold">{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]">
          <SettingsNavigation
            activeTab={activeTab}
            onTabButtonRef={registerSettingsTabButton}
            onTabChange={requestSettingsTabChange}
            onTabKeyDown={handleSettingsTabKeyDown}
          />

          <section className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">{renderActivePanel()}</section>
        </div>

        <DialogFooter className="gap-2 border-t px-4 py-2 sm:px-6">
          <Button type="button" variant="outline" size="default" disabled={isBusy} onClick={requestClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <DestructiveDataActionConfirmDialog
        busyAction={busyAction}
        isBusy={isBusy}
        onConfirm={() => void backupActions.handleConfirmDestructiveDataAction()}
        onOpenChange={open => {
          if (!open && !isBusy) {
            backupActions.setPendingDestructiveDataAction(null)
          }
        }}
        pendingDestructiveDataAction={backupActions.pendingDestructiveDataAction}
      />

      <CategoryDeleteConfirmDialog categorySettingsViewModel={categorySettingsViewModel} />
    </>
  )
}

type SettingsNavigationProps = {
  activeTab: SettingsTab
  onTabButtonRef: (tab: SettingsTab, node: HTMLButtonElement | null) => void
  onTabChange: (tab: SettingsTab) => void
  onTabKeyDown: (event: KeyboardEvent<HTMLButtonElement>, tab: SettingsTab) => void
}

function SettingsNavigation({ activeTab, onTabButtonRef, onTabChange, onTabKeyDown }: SettingsNavigationProps) {
  const { t } = useTranslation()

  return (
    <nav
      className="settings-nav flex gap-1 overflow-x-auto border-b p-2 sm:flex-col sm:border-r sm:border-b-0"
      aria-label={t('settings.navigation')}
    >
      {SETTINGS_TABS.map(tab => (
        <Button
          key={tab}
          ref={node => onTabButtonRef(tab, node)}
          type="button"
          variant="ghost"
          size="default"
          className="settings-nav-item justify-start"
          aria-current={activeTab === tab ? 'page' : undefined}
          onClick={() => onTabChange(tab)}
          onKeyDown={event => onTabKeyDown(event, tab)}
        >
          {t(`settings.tabs.${tab}`)}
        </Button>
      ))}
    </nav>
  )
}
