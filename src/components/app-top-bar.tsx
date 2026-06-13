// App top bar with branding and global actions.

import { Plus, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DisplaySizeConfig } from '@/domain/display-size'

type AppTopBarProps = {
  displaySizeConfig: DisplaySizeConfig
  onAddLink: () => void
  onOpenSettings: () => void
}

/** Shows the app brand and global action area. */
export function AppTopBar({ displaySizeConfig, onAddLink, onOpenSettings }: AppTopBarProps) {
  return (
    <header className={displaySizeConfig.topBar.className}>
      <div className="flex min-w-0 flex-col">
        <h1 className={displaySizeConfig.topBar.titleClassName}>Link Deck</h1>
      </div>

      <div className={displaySizeConfig.topBar.actionsClassName}>
        <Button
          type="button"
          variant="outline"
          size={displaySizeConfig.control.buttonSize}
          aria-label="Open settings"
          onClick={() => {
            onOpenSettings()
          }}
        >
          <Settings2 data-icon="inline-start" aria-hidden="true" />
          Settings
        </Button>
        <Button
          type="button"
          size={displaySizeConfig.control.buttonSize}
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
