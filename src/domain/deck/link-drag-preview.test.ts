// Verifies pure selectors for temporary link drag ordering previews.

import { describe, expect, it } from 'vite-plus/test'

import { createLinkIdsByCategoryId } from './link-drag-preview'
import type { Category, SavedLink } from './types'

describe('createLinkIdsByCategoryId', () => {
  it('keeps category groups in visual category order', () => {
    const groups = createLinkIdsByCategoryId(
      [category('tools', 'Tools', 2), category('default', 'Default', 1), category('social', 'Social', 3)],
      [link('notion', 'tools', 1), link('github', 'default', 1), link('instagram', 'social', 1)],
    )

    expect(Object.keys(groups)).toEqual(['default', 'tools', 'social'])
  })
})

function category(id: string, name: string, order: number): Category {
  return {
    id,
    name,
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function link(id: string, categoryId: string, order: number): SavedLink {
  return {
    id,
    categoryId,
    name: id,
    url: `https://example.com/${id}`,
    note: '',
    icon: { type: 'auto' },
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}
