// Verifies deck link drag boundary modifier calculations.

import { describe, expect, it } from 'vite-plus/test'

import { clampDragTransformX } from './link-drag-modifiers'

describe('clampDragTransformX', () => {
  const bounds = {
    left: 100,
    width: 600,
  }

  it('keeps horizontal drag transforms within the deck content bounds', () => {
    expect(clampDragTransformX(-120, 160, 200, bounds)).toBe(-60)
    expect(clampDragTransformX(420, 160, 200, bounds)).toBe(340)
    expect(clampDragTransformX(120, 160, 200, bounds)).toBe(120)
  })
})
