// Data settings panel for backup import/export and destructive replacement actions.

import type { ChangeEvent, ReactNode, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Eraser, RotateCcw, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DataBusyAction, DestructiveDataAction } from './types'

type DataSettingsPanelProps = {
  importFileInputRef: RefObject<HTMLInputElement | null>
  canUseDataControls: boolean
  busyAction: DataBusyAction | null
  onImportRequest: () => void
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onExportDeck: () => void
  onDestructiveDataActionRequest: (action: DestructiveDataAction) => void
}

/** Renders deck backup and replacement controls. */
export function DataSettingsPanel({
  importFileInputRef,
  canUseDataControls,
  busyAction,
  onImportRequest,
  onImportFileChange,
  onExportDeck,
  onDestructiveDataActionRequest,
}: DataSettingsPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <input
        ref={importFileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportFileChange}
      />

      <DataSettingsActionRow title={t('settings.data.importBackup')}>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full sm:w-32"
          disabled={!canUseDataControls}
          onClick={onImportRequest}
        >
          <Upload data-icon="inline-start" aria-hidden="true" />
          {busyAction === 'import' ? t('settings.data.importing') : t('settings.data.import')}
        </Button>
      </DataSettingsActionRow>

      <DataSettingsActionRow title={t('settings.data.exportBackup')}>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full sm:w-32"
          aria-busy={busyAction === 'export'}
          disabled={!canUseDataControls}
          onClick={onExportDeck}
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          {t('settings.data.export')}
        </Button>
      </DataSettingsActionRow>

      <DataSettingsActionRow title={t('settings.data.resetDefaults')}>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full sm:w-32"
          disabled={!canUseDataControls}
          onClick={() => onDestructiveDataActionRequest('reset')}
        >
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          {t('common.reset')}
        </Button>
      </DataSettingsActionRow>

      <DataSettingsActionRow title={t('settings.data.clearData')}>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full sm:w-32"
          disabled={!canUseDataControls}
          onClick={() => onDestructiveDataActionRequest('clear')}
        >
          <Eraser data-icon="inline-start" aria-hidden="true" />
          {t('settings.data.clear')}
        </Button>
      </DataSettingsActionRow>
    </div>
  )
}

type DataSettingsActionRowProps = {
  title: string
  children: ReactNode
}

function DataSettingsActionRow({ title, children }: DataSettingsActionRowProps) {
  return (
    <div className="flex min-h-[3.75rem] flex-col gap-3 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-sm font-medium">{title}</p>
      {children}
    </div>
  )
}
