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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <AlertDialog open={pendingDestructiveDataAction !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="max-h-[calc(100svh-2rem)] gap-4 p-6 sm:max-w-xl">
        <AlertDialogHeader className="gap-2">
          <AlertDialogTitle className="text-lg leading-none font-semibold">
            {pendingDestructiveDataAction === 'reset'
              ? t('settings.confirm.resetTitle')
              : t('settings.confirm.clearTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {pendingDestructiveDataAction === 'reset'
              ? t('settings.confirm.resetDescription')
              : t('settings.confirm.clearDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel size="default" disabled={isBusy}>
            {t('common.cancel')}
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
              ? t('settings.confirm.resetting')
              : busyAction === 'clear'
                ? t('settings.confirm.clearing')
                : pendingDestructiveDataAction === 'reset'
                  ? t('common.reset')
                  : t('settings.data.clear')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Renders the category deletion dialog and optional link-handling controls. */
export function CategoryDeleteConfirmDialog({ categorySettingsViewModel }: CategoryDeleteConfirmDialogProps) {
  const { t } = useTranslation()

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
            {t('settings.confirm.deleteCategoryTitle', {
              name: categorySettingsViewModel.pendingDeleteCategory?.name ?? '',
            })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {categorySettingsViewModel.pendingDeleteLinkCount > 0
              ? t('settings.confirm.deleteCategoryWithLinks', {
                  count: categorySettingsViewModel.pendingDeleteLinkCount,
                })
              : t('settings.confirm.deleteCategoryEmpty')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {categorySettingsViewModel.pendingDeleteCategory && categorySettingsViewModel.pendingDeleteLinkCount > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-category-delete-mode" className="text-sm">
                {t('settings.confirm.deleteAction')}
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
                    <SelectItem value="move-links">{t('settings.confirm.moveLinks')}</SelectItem>
                    <SelectItem value="delete-links">{t('settings.confirm.deleteLinksToo')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {categorySettingsViewModel.deleteMode === 'move-links' ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-category-delete-target" className="text-sm">
                  {t('settings.confirm.moveLinksTo')}
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
                    <SelectValue placeholder={t('settings.confirm.selectCategory')} />
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
          <AlertDialogCancel size="default">{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="default"
            onClick={event => {
              event.preventDefault()
              void categorySettingsViewModel.confirmPendingDelete()
            }}
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
