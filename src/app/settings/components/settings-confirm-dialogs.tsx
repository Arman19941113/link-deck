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
import type { DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import { cn } from '@/lib/utils'
import type { useCategorySettingsViewModel } from '../hooks/use-category-settings-view-model'
import type { DataBusyAction, DestructiveDataAction } from '../types'

type DeleteMode = DeleteCategoryLinksStrategy['mode']
type CategorySettingsViewModel = ReturnType<typeof useCategorySettingsViewModel>

type DestructiveDataActionConfirmDialogProps = {
  busyAction: DataBusyAction | null
  isBusy: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  pendingDestructiveDataAction: DestructiveDataAction | null
}

type CategoryDeleteConfirmDialogProps = {
  categorySettingsViewModel: CategorySettingsViewModel
}

/** Renders the reset and clear-data confirmation dialog. */
export function DestructiveDataActionConfirmDialog({
  busyAction,
  isBusy,
  onConfirm,
  onOpenChange,
  pendingDestructiveDataAction,
}: DestructiveDataActionConfirmDialogProps) {
  return (
    <AlertDialog open={pendingDestructiveDataAction !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="max-h-[calc(100svh-2rem)] gap-4 p-6 sm:max-w-xl">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-lg leading-none font-semibold">
            {pendingDestructiveDataAction === 'reset' ? 'Reset to default data?' : 'Clear all data?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {pendingDestructiveDataAction === 'reset'
              ? 'This will replace all current links, categories, local icons, and settings with the built-in default data.'
              : 'This will delete all links, local icons, and custom categories. One default category will remain.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel size="default" disabled={isBusy}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="default"
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
export function CategoryDeleteConfirmDialog({ categorySettingsViewModel }: CategoryDeleteConfirmDialogProps) {
  return (
    <AlertDialog
      open={categorySettingsViewModel.pendingDeleteCategory !== null}
      onOpenChange={open => {
        if (!open) {
          categorySettingsViewModel.clearPendingDelete()
        }
      }}
    >
      <AlertDialogContent size="default" className="max-h-[calc(100svh-2rem)] gap-4 p-6 sm:max-w-xl">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-lg leading-none font-semibold">
            Delete "{categorySettingsViewModel.pendingDeleteCategory?.name}"?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {categorySettingsViewModel.pendingDeleteLinkCount > 0
              ? `This category contains ${categorySettingsViewModel.pendingDeleteLinkCount} links. Choose what should happen to them before deleting.`
              : 'This category will be removed immediately.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {categorySettingsViewModel.pendingDeleteCategory && categorySettingsViewModel.pendingDeleteLinkCount > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-category-delete-mode" className="text-sm">
                Action
              </Label>
              <Select
                value={categorySettingsViewModel.deleteMode}
                onValueChange={value => categorySettingsViewModel.setDeleteMode(value as DeleteMode)}
              >
                <SelectTrigger
                  id="settings-category-delete-mode"
                  className={cn('h-11 w-full rounded-md px-3 text-base md:text-sm')}
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-category-delete-target" className="text-sm">
                  Move links to
                </Label>
                <Select
                  value={categorySettingsViewModel.effectiveDeleteTargetCategoryId}
                  onValueChange={categorySettingsViewModel.setDeleteTargetCategoryId}
                >
                  <SelectTrigger
                    id="settings-category-delete-target"
                    className={cn('h-11 w-full rounded-md px-3 text-base md:text-sm')}
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

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel size="default">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="default"
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
