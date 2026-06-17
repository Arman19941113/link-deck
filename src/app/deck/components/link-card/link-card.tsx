// SavedLink card showing a saved link summary with open and menu actions.

import type { HTMLAttributes, KeyboardEvent, MouseEvent, PointerEvent, Ref } from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Edit3, MoreHorizontal, Trash2 } from 'lucide-react'

import { LinkCardIcon } from './link-icon'
import {
  createPostDeleteLinkCardFocus,
  focusSiblingLinkCard,
  focusVerticalLinkCard,
  LINK_CARD_ID_ATTRIBUTE,
} from './link-card-keyboard'
import { DeleteLinkDialog } from '@/app/deck/components/delete-link-dialog'
import { getKeyboardShortcutAriaKeys, matchesKeyboardShortcut } from '@/app/keyboard-shortcuts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SavedLink } from '@/domain/deck/types'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { DeckLinkHandlers, IconFileLoader } from '@/app/deck/deck-board-types'
import { cn } from '@/lib/utils'

type LinkCardProps = {
  link: SavedLink
  loadStoredIconFile: IconFileLoader
  displaySizeConfig: DisplaySizeConfig
  cardDragProps?: HTMLAttributes<HTMLDivElement> & {
    ref?: Ref<HTMLDivElement>
  }
  canOpenLink?: () => boolean
  isDragging?: boolean
} & DeckLinkHandlers

