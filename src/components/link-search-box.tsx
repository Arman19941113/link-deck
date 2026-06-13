// Link search box that filters by saved link title, note, and URL.

import type { KeyboardEvent, Ref } from 'react'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { focusFirstLinkCard } from '@/components/link-card-keyboard'
import type { InterfaceSizeConfig } from '@/domain/interface-size'
import { cn } from '@/lib/utils'

type LinkSearchBoxProps = {
  value: string
  inputRef?: Ref<HTMLInputElement>
  onChange: (value: string) => void
  onFocus?: () => void
  interfaceSizeConfig: InterfaceSizeConfig
}

/** Provides link search input with an icon and clear action. */
export function LinkSearchBox({ value, inputRef, onChange, onFocus, interfaceSizeConfig }: LinkSearchBoxProps) {
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
        Search links
      </label>
      <div className="relative">
        <Search className={interfaceSizeConfig.control.searchIconClassName} aria-hidden="true" />
        <Input
          ref={inputRef}
          id="link-search"
          type="search"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={onFocus}
          autoFocus
          aria-keyshortcuts="Meta+K Control+K"
          placeholder="Search links, notes, or URLs..."
          className={cn(
            'bg-card shadow-none',
            interfaceSizeConfig.control.inputClassName,
            interfaceSizeConfig.control.searchInputClassName,
          )}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size={interfaceSizeConfig.control.iconButtonSize}
            className={interfaceSizeConfig.control.searchClearButtonClassName}
            tabIndex={-1}
            aria-label="Clear search"
            onClick={() => onChange('')}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
