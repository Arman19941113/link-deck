// Renders the icon source controls for the link editor form.

import type { ChangeEvent } from 'react'
import { useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { Image, Monitor, Sparkles, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { FileIconInput, type FileIconInputHandle } from './file-icon-input'
import type { IconMode } from './constants'
import { SegmentedSettingsPicker } from '@/app/settings/components/segmented-settings-picker'
import { BuiltinIconField, type BuiltinIconFieldHandle } from '@/components/builtin-icon/builtin-icon-field'
import { Input } from '@/components/ui/input'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { SavedLinkIcon } from '@/domain/deck/icon-types'
import { cn } from '@/lib/utils'

type BuiltinIconValue = Extract<SavedLinkIcon, { type: 'builtin' }>

type IconSourceFieldsProps = {
  displaySizeConfig: DisplaySizeConfig
  fieldClassName: string
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

const ICON_SOURCE_OPTIONS = [{ value: 'auto' }, { value: 'builtin' }, { value: 'url' }, { value: 'file' }] satisfies {
  value: IconMode
}[]

const ICON_SOURCE_ICONS = {
  auto: Monitor,
  builtin: Sparkles,
  url: Image,
  file: Upload,
} satisfies Record<IconMode, typeof Monitor>

/** Groups the mutually exclusive icon source inputs under one mode selector. */
export function IconSourceFields({
  displaySizeConfig,
  fieldClassName,
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
  const builtinFieldRef = useRef<BuiltinIconFieldHandle | null>(null)
  const fileInputRef = useRef<FileIconInputHandle | null>(null)
  const iconUrlInputRef = useRef<HTMLInputElement | null>(null)
  const iconSourceOptions = useMemo(
    () =>
      ICON_SOURCE_OPTIONS.map(option => ({
        value: option.value,
        label: t(`linkEditor.icon.${option.value}`),
      })),
    [t],
  )

  /** Changes the active icon source and triggers the relevant direct input action once it is visible. */
  function handleIconModeChange(nextIconMode: IconMode): void {
    if (nextIconMode === iconMode) {
      return
    }

    flushSync(() => {
      onIconModeChange(nextIconMode)
    })

    if (isSaving) {
      return
    }

    if (nextIconMode === 'builtin') {
      builtinFieldRef.current?.openPicker()
      return
    }

    if (nextIconMode === 'url') {
      iconUrlInputRef.current?.focus()
      return
    }

    if (nextIconMode === 'file') {
      fileInputRef.current?.openFilePicker()
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <SegmentedSettingsPicker
        id="link-editor-icon-mode-label"
        label={t('linkEditor.icon.source')}
        name="link-editor-icon-mode"
        options={iconSourceOptions}
        value={iconMode}
        labelClassName={displaySizeConfig.control.labelClassName}
        controlClassName={fieldClassName}
        disabled={isSaving}
        onChange={handleIconModeChange}
        renderOptionContent={(option, isSelected) => {
          const Icon = ICON_SOURCE_ICONS[option.value]

          return (
            <>
              <Icon className={cn('size-4 shrink-0', isSelected && 'text-accent')} aria-hidden="true" />
              <span className="truncate">{option.label}</span>
            </>
          )
        }}
      />

      <div className="flex h-9 flex-col justify-center">
        {iconMode === 'auto' ? (
          <p className="text-xs leading-5 text-muted-foreground">{t('linkEditor.icon.autoDescription')}</p>
        ) : null}

        {iconMode === 'builtin' ? (
          <BuiltinIconField
            ref={builtinFieldRef}
            value={builtinIcon}
            disabled={isSaving}
            displaySizeConfig={displaySizeConfig}
            className={fieldClassName}
            onChange={onBuiltinIconChange}
          />
        ) : null}

        {iconMode === 'url' ? (
          <Input
            ref={iconUrlInputRef}
            id="link-editor-icon-url"
            className={cn(displaySizeConfig.control.inputClassName, fieldClassName)}
            value={iconUrl}
            type="url"
            placeholder="https://example.com/icon.png"
            disabled={isSaving}
            aria-label={t('linkEditor.icon.iconUrl')}
            aria-invalid={!iconUrl.trim() && Boolean(error)}
            onChange={event => onIconUrlChange(event.target.value)}
          />
        ) : null}

        {iconMode === 'file' ? (
          <FileIconInput
            ref={fileInputRef}
            displaySizeConfig={displaySizeConfig}
            disabled={isSaving}
            currentFileLabel={currentFileLabel}
            currentFileMeta={currentFileMeta}
            currentFilePreviewUrl={currentFilePreviewUrl}
            isInvalid={isIconFileInvalid}
            className={fieldClassName}
            onChange={onIconFileChange}
          />
        ) : null}
      </div>
    </div>
  )
}
