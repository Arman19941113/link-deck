// App top bar with branding and global actions.

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { matchesKeyboardShortcut } from '@/app/keyboard-shortcuts'
import type { SettingsTab } from '@/app/settings/types'
import { DESIGN_STYLE_ASSETS, type DesignStylePreference } from '@/domain/settings/design-style'
import { cn } from '@/lib/utils'

const GITHUB_REPOSITORY_URL = 'https://github.com/Arman19941113/link-deck'

type DeckToolbarProps = {
  designStylePreference: DesignStylePreference
  displaySizeConfig: DisplaySizeConfig
  onAddLink: () => void
  onDialogTriggerPointerDown?: () => void
  onOpenSettings: (tab?: SettingsTab) => void
}

/** Shows the app brand and global action area. */
export function DeckToolbar({
  designStylePreference,
  displaySizeConfig,
  onAddLink,
  onDialogTriggerPointerDown,
  onOpenSettings,
}: DeckToolbarProps) {
  const { t } = useTranslation()

  useEffect(() => {
    function handleTopBarShortcut(event: KeyboardEvent): void {
      if (isModalOpen()) {
        return
      }

      if (matchesKeyboardShortcut(event, 'keyboardShortcuts')) {
        event.preventDefault()
        onOpenSettings('shortcuts')
        return
      }

      if (!matchesKeyboardShortcut(event, 'createLink') || shouldIgnoreCreateLinkShortcut(event.target)) {
        return
      }

      event.preventDefault()
      onAddLink()
    }

    window.addEventListener('keydown', handleTopBarShortcut)

    return () => {
      window.removeEventListener('keydown', handleTopBarShortcut)
    }
  }, [onAddLink, onOpenSettings])

  return (
    <header className={displaySizeConfig.topBar.className}>
      <a
        href={GITHUB_REPOSITORY_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={t('deck.toolbar.openRepository')}
        className="flex min-w-0 items-center gap-3 rounded-md outline-none transition-opacity duration-200 ease-app-hover hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
      >
        <img
          src={`${import.meta.env.BASE_URL}${DESIGN_STYLE_ASSETS[designStylePreference].logo}`}
          alt=""
          aria-hidden="true"
          className={cn('shrink-0', displaySizeConfig.topBar.iconClassName)}
        />
        <h1 className={displaySizeConfig.topBar.titleClassName}>{t('app.name')}</h1>
      </a>

      <div className={displaySizeConfig.topBar.actionsClassName}>
        <Button
          type="button"
          variant="outline"
          size={displaySizeConfig.control.buttonSize}
          aria-label={t('deck.toolbar.openSettings')}
          onPointerDown={onDialogTriggerPointerDown}
          onClick={() => {
            onOpenSettings()
          }}
        >
          <Settings2 data-icon="inline-start" aria-hidden="true" />
          {t('deck.toolbar.settings')}
        </Button>
        <Button
          type="button"
          size={displaySizeConfig.control.buttonSize}
          aria-label={t('deck.toolbar.addLink')}
          onPointerDown={onDialogTriggerPointerDown}
          onClick={() => {
            onAddLink()
          }}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          {t('deck.toolbar.addLink')}
        </Button>
      </div>
    </header>
  )
}

/** Checks whether the create-link shortcut should avoid hijacking editable text input. */
function shouldIgnoreCreateLinkShortcut(target: EventTarget | null): boolean {
  return isEditableShortcutTarget(target) && !isSearchInputTarget(target)
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function isSearchInputTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.id === 'link-search'
}

/** Checks whether top-bar shortcuts should wait for the active modal interaction to finish. */
function isModalOpen(): boolean {
  return Boolean(document.querySelector('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]'))
}
