// Settings dialog shell for display options and immediate category editing.

import { Dialog } from '@/components/ui/dialog'
import { SettingsDialogController, type SettingsDialogControllerProps } from './settings-dialog-controller'

type SettingsDialogProps = SettingsDialogControllerProps & {
  open: boolean
}

/** Settings dialog shell that resets internal edit state with a key. */
export function SettingsDialog({ open, initialTab = 'general', onOpenChange, ...contentProps }: SettingsDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (nextOpen) {
          onOpenChange(true)
        }
      }}
    >
      <SettingsDialogController
        key={`${open ? 'open' : 'closed'}-${initialTab}`}
        initialTab={initialTab}
        onOpenChange={onOpenChange}
        {...contentProps}
      />
    </Dialog>
  )
}
