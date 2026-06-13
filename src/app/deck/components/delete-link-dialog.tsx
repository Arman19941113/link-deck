// Shared confirmation dialog for deleting a link from the deck.

import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { SavedLink } from '@/domain/deck/types'
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
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

type DeleteLinkDialogProps = {
  open: boolean
  link: SavedLink | null
  displaySizeConfig: DisplaySizeConfig
  onOpenChange: (open: boolean) => void
  onConfirmDelete: (link: SavedLink) => Promise<void>
}

/** Confirms link deletion and keeps the dialog open when the delete action fails. */
export function DeleteLinkDialog({
  open,
  link,
  displaySizeConfig,
  onOpenChange,
  onConfirmDelete,
}: DeleteLinkDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteActionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setIsDeleting(false)
    }
  }, [open])

  async function handleConfirmDelete(): Promise<void> {
    if (!link || isDeleting) {
      return
    }

    setIsDeleting(true)

    try {
      await onConfirmDelete(link)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete link', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={nextOpen => {
        if (!isDeleting) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <AlertDialogContent
        size="default"
        className={displaySizeConfig.dialog.contentClassName}
        onClick={stopDialogEvent}
        onKeyDown={stopDialogEvent}
        onPointerDown={stopDialogEvent}
        onOpenAutoFocus={event => {
          event.preventDefault()
          deleteActionRef.current?.focus({ preventScroll: true })
        }}
      >
        <AlertDialogHeader className={displaySizeConfig.dialog.headerClassName}>
          <AlertDialogTitle className={displaySizeConfig.dialog.titleClassName}>Delete link</AlertDialogTitle>
          <AlertDialogDescription className={cn('wrap-break-word', displaySizeConfig.dialog.descriptionClassName)}>
            Delete "{link?.name}"? This removes the link from your deck.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={displaySizeConfig.dialog.footerClassName}>
          <AlertDialogCancel size={displaySizeConfig.control.buttonSize} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            ref={deleteActionRef}
            variant="destructive"
            size={displaySizeConfig.control.buttonSize}
            disabled={isDeleting}
            onClick={event => {
              event.preventDefault()
              void handleConfirmDelete()
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function stopDialogEvent(
  event: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement> | PointerEvent<HTMLElement>,
): void {
  event.stopPropagation()
}
