// SavedLink search box that filters by saved link title, note, and URL.

import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { focusFirstLinkCard } from '@/app/deck/components/link-card'
import { getKeyboardShortcutAriaKeys, matchesKeyboardShortcut } from '@/app/keyboard-shortcuts'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { preloadPinyinSearchModule } from '@/domain/deck/pinyin-search-loader'
import { cn } from '@/lib/utils'

type LinkSearchBoxProps = {
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  displaySizeConfig: DisplaySizeConfig
}

/** Provides link search input with an icon and clear action. */
export function LinkSearchBox({ value, onChange, onFocus, displaySizeConfig }: LinkSearchBoxProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleSearchShortcut(event: globalThis.KeyboardEvent): void {
      if (isModalOpen() || !matchesKeyboardShortcut(event, 'search')) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus({ preventScroll: true })
      inputRef.current?.select()
      preloadPinyinSearchModule()
    }

    window.addEventListener('keydown', handleSearchShortcut)

    return () => {
      window.removeEventListener('keydown', handleSearchShortcut)
    }
  }, [])

  /** Sends Tab from search directly into the link-card list. */
  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Tab' || event.shiftKey) {
      return
    }

    if (focusFirstLinkCard()) {
      event.preventDefault()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="link-search" className="sr-only">
        {t('deck.search.label')}
      </label>
      <div className="relative">
        <Search className={displaySizeConfig.control.searchIconClassName} aria-hidden="true" />
        <Input
          ref={inputRef}
          id="link-search"
          type="search"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={onFocus}
          autoFocus
          aria-keyshortcuts={`${getKeyboardShortcutAriaKeys('search')} ${getKeyboardShortcutAriaKeys('createLink')}`}
          placeholder={t('deck.search.placeholder')}
          className={cn(
            'bg-(--app-search-bg)! shadow-none',
            displaySizeConfig.control.inputClassName,
            displaySizeConfig.control.searchInputClassName,
          )}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size={displaySizeConfig.control.iconButtonSize}
            className={displaySizeConfig.control.searchClearButtonClassName}
            tabIndex={-1}
            aria-label={t('deck.search.clear')}
            onClick={() => onChange('')}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/** Checks whether global search focus should wait for the active modal interaction to finish. */
function isModalOpen(): boolean {
  return Boolean(document.querySelector('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]'))
}
