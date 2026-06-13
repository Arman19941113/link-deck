// Data settings panel for backup import/export and destructive replacement actions.

import type { ChangeEvent, ReactNode, RefObject } from 'react'
import { Download, Eraser, RotateCcw, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { DataBusyAction, DestructiveDataAction } from './types'
import { cn } from '@/lib/utils'

type DataSettingsPanelProps = {
  displaySizeConfig: DisplaySizeConfig
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
  displaySizeConfig,
  importFileInputRef,
  canUseDataControls,
  busyAction,
  onImportRequest,
  onImportFileChange,
  onExportDeck,
  onDestructiveDataActionRequest,
}: DataSettingsPanelProps) {
  return (
    <div className={cn('max-w-xl', displaySizeConfig.dialog.formClassName)}>
      <input
        ref={importFileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportFileChange}
      />

      <DataSettingsActionRow title="Import backup">
        <Button
          type="button"
          variant="outline"
          size={displaySizeConfig.control.buttonSize}
          className="w-full sm:w-32"
          disabled={!canUseDataControls}
          onClick={onImportRequest}
        >
          <Upload data-icon="inline-start" aria-hidden="true" />
          {busyAction === 'import' ? 'Importing…' : 'Import'}
        </Button>
      </DataSettingsActionRow>

      <DataSettingsActionRow title="Export backup">
        <Button
          type="button"
          variant="outline"
          size={displaySizeConfig.control.buttonSize}
          className="w-full sm:w-32"
          aria-busy={busyAction === 'export'}
          disabled={!canUseDataControls}
          onClick={onExportDeck}
        >
          <Download data-icon="inline-start" aria-hidden="true" />
          Export
        </Button>
      </DataSettingsActionRow>

      <DataSettingsActionRow title="Reset to defaults">
        <Button
          type="button"
          variant="outline"
          size={displaySizeConfig.control.buttonSize}
          className="w-full sm:w-32"
          disabled={!canUseDataControls}
          onClick={() => onDestructiveDataActionRequest('reset')}
        >
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Reset
        </Button>
      </DataSettingsActionRow>

      <DataSettingsActionRow title="Clear data">
        <Button
          type="button"
          variant="outline"
          size={displaySizeConfig.control.buttonSize}
          className="w-full sm:w-32"
          disabled={!canUseDataControls}
          onClick={() => onDestructiveDataActionRequest('clear')}
        >
          <Eraser data-icon="inline-start" aria-hidden="true" />
          Clear data
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
    <div className="flex flex-col gap-3 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-sm font-medium">{title}</p>
      {children}
    </div>
  )
}
