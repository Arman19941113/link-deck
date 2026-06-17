// Renders the local file chooser used by the link editor icon source fields.

import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload } from 'lucide-react'

import { ICON_FILE_ACCEPT } from './constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

type FileIconInputProps = {
  displaySizeConfig: DisplaySizeConfig
  disabled: boolean
  currentFileLabel: string
  currentFileMeta: string
  currentFilePreviewUrl: string | null
  isInvalid: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/** Displays the current file icon preview and forwards file input changes to form state. */
export function FileIconInput({
  displaySizeConfig,
  disabled,
  currentFileLabel,
  currentFileMeta,
  currentFilePreviewUrl,
  isInvalid,
  onChange,
}: FileIconInputProps) {
  const { t } = useTranslation()

  return (
    <div className={displaySizeConfig.dialog.fieldClassName}>
      <Label htmlFor="link-editor-icon-file" className={displaySizeConfig.control.labelClassName}>
        {t('linkEditor.icon.file')}
      </Label>
      <Input
        id="link-editor-icon-file"
        className="peer sr-only"
        type="file"
        accept={ICON_FILE_ACCEPT}
        disabled={disabled}
        aria-invalid={isInvalid}
        onChange={onChange}
      />
      <Label
        htmlFor="link-editor-icon-file"
        className={cn(
          displaySizeConfig.control.inputClassName,
          'flex cursor-pointer items-center gap-3 border border-input bg-card shadow-xs transition-[border-color,box-shadow,opacity]',
          'peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50',
          disabled && 'cursor-not-allowed opacity-50',
          isInvalid && 'border-destructive ring-[3px] ring-destructive/20 dark:ring-destructive/40',
        )}
      >
        <div className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted text-muted-foreground">
          {currentFilePreviewUrl ? (
            <img src={currentFilePreviewUrl} alt="" className="size-full object-cover" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
        </div>
        {currentFileLabel ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm leading-tight font-medium">{currentFileLabel}</p>
            {currentFileMeta ? (
              <p className="shrink-0 text-xs leading-5 text-muted-foreground">{currentFileMeta}</p>
            ) : null}
          </div>
        ) : (
          <p className="min-w-0 flex-1 truncate text-sm leading-tight font-medium">{t('linkEditor.icon.chooseFile')}</p>
        )}
      </Label>
    </div>
  )
}
