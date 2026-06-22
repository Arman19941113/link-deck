// Form field that shows the current built-in icon and opens the chooser dialog.

import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getBuiltinIconMetadata, type BuiltinIconValue } from './builtin-icon-registry'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

import { BuiltinIconPicker } from './builtin-icon-picker'
import { BuiltinIconPreviewTile } from './builtin-icon-preview'

type BuiltinIconFieldProps = {
  value: BuiltinIconValue | null
  className?: string
  disabled?: boolean
  displaySizeConfig: DisplaySizeConfig
  onChange: (icon: BuiltinIconValue) => void
}

export type BuiltinIconFieldHandle = {
  openPicker: () => void
}

/** Shows the current built-in icon and opens the secondary chooser dialog. */
export const BuiltinIconField = forwardRef<BuiltinIconFieldHandle, BuiltinIconFieldProps>(function BuiltinIconField(
  { value, className, disabled = false, displaySizeConfig, onChange },
  ref,
) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftIcon, setDraftIcon] = useState<BuiltinIconValue | null>(value)
  const selectedIcon = useMemo(() => (value ? getBuiltinIconMetadata(value) : null), [value])

  /** Opens the chooser with the current saved draft value. */
  const openPicker = useCallback((): void => {
    if (disabled) {
      return
    }

    setDraftIcon(value)
    setPickerOpen(true)
  }, [disabled, value])

  useImperativeHandle(
    ref,
    () => ({
      openPicker,
    }),
    [openPicker],
  )

  /** Commits the icon selected inside the chooser dialog. */
  function handleUseIcon(icon = draftIcon): void {
    if (!icon) {
      return
    }

    onChange(icon)
    setPickerOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          displaySizeConfig.control.inputClassName,
          'flex w-full cursor-pointer items-center gap-3 border border-input bg-card text-left shadow-xs transition-[border-color,box-shadow,opacity] outline-none',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={openPicker}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {selectedIcon ? (
            <BuiltinIconPreviewTile icon={selectedIcon} className="size-6 rounded-sm" iconClassName="size-4" />
          ) : (
            <span className="app-icon-tile size-6 rounded-sm border" aria-hidden="true" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {value?.title ?? t('linkEditor.icon.noIconSelected')}
            </span>
          </span>
        </span>
      </button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          className={cn(
            'grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden',
            displaySizeConfig.dialog.surfaceClassName,
          )}
        >
          <DialogHeader className={displaySizeConfig.dialog.headerClassName}>
            <DialogTitle className={displaySizeConfig.dialog.titleClassName}>
              {t('linkEditor.icon.chooseBuiltinTitle')}
            </DialogTitle>
            <DialogDescription className={displaySizeConfig.dialog.descriptionClassName}>
              {t('linkEditor.icon.chooseBuiltinDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0">
            <BuiltinIconPicker
              value={draftIcon}
              disabled={disabled}
              displaySizeConfig={displaySizeConfig}
              onChange={setDraftIcon}
              onConfirm={handleUseIcon}
            />
          </div>

          <DialogFooter className={displaySizeConfig.dialog.footerClassName}>
            <Button
              type="button"
              variant="outline"
              size={displaySizeConfig.control.buttonSize}
              onClick={() => setPickerOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              size={displaySizeConfig.control.buttonSize}
              disabled={!draftIcon}
              onClick={() => handleUseIcon()}
            >
              {t('linkEditor.icon.useIcon')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})
