// Link card showing a saved link summary with open and menu actions.

import type { HTMLAttributes, KeyboardEvent, MouseEvent, PointerEvent, Ref } from 'react'
import { useRef, useState } from 'react'
import { Copy, Edit3, MoreHorizontal, Trash2 } from 'lucide-react'

import { LinkIcon } from '@/components/link-icon'
import { focusSiblingLinkCard, focusVerticalLinkCard, LINK_CARD_ID_ATTRIBUTE } from '@/components/link-card-keyboard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInterfaceSizeConfig } from '@/domain/interface-size'
import type { IconFile, InterfaceSize, Link } from '@/domain/types'
import { cn } from '@/lib/utils'

type LinkCardProps = {
  link: Link
  onOpenLink: (link: Link, options?: { newWindow?: boolean }) => boolean
  onEditLink: (link: Link) => void
  onDeleteLink: (link: Link) => Promise<void>
  getIconFile: (id: string) => Promise<IconFile | undefined>
  interfaceSize: InterfaceSize
  cardDragProps?: HTMLAttributes<HTMLDivElement> & {
    ref?: Ref<HTMLDivElement>
  }
  isDragging?: boolean
}

/** Checks the platform shortcut that opens the focused card in a new window. */
function isNewWindowShortcut(event: KeyboardEvent<HTMLElement>): boolean {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
}

/** Shows one saved link and provides open and menu actions. */
export function LinkCard({
  link,
  onOpenLink,
  onEditLink,
  onDeleteLink,
  getIconFile,
  interfaceSize,
  cardDragProps,
  isDragging = false,
}: LinkCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteActionRef = useRef<HTMLButtonElement>(null)
  const interfaceSizeConfig = getInterfaceSizeConfig(interfaceSize)
  const cardConfig = interfaceSizeConfig.card
  const { ref: cardDragRef, onKeyDown: keyboardDragListener, ...cardDragAttributes } = cardDragProps ?? {}

  void keyboardDragListener

  /** Triggered by the confirmation dialog before deleting a link; leaves the dialog open on failure so the global error can explain why. */
  async function handleDeleteLink(): Promise<void> {
    if (isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      await onDeleteLink(link)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Failed to delete link', error)
    } finally {
      setIsDeleting(false)
    }
  }

  /** Chooses normal opening or a new window based on click modifier keys. */
  function handleOpenClick(event: MouseEvent<HTMLElement>): void {
    onOpenLink(link, { newWindow: event.metaKey })
  }

  /** Handles Command/Ctrl+Enter before drag sensors or nested controls can consume it. */
  function handleOpenKeyDownCapture(event: KeyboardEvent<HTMLElement>): void {
    if (!isNewWindowShortcut(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onOpenLink(link, { newWindow: true })
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

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
    }
  }

  /** Keeps menu interactions separate from card dragging, keyboard navigation, or link opening. */
  function stopMenuEvent(
    event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement> | PointerEvent<HTMLElement>,
  ): void {
    event.stopPropagation()
  }

  return (
    <article
      ref={cardDragRef}
      {...cardDragAttributes}
      role="button"
      tabIndex={0}
      data-link-card-action="true"
      {...{ [LINK_CARD_ID_ATTRIBUTE]: link.id }}
      aria-label={`Open ${link.name}`}
      aria-keyshortcuts="Meta+Enter Control+Enter Meta+Shift+Backspace Control+Shift+Backspace"
      onClick={handleOpenClick}
      onKeyDownCapture={handleOpenKeyDownCapture}
      onKeyDown={handleOpenKeyDown}
      className={cn(
        'group flex h-full w-full cursor-pointer rounded-md border bg-card text-card-foreground outline-none transition-[background-color,border-color,box-shadow,translate] duration-300 ease-app-hover hover:-translate-y-px hover:border-accent/35 hover:bg-card/95 hover:shadow-[0_12px_26px_-20px_rgb(17_17_17/0.45)] focus-visible:border-ring/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-within:border-ring/50 focus-within:shadow-sm motion-reduce:hover:translate-y-0 motion-reduce:transition-none dark:hover:shadow-[0_12px_28px_-22px_rgb(0_0_0/0.75)]',
        cardDragProps && 'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'border-accent',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center rounded-l-md text-left transition-colors duration-300 ease-app-hover group-hover:bg-secondary/25 motion-reduce:transition-none',
          cardConfig.paddingClassName,
          cardConfig.contentGapClassName,
        )}
      >
        <LinkIcon
          link={link}
          getIconFile={getIconFile}
          wrapperClassName={cardConfig.iconBoxClassName}
          imageClassName={cardConfig.iconImageClassName}
        />
        <span className={cn('flex min-w-0 flex-1 flex-col', cardConfig.textGapClassName)}>
          <span className={cn('truncate', cardConfig.titleClassName)}>{link.name}</span>
          <span className={cardConfig.noteClassName}>{link.note || 'No notes'}</span>
        </span>
      </div>

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
              size={interfaceSizeConfig.control.iconButtonSize}
              aria-label={`More actions for ${link.name}`}
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard?.writeText(link.url).catch((error: unknown) => {
                    console.error('Failed to copy link', error)
                  })
                }}
              >
                <Copy aria-hidden="true" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setDeleteDialogOpen(true)
                }}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={open => {
          if (!isDeleting) {
            setDeleteDialogOpen(open)
          }
        }}
      >
        <AlertDialogContent
          size="default"
          className={interfaceSizeConfig.dialog.contentClassName}
          onOpenAutoFocus={event => {
            event.preventDefault()
            deleteActionRef.current?.focus({ preventScroll: true })
          }}
        >
          <AlertDialogHeader className={interfaceSizeConfig.dialog.headerClassName}>
            <AlertDialogTitle className={interfaceSizeConfig.dialog.titleClassName}>Delete link</AlertDialogTitle>
            <AlertDialogDescription className={cn('wrap-break-word', interfaceSizeConfig.dialog.descriptionClassName)}>
              Delete "{link.name}"? This removes the link from your deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={interfaceSizeConfig.dialog.footerClassName}>
            <AlertDialogCancel size={interfaceSizeConfig.control.buttonSize} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              ref={deleteActionRef}
              variant="destructive"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={isDeleting}
              onClick={event => {
                event.preventDefault()
                void handleDeleteLink()
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
