// Drag-sorting wrapper that connects the whole link card to dnd-kit sorting.

import { useRef } from 'react'
import { Feedback } from '@dnd-kit/dom'
import { useDragDropMonitor } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'

import { LinkCard } from './link-card'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { DeckLinkHandlers, IconFileLoader } from '@/app/deck/deck-board-types'
import type { SavedLink } from '@/domain/deck/types'

type SortableLinkCardProps = {
  link: SavedLink
  categoryId: string
  index: number
  loadStoredIconFile: IconFileLoader
  displaySizeConfig: DisplaySizeConfig
} & DeckLinkHandlers

/** Lets a link card open on click and participate in sorting while dragged. */
export function SortableLinkCard({
  link,
  categoryId,
  index,
  onOpenLinkInNewWindow,
  onHomeFocusCapture,
  onEditLink,
  onDeleteLink,
  loadStoredIconFile,
  displaySizeConfig,
}: SortableLinkCardProps) {
  const { handleRef, isDragging, ref } = useSortable({
    id: link.id,
    group: categoryId,
    index,
    type: 'link',
    accept: 'link',
    data: {
      categoryId,
      linkId: link.id,
      type: 'link',
    },
    plugins: defaults => [...defaults, Feedback.configure({ feedback: 'clone' })],
    transition: {
      duration: 180,
      easing: 'ease-out',
    },
  })
  const suppressOpenUntilRef = useRef(0)

  useDragDropMonitor({
    onDragStart(event) {
      if (event.operation.source?.id === link.id) {
        suppressOpenUntilRef.current = Number.POSITIVE_INFINITY
      }
    },
    onDragEnd(event) {
      if (event.operation.source?.id === link.id) {
        suppressOpenUntilRef.current = Date.now() + 350
      }
    },
  })

  function setCardRef(element: HTMLDivElement | null): void {
    ref(element)
    handleRef(element)
  }

  function canOpenLink(): boolean {
    return Date.now() >= suppressOpenUntilRef.current
  }

  return (
    <div className="h-full w-full">
      <LinkCard
        link={link}
        onOpenLinkInNewWindow={targetLink => {
          if (!canOpenLink()) {
            return
          }

          onOpenLinkInNewWindow(targetLink)
        }}
        canOpenLink={canOpenLink}
        onHomeFocusCapture={onHomeFocusCapture}
        onEditLink={onEditLink}
        onDeleteLink={onDeleteLink}
        loadStoredIconFile={loadStoredIconFile}
        displaySizeConfig={displaySizeConfig}
        isDragging={isDragging}
        cardDragProps={{
          ref: setCardRef,
        }}
      />
    </div>
  )
}
