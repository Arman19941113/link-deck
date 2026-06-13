// Secondary confirmation dialogs used by the settings dialog.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import { cn } from '@/lib/utils'
import type { useCategorySettingsViewModel } from '../hooks/use-category-settings-view-model'
import type { DataBusyAction, DestructiveDataAction } from '../types'

type DeleteMode = DeleteCategoryLinksStrategy['mode']
type CategorySettingsViewModel = ReturnType<typeof useCategorySettingsViewModel>

type DestructiveDataActionConfirmDialogProps = {
  busyAction: DataBusyAction | null
  displaySizeConfig: DisplaySizeConfig
  isBusy: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  pendingDestructiveDataAction: DestructiveDataAction | null
}

type CategoryDeleteConfirmDialogProps = {
  categorySettingsViewModel: CategorySettingsViewModel
  displaySizeConfig: DisplaySizeConfig
}

/** Renders the reset and clear-data confirmation dialog. */
export function DestructiveDataActionConfirmDialog({
  busyAction,
  displaySizeConfig,
  isBusy,
  onConfirm,
  onOpenChange,
  pendingDestructiveDataAction,
}: DestructiveDataActionConfirmDialogProps) {
  return (
    <AlertDialog open={pendingDestructiveDataAction !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className={displaySizeConfig.dialog.contentClassName}>
        <AlertDialogHeader className={displaySizeConfig.dialog.headerClassName}>
          <AlertDialogTitle className={displaySizeConfig.dialog.titleClassName}>
            {pendingDestructiveDataAction === 'reset' ? 'Reset to default data?' : 'Clear all data?'}
          </AlertDialogTitle>
          <AlertDialogDescription className={displaySizeConfig.dialog.descriptionClassName}>
            {pendingDestructiveDataAction === 'reset'
              ? 'This will replace all current links, categories, local icons, and settings with the built-in default data.'
              : 'This will delete all links, local icons, and custom categories. One default category will remain.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={displaySizeConfig.dialog.footerClassName}>
          <AlertDialogCancel size={displaySizeConfig.control.buttonSize} disabled={isBusy}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size={displaySizeConfig.control.buttonSize}
            disabled={isBusy}
            onClick={event => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {busyAction === 'reset'
              ? 'Resetting…'
              : busyAction === 'clear'
                ? 'Clearing…'
                : pendingDestructiveDataAction === 'reset'
                  ? 'Reset'
                  : 'Clear data'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Renders the category deletion dialog and optional link-handling controls. */
export function CategoryDeleteConfirmDialog({
  categorySettingsViewModel,
  displaySizeConfig,
}: CategoryDeleteConfirmDialogProps) {
  return (
    <AlertDialog
      open={categorySettingsViewModel.pendingDeleteCategory !== null}
      onOpenChange={open => {
        if (!open) {
          categorySettingsViewModel.clearPendingDelete()
        }
      }}
    >
      <AlertDialogContent size="default" className={displaySizeConfig.dialog.contentClassName}>
        <AlertDialogHeader className={displaySizeConfig.dialog.headerClassName}>
          <AlertDialogTitle className={displaySizeConfig.dialog.titleClassName}>
            Delete "{categorySettingsViewModel.pendingDeleteCategory?.name}"?
          </AlertDialogTitle>
          <AlertDialogDescription className={displaySizeConfig.dialog.descriptionClassName}>
            {categorySettingsViewModel.pendingDeleteLinkCount > 0
              ? `This category contains ${categorySettingsViewModel.pendingDeleteLinkCount} links. Choose what should happen to them before deleting.`
              : 'This category will be removed immediately.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {categorySettingsViewModel.pendingDeleteCategory && categorySettingsViewModel.pendingDeleteLinkCount > 0 ? (
          <div className={displaySizeConfig.dialog.gridClassName}>
            <div className={displaySizeConfig.dialog.fieldClassName}>
              <Label htmlFor="settings-category-delete-mode" className={displaySizeConfig.control.labelClassName}>
                Action
              </Label>
              <Select
                value={categorySettingsViewModel.deleteMode}
                onValueChange={value => categorySettingsViewModel.setDeleteMode(value as DeleteMode)}
              >
                <SelectTrigger
                  id="settings-category-delete-mode"
                  className={cn('w-full', displaySizeConfig.control.inputClassName)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="move-links">Move to another category</SelectItem>
                    <SelectItem value="delete-links">Delete links too</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {categorySettingsViewModel.deleteMode === 'move-links' ? (
              <div className={displaySizeConfig.dialog.fieldClassName}>
                <Label htmlFor="settings-category-delete-target" className={displaySizeConfig.control.labelClassName}>
                  Move links to
                </Label>
                <Select
                  value={categorySettingsViewModel.effectiveDeleteTargetCategoryId}
                  onValueChange={categorySettingsViewModel.setDeleteTargetCategoryId}
                >
                  <SelectTrigger
                    id="settings-category-delete-target"
                    className={cn('w-full', displaySizeConfig.control.inputClassName)}
                    aria-invalid={
                      !categorySettingsViewModel.deleteTargetCategoryId && Boolean(categorySettingsViewModel.error)
                    }
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categorySettingsViewModel.otherCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        ) : null}

        <AlertDialogFooter className={displaySizeConfig.dialog.footerClassName}>
          <AlertDialogCancel size={displaySizeConfig.control.buttonSize}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size={displaySizeConfig.control.buttonSize}
            onClick={event => {
              event.preventDefault()
              void categorySettingsViewModel.confirmPendingDelete()
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
