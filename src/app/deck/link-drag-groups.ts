// Converts dnd-kit link drag events into deck-specific link id groups.

import type { Data, Draggable, Droppable } from '@dnd-kit/abstract'
import { move as moveSortableItems } from '@dnd-kit/helpers'
import type { DragEndEvent, DragOverEvent } from '@dnd-kit/react'

import type { LinkIdsByCategoryId } from '@/domain/deck/link-drag-preview'

type LinkDragEvent = DragOverEvent | DragEndEvent

type LinkDragData = {
  categoryId: string
  linkId: string
  type: 'link'
}

/** Moves link ids using deck grid insertion semantics for cross-category sorting. */
export function moveLinkIdsForDragEvent(
  linkIdsByCategoryId: LinkIdsByCategoryId,
  event: LinkDragEvent,
): LinkIdsByCategoryId {
  const activeData = getLinkDragData(event.operation.source)
  const targetData = getLinkDragData(event.operation.target)

  if (!activeData || !targetData || activeData.categoryId === targetData.categoryId) {
    return moveSortableItems(linkIdsByCategoryId, event)
  }

  const sourceIds = linkIdsByCategoryId[activeData.categoryId]
  const targetIds = linkIdsByCategoryId[targetData.categoryId]

  if (!sourceIds || !targetIds) {
    return moveSortableItems(linkIdsByCategoryId, event)
  }

  const sourceIndex = sourceIds.indexOf(activeData.linkId)
  const targetIndex = targetIds.indexOf(targetData.linkId)

  if (sourceIndex < 0 || targetIndex < 0) {
    return moveSortableItems(linkIdsByCategoryId, event)
  }

  return {
    ...linkIdsByCategoryId,
    [activeData.categoryId]: sourceIds.filter(linkId => linkId !== activeData.linkId),
    [targetData.categoryId]: [...targetIds.slice(0, targetIndex), activeData.linkId, ...targetIds.slice(targetIndex)],
  }
}

function getLinkDragData(entity: Draggable<Data> | Droppable<Data> | null | undefined): LinkDragData | null {
  const data = entity?.data

  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    data.type === 'link' &&
    'categoryId' in data &&
    typeof data.categoryId === 'string' &&
    'linkId' in data &&
    typeof data.linkId === 'string'
  ) {
    return data as LinkDragData
  }

  return null
}
