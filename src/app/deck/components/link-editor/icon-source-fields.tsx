// Renders the icon source controls for the link editor form.

import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { FileIconInput } from './file-icon-input'
import type { IconMode } from './constants'
import { BuiltinIconField } from '@/components/builtin-icon/builtin-icon-field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { SavedLinkIcon } from '@/domain/deck/icon-types'
import { cn } from '@/lib/utils'

type BuiltinIconValue = Extract<SavedLinkIcon, { type: 'builtin' }>

type IconSourceFieldsProps = {
  displaySizeConfig: DisplaySizeConfig
  iconMode: IconMode
  builtinIcon: BuiltinIconValue | null
  iconUrl: string
  error: string | null
  isSaving: boolean
  currentFileLabel: string
  currentFileMeta: string
  currentFilePreviewUrl: string | null
  isIconFileInvalid: boolean
  onBuiltinIconChange: (icon: BuiltinIconValue) => void
  onIconFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onIconModeChange: (mode: IconMode) => void
  onIconUrlChange: (url: string) => void
}

/** Groups the mutually exclusive icon source inputs under one mode selector. */
export function IconSourceFields({
  displaySizeConfig,
  iconMode,
  builtinIcon,
  iconUrl,
  error,
  isSaving,
  currentFileLabel,
  currentFileMeta,
  currentFilePreviewUrl,
  isIconFileInvalid,
  onBuiltinIconChange,
  onIconFileChange,
  onIconModeChange,
  onIconUrlChange,
}: IconSourceFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className={displaySizeConfig.dialog.gridClassName}>
      <div className={displaySizeConfig.dialog.fieldClassName}>
        <Label htmlFor="link-editor-icon-mode" className={displaySizeConfig.control.labelClassName}>
          {t('linkEditor.icon.source')}
        </Label>
        <Select value={iconMode} disabled={isSaving} onValueChange={value => onIconModeChange(value as IconMode)}>
          <SelectTrigger id="link-editor-icon-mode" className={cn('w-full', displaySizeConfig.control.inputClassName)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="auto">{t('linkEditor.icon.auto')}</SelectItem>
              <SelectItem value="builtin">{t('linkEditor.icon.builtin')}</SelectItem>
              <SelectItem value="url">{t('linkEditor.icon.url')}</SelectItem>
              <SelectItem value="file">{t('linkEditor.icon.file')}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {iconMode === 'auto' ? (
        <p className="self-end text-xs leading-5 text-muted-foreground">{t('linkEditor.icon.autoDescription')}</p>
      ) : null}

      {iconMode === 'builtin' ? (
        <BuiltinIconField
          value={builtinIcon}
          disabled={isSaving}
          displaySizeConfig={displaySizeConfig}
          onChange={onBuiltinIconChange}
        />
      ) : null}

      {iconMode === 'url' ? (
        <div className={displaySizeConfig.dialog.fieldClassName}>
          <Label htmlFor="link-editor-icon-url" className={displaySizeConfig.control.labelClassName}>
            {t('linkEditor.icon.iconUrl')}
          </Label>
          <Input
            id="link-editor-icon-url"
            className={displaySizeConfig.control.inputClassName}
            value={iconUrl}
            type="url"
            placeholder="https://example.com/icon.png"
            disabled={isSaving}
            aria-invalid={!iconUrl.trim() && Boolean(error)}
            onChange={event => onIconUrlChange(event.target.value)}
          />
        </div>
      ) : null}

      {iconMode === 'file' ? (
        <FileIconInput
          displaySizeConfig={displaySizeConfig}
          disabled={isSaving}
          currentFileLabel={currentFileLabel}
          currentFileMeta={currentFileMeta}
          currentFilePreviewUrl={currentFilePreviewUrl}
          isInvalid={isIconFileInvalid}
          onChange={onIconFileChange}
        />
      ) : null}
    </div>
  )
}
