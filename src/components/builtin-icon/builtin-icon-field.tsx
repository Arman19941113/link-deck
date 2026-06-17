// Form field that shows the current built-in icon and opens the chooser dialog.

import { useMemo, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { getBuiltinIconMetadata, getRandomDefaultBuiltinIcon, type BuiltinIconValue } from './builtin-icon-registry'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

import { BuiltinIconPicker } from './builtin-icon-picker'
import { BuiltinIconPreview } from './builtin-icon-preview'

type BuiltinIconFieldProps = {
  value: BuiltinIconValue | null
  disabled?: boolean
  displaySizeConfig: DisplaySizeConfig
  onChange: (icon: BuiltinIconValue) => void
}

/** Shows the current built-in icon and opens the secondary chooser dialog. */
export function BuiltinIconField({ value, disabled = false, displaySizeConfig, onChange }: BuiltinIconFieldProps) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [draftIcon, setDraftIcon] = useState<BuiltinIconValue | null>(value)
  const selectedIcon = useMemo(() => (value ? getBuiltinIconMetadata(value) : null), [value])

  /** Opens the chooser with the current saved draft value. */
  function openPicker(): void {
    setDraftIcon(value)
    setPickerOpen(true)
  }

  /** Replaces the current icon with a curated random choice. */
  async function handleRandomIcon(): Promise<void> {
    if (disabled) {
      return
    }

    onChange(getRandomDefaultBuiltinIcon(value?.slug))
  }

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
      <div className={displaySizeConfig.dialog.fieldClassName}>
        <Label className={displaySizeConfig.control.labelClassName}>{t('linkEditor.icon.builtin')}</Label>
        <div
          className={cn(
            displaySizeConfig.control.inputClassName,
            'flex items-center gap-3 border border-input bg-card shadow-xs',
            getBuiltinIconActionInsetClassName(displaySizeConfig.control.buttonSize),
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            {selectedIcon ? (
              <BuiltinIconPreview icon={selectedIcon} className="size-5" />
            ) : (
              <span className="size-5 rounded-sm bg-muted" aria-hidden="true" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {value?.title ?? t('linkEditor.icon.noIconSelected')}
              </span>
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size={displaySizeConfig.control.iconButtonSize}
              disabled={disabled}
              className="bg-background"
              aria-label={t('linkEditor.icon.random')}
              onClick={() => void handleRandomIcon()}
            >
              <Shuffle aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size={displaySizeConfig.control.buttonSize}
              disabled={disabled}
              className="bg-background"
              onClick={openPicker}
            >
              {t('common.choose')}
            </Button>
          </div>
        </div>
      </div>

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
}

/** Returns field button spacing that keeps top, bottom, and right inset balanced. */
function getBuiltinIconActionInsetClassName(buttonSize: DisplaySizeConfig['control']['buttonSize']) {
  return buttonSize === 'default' ? 'py-1 pr-[3px] pl-3' : 'py-0.5 pr-px pl-3'
}
