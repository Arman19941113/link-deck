// Drag modifiers for constraining deck link card feedback.

import { configurator } from '@dnd-kit/abstract'
import { Modifier, type DragOperation } from '@dnd-kit/abstract'
import type { DragDropManager } from '@dnd-kit/dom'

type RestrictToElementXAxisOptions = {
  element?: Element | null | ((operation: DragDropManager['dragOperation']) => Element | null)
}

type HorizontalBounds = {
  left: number
  width: number
}

type CachedHorizontalBounds = {
  activatorEvent: Event | null
  bounds: HorizontalBounds
  sourceId: string | symbol | number | null | undefined
  target: Element
}

/** Keeps dragged link cards inside the configured element on the horizontal axis only. */
export class RestrictToElementXAxis extends Modifier<DragDropManager, RestrictToElementXAxisOptions> {
  private cachedBounds: CachedHorizontalBounds | null = null

  apply({ shape, transform }: DragOperation): DragOperation['transform'] {
    const { element } = this.options ?? {}
    const target = typeof element === 'function' ? element(this.manager.dragOperation) : element

    if (!shape || !target) {
      return transform
    }

    const sourceId = this.manager.dragOperation.source?.id
    const boundingRectangle = this.getBounds(target, sourceId, this.manager.dragOperation.activatorEvent)
    const { current, initial } = shape
    const { width } = current.boundingRectangle
    const left = initial.center.x - width / 2

    return {
      ...transform,
      x: clampDragTransformX(transform.x, left, width, boundingRectangle),
    }
  }

  static configure = configurator(RestrictToElementXAxis)

  private getBounds(
    target: Element,
    sourceId: CachedHorizontalBounds['sourceId'],
    activatorEvent: Event | null,
  ): HorizontalBounds {
    if (
      this.cachedBounds &&
      this.cachedBounds.target === target &&
      this.cachedBounds.sourceId === sourceId &&
      this.cachedBounds.activatorEvent === activatorEvent &&
      this.manager.dragOperation.status.initialized
    ) {
      return this.cachedBounds.bounds
    }

    const rectangle = target.getBoundingClientRect()
    const bounds = {
      left: rectangle.left,
      width: rectangle.width,
    }

    this.cachedBounds = {
      activatorEvent,
      bounds,
      sourceId,
      target,
    }

    return bounds
  }
}

export function clampDragTransformX(
  transformX: number,
  initialLeft: number,
  width: number,
  bounds: HorizontalBounds,
): number {
  const minX = bounds.left - initialLeft
  const maxX = bounds.left + bounds.width - (initialLeft + width)

  return Math.min(Math.max(transformX, minX), maxX)
}