/** Shows one saved link and provides open and menu actions. */
export function LinkCard({
  link,
  onOpenLinkInNewWindow,
  onEditLink,
  onDeleteLink,
  loadStoredIconFile,
  displaySizeConfig,
  cardDragProps,
  canOpenLink,
  isDragging = false,
}: LinkCardProps) {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const linkActionRef = useRef<HTMLAnchorElement>(null)
  const cardConfig = displaySizeConfig.card
  const { ref: cardDragRef, onKeyDown: keyboardDragListener, ...cardDragAttributes } = cardDragProps ?? {}

  void keyboardDragListener

  /** Prevents browser-native anchor navigation during drag-suppressed clicks. */
  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>): void {
    preventIfOpenSuppressed(event)
  }

  /** Prevents middle-click opens during drag-suppressed clicks. */
  function handleLinkAuxClick(event: MouseEvent<HTMLAnchorElement>): void {
    preventIfOpenSuppressed(event)
  }

  function preventIfOpenSuppressed(event: MouseEvent<HTMLAnchorElement>): void {
    if (!event.defaultPrevented && canOpenLink?.() === false) {
      event.preventDefault()
    }
  }

  /** Handles Command/Ctrl+Enter before drag sensors or nested controls can consume it. */
  function handleOpenKeyDownCapture(event: KeyboardEvent<HTMLElement>): void {
    if (isNewWindowShortcut(event)) {
      event.preventDefault()
      event.stopPropagation()
      onOpenLinkInNewWindow(link)
      return
    }

    if (isDeleteLinkShortcut(event)) {
      event.preventDefault()
      event.stopPropagation()
      setDeleteDialogOpen(true)
    }
  }

  /** Supports keyboard-only card navigation and opening. */
  function handleOpenKeyDown(event: KeyboardEvent<HTMLElement>): void {
    if (event.defaultPrevented) {
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      focusSiblingLinkCard(event.currentTarget, event.shiftKey ? -1 : 1, true)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusSiblingLinkCard(event.currentTarget, 1)
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusSiblingLinkCard(event.currentTarget, -1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusVerticalLinkCard(event.currentTarget, 1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusVerticalLinkCard(event.currentTarget, -1)
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
    }
  }

  /** Keeps menu interactions separate from card dragging, keyboard navigation, or link opening. */
  function stopMenuEvent(
    event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement> | PointerEvent<HTMLElement>,
  ): void {
    event.stopPropagation()
  }

  async function handleConfirmDelete(targetLink: SavedLink): Promise<void> {
    const focusAfterDelete = linkActionRef.current ? createPostDeleteLinkCardFocus(linkActionRef.current) : null

    await onDeleteLink(targetLink)
    focusAfterDelete?.()
  }

  return (
    <article
      ref={cardDragRef}
      {...cardDragAttributes}
      className={cn(
        'group flex h-full w-full rounded-md border bg-card text-card-foreground outline-none transition-[background-color,border-color,box-shadow,translate] duration-300 ease-app-hover hover:-translate-y-px hover:border-accent/35 hover:bg-card/95 hover:shadow-(--app-card-hover-shadow) focus-within:border-ring/50 focus-within:shadow-sm has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50 motion-reduce:hover:translate-y-0 motion-reduce:transition-none',
        cardDragProps && 'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'border-accent',
      )}
    >
      <a
        ref={linkActionRef}
        href={link.url}
        target="_blank"
        rel="noopener"
        data-link-card-action="true"
        {...{ [LINK_CARD_ID_ATTRIBUTE]: link.id }}
        aria-label={t('deck.linkCard.open', { name: link.name })}
        aria-keyshortcuts={`${getKeyboardShortcutAriaKeys('openLink')} ${getKeyboardShortcutAriaKeys('deleteLink')}`}
        onClick={handleLinkClick}
        onAuxClick={handleLinkAuxClick}
        onKeyDownCapture={handleOpenKeyDownCapture}
        onKeyDown={handleOpenKeyDown}
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-center rounded-l-md text-left outline-none transition-colors duration-300 ease-app-hover group-hover:bg-secondary/25 motion-reduce:transition-none',
          cardConfig.paddingClassName,
          cardConfig.contentGapClassName,
        )}
      >
        <LinkCardIcon
          link={link}
          loadStoredIconFile={loadStoredIconFile}
          wrapperClassName={cardConfig.iconBoxClassName}
          imageClassName={cardConfig.iconImageClassName}
        />
        <span className={cn('flex min-w-0 flex-1 flex-col', cardConfig.textGapClassName)}>
          <span className={cn('truncate', cardConfig.titleClassName)}>{link.name}</span>
          {link.note ? <span className={cardConfig.noteClassName}>{link.note}</span> : null}
        </span>
      </a>

      <div
        className={cn(
          'flex shrink-0 items-center gap-1 rounded-r-md transition-colors duration-300 ease-app-hover group-hover:bg-secondary/25 motion-reduce:transition-none',
          cardConfig.actionPaddingClassName,
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={displaySizeConfig.control.iconButtonSize}
              aria-label={t('deck.linkCard.moreActions', { name: link.name })}
              tabIndex={-1}
              onClick={stopMenuEvent}
              onKeyDown={stopMenuEvent}
              onPointerDown={stopMenuEvent}
            >
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={stopMenuEvent}
            onKeyDown={stopMenuEvent}
            onPointerDown={stopMenuEvent}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => onEditLink(link)}>
                <Edit3 aria-hidden="true" />
                {t('deck.linkCard.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard?.writeText(link.url).catch((error: unknown) => {
                    console.error('Failed to copy link', error)
                  })
                }}
              >
                <Copy aria-hidden="true" />
                {t('deck.linkCard.copyLink')}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 aria-hidden="true" />
                {t('deck.linkCard.delete')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteLinkDialog
        open={deleteDialogOpen}
        link={link}
        displaySizeConfig={displaySizeConfig}
        onOpenChange={setDeleteDialogOpen}
        onConfirmDelete={handleConfirmDelete}
      />
    </article>
  )
}

/** Checks the platform shortcut that opens the focused card in a new window. */
function isNewWindowShortcut(event: KeyboardEvent<HTMLElement>): boolean {
  return matchesKeyboardShortcut(event, 'openLink')
}

/** Checks the platform shortcut that requests deletion for the focused card. */
function isDeleteLinkShortcut(event: KeyboardEvent<HTMLElement>): boolean {
  return matchesKeyboardShortcut(event, 'deleteLink')
}
