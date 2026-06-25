// Verifies deck-specific link drag group calculations for grid sorting.

import { describe, expect, it } from 'vite-plus/test'

import { moveLinkIdsForDragEvent } from './link-drag-groups'
import type { LinkIdsByCategoryId } from '@/domain/deck/link-drag-preview'
import type { DragOverEvent } from '@dnd-kit/react'

describe('moveLinkIdsForDragEvent', () => {
  it('moves a lower-category link before the hovered card when dragging upward into a row', () => {
    const groups: LinkIdsByCategoryId = {
      default: ['google', 'chatgpt', 'github'],
      tools: ['notion', 'excalidraw'],
    }

    const nextGroups = moveLinkIdsForDragEvent(
      groups,
      createCrossCategoryDragOverEvent({
        activeCategoryId: 'tools',
        activeId: 'excalidraw',
        center: {
          x: 740,
          y: 390,
        },
        targetCategoryId: 'default',
        targetId: 'chatgpt',
        targetRect: {
          width: 480,
          height: 126,
          left: 496,
          right: 976,
          top: 290,
          bottom: 416,
        },
      }),
    )

    expect(nextGroups.default).toEqual(['google', 'excalidraw', 'chatgpt', 'github'])
    expect(nextGroups.tools).toEqual(['notion'])
  })

  it('moves an upper-category link before the hovered card when dragging downward into a row', () => {
    const groups: LinkIdsByCategoryId = {
      default: ['google', 'chatgpt', 'github'],
      tools: ['notion', 'excalidraw'],
      social: ['x', 'instagram', 'xiaohongshu'],
    }

    const nextGroups = moveLinkIdsForDragEvent(
      groups,
      createCrossCategoryDragOverEvent({
        activeCategoryId: 'tools',
        activeId: 'excalidraw',
        center: {
          x: 760,
          y: 690,
        },
        targetCategoryId: 'social',
        targetId: 'instagram',
        targetRect: {
          width: 480,
          height: 126,
          left: 500,
          right: 980,
          top: 670,
          bottom: 796,
        },
      }),
    )

    expect(nextGroups.tools).toEqual(['notion'])
    expect(nextGroups.social).toEqual(['x', 'excalidraw', 'instagram', 'xiaohongshu'])
  })

  it('moves a link before the hovered card when dragging upward into a horizontal grid row', () => {
    const groups: LinkIdsByCategoryId = {
      default: ['github', 'google', 'instagram', 'x', 'youtube', 'notion', 'chatgpt', 'xiaohongshu'],
      social: ['bilibili'],
    }

    const nextGroups = moveLinkIdsForDragEvent(
      groups,
      createCrossCategoryDragOverEvent({
        activeCategoryId: 'social',
        activeId: 'bilibili',
        center: {
          x: 620,
          y: 540,
        },
        targetCategoryId: 'default',
        targetId: 'notion',
        targetRect: {
          width: 480,
          height: 126,
          left: 560,
          right: 1040,
          top: 456,
          bottom: 582,
        },
      }),
    )

    expect(nextGroups.default).toEqual([
      'github',
      'google',
      'instagram',
      'x',
      'youtube',
      'bilibili',
      'notion',
      'chatgpt',
      'xiaohongshu',
    ])
    expect(nextGroups.social).toEqual([])
  })
})

type CrossCategoryDragOverEventOptions = {
  activeCategoryId: string
  activeId: string
  center: {
    x: number
    y: number
  }
  targetCategoryId: string
  targetId: string
  targetRect: {
    width: number
    height: number
    left: number
    right: number
    top: number
    bottom: number
  }
}

function createCrossCategoryDragOverEvent({
  activeCategoryId,
  activeId,
  center,
  targetCategoryId,
  targetId,
  targetRect,
}: CrossCategoryDragOverEventOptions): DragOverEvent {
  return {
    operation: {
      source: {
        id: activeId,
        data: {
          categoryId: activeCategoryId,
          linkId: activeId,
          type: 'link',
        },
        manager: {
          dragOperation: {
            position: {
              current: center,
            },
            shape: {
              current: {
                center,
              },
            },
          },
        },
      },
      target: {
        id: targetId,
        data: {
          categoryId: targetCategoryId,
          linkId: targetId,
          type: 'link',
        },
        shape: {
          boundingRectangle: targetRect,
          center: {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2,
          },
        },
      },
      canceled: false,
    },
    preventDefault: () => {},
  } as unknown as DragOverEvent
}
