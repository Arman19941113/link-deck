// Coordinates temporary link drag preview state for the deck view.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/react'

import { moveLinkIdsForDragEvent } from '../link-drag-groups'
import {
  areLinkIdsByCategoryIdEqual,
  createLinkDragPreviewSections,
  createLinkIdsByCategoryId,
  getLinkTargetFromCategoryGroups,
  type LinkIdsByCategoryId,
} from '@/domain/deck/link-drag-preview'
import type { Category, VisibleCategorySection, SavedLink } from '@/domain/deck/types'

type UseLinkDragPreviewParams = {
  categories: Category[]
  links: SavedLink[]
  baseSections: VisibleCategorySection[]
  isLinkDragEnabled: boolean
  moveLinkToCategory: (activeLinkId: string, categoryId: string, index: number) => Promise<void>
}

/** Builds visible sections and dnd handlers for manual link sorting previews. */
export function useLinkDragPreview({
  baseSections,
  categories,
  links,
  isLinkDragEnabled,
  moveLinkToCategory,
}: UseLinkDragPreviewParams) {
  const [dragLinkIdsByCategoryId, setDragLinkIdsByCategoryId] = useState<LinkIdsByCategoryId | null>(null)
  const dragLinkIdsByCategoryIdRef = useRef<LinkIdsByCategoryId | null>(null)
  const baseLinkIdsByCategoryId = useMemo(() => createLinkIdsByCategoryId(categories, links), [categories, links])
  const previewSections = useMemo(
    () =>
      dragLinkIdsByCategoryId && isLinkDragEnabled
        ? createLinkDragPreviewSections(categories, links, dragLinkIdsByCategoryId)
        : baseSections,
    [baseSections, categories, dragLinkIdsByCategoryId, isLinkDragEnabled, links],
  )

  useEffect(() => {
    if (!dragLinkIdsByCategoryId || !areLinkIdsByCategoryIdEqual(baseLinkIdsByCategoryId, dragLinkIdsByCategoryId)) {
      return
    }

    resetLinkDragState()
  }, [baseLinkIdsByCategoryId, dragLinkIdsByCategoryId])

  /** Records the initial id groups before sorting starts. */
  function handleLinkDragStart(event: DragStartEvent): void {
    const activeData = getLinkDragData(event.operation.source)

    if (!activeData) {
      return
    }

    dragLinkIdsByCategoryIdRef.current = baseLinkIdsByCategoryId
  }

  /** Updates only lightweight id groups while dnd-kit handles visual clone feedback. */
  function handleLinkDragOver(event: DragOverEvent): void {
    const activeData = getLinkDragData(event.operation.source)

    if (!activeData || !event.operation.target) {
      return
    }

    const currentGroups = dragLinkIdsByCategoryIdRef.current ?? baseLinkIdsByCategoryId
    const nextGroups = moveLinkIdsForDragEvent(currentGroups, event)

    if (areLinkIdsByCategoryIdEqual(currentGroups, nextGroups)) {
      return
    }

    dragLinkIdsByCategoryIdRef.current = nextGroups
    setDragLinkIdsByCategoryId(nextGroups)
  }

  /** Moves a link based on release position after the temporary preview has settled. */
  function handleLinkDragEnd(event: DragEndEvent): void {
    if (!isLinkDragEnabled) {
      resetLinkDragState()
      return
    }

    const activeData = getLinkDragData(event.operation.source)

    if (!activeData) {
      resetLinkDragState()
      return
    }

    if (event.canceled) {
      resetLinkDragState()
      return
    }

    const finalGroups =
      dragLinkIdsByCategoryIdRef.current ??
      (event.operation.target ? moveLinkIdsForDragEvent(baseLinkIdsByCategoryId, event) : baseLinkIdsByCategoryId)
    const finalTarget = getLinkTargetFromCategoryGroups(finalGroups, activeData.linkId)

    if (!finalTarget) {
      resetLinkDragState()
      return
    }

    const initialTarget = getLinkTargetFromCategoryGroups(baseLinkIdsByCategoryId, activeData.linkId)

    if (
      initialTarget &&
      initialTarget.categoryId === finalTarget.categoryId &&
      initialTarget.index === finalTarget.index
    ) {
      resetLinkDragState()
      return
    }

    setDragLinkIdsByCategoryId(finalGroups)

    void moveLinkToCategory(activeData.linkId, finalTarget.categoryId, finalTarget.index).catch(
      (moveError: unknown) => {
        console.error('Failed to move link', moveError)
        resetLinkDragState()
      },
    )
  }

  /** Clears temporary UI state used during link dragging. */
  function resetLinkDragState(): void {
    dragLinkIdsByCategoryIdRef.current = null
    setDragLinkIdsByCategoryId(null)
  }

  return {
    previewSections,
    handleLinkDragEnd,
    handleLinkDragOver,
    handleLinkDragStart,
  }
}

function getLinkDragData(entity: DragStartEvent['operation']['source']) {
  const data = entity?.data

  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    data.type === 'link' &&
    'linkId' in data &&
    typeof data.linkId === 'string'
  ) {
    return data as { categoryId: string; linkId: string; type: 'link' }
  }

  return null
}
