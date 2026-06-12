// App top bar with branding and global actions.

import { Plus, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { InterfaceSizeConfig } from '@/domain/interface-size'

type AppTopBarProps = {
  interfaceSizeConfig: InterfaceSizeConfig
  onAddLink: () => void
  onOpenPreferences: () => void
}

/** Shows the app brand and global action area. */
export function AppTopBar({ interfaceSizeConfig, onAddLink, onOpenPreferences }: AppTopBarProps) {
  return (
    <header className={interfaceSizeConfig.topBar.className}>
      <div className="flex min-w-0 flex-col">
        <h1 className={interfaceSizeConfig.topBar.titleClassName}>Link Deck</h1>
      </div>

      <div className={interfaceSizeConfig.topBar.actionsClassName}>
        <Button
          type="button"
          variant="outline"
          size={interfaceSizeConfig.control.buttonSize}
          aria-label="Open preferences"
          onClick={() => {
            onOpenPreferences()
          }}
        >
          <Settings2 data-icon="inline-start" aria-hidden="true" />
          Preferences
        </Button>
        <Button
          type="button"
          size={interfaceSizeConfig.control.buttonSize}
          aria-label="Add link"
          onClick={() => {
            onAddLink()
          }}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add link
        </Button>
      </div>
    </header>
  )
}
