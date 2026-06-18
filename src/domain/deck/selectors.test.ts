// Verifies deck display selectors that drive the visible page sections.

import { describe, expect, it } from 'vitest'

import { selectRenderableSections, selectSearchMatchedSections, sortLinks } from './selectors'
import type { Category, SavedLink, VisibleCategorySection } from './types'

describe('deck selectors', () => {
  it('fills empty categories in category order when search is not active', () => {
    const sections = selectRenderableSections({
      categories: [category('work', 'Work', 2), category('default', 'Default', 1), category('later', 'Later', 3)],
      includeEmptyCategories: true,
      sections: [
        {
          category: category('work', 'Work', 2),
          links: [link('github', 'work', 'GitHub', 1)],
        },
      ],
    })

    expect(sectionSummary(sections)).toEqual([
      ['default', []],
      ['work', ['github']],
      ['later', []],
    ])
  })

  it('keeps only provided sections when search is active', () => {
    const sections = selectRenderableSections({
      categories: [category('default', 'Default', 1), category('later', 'Later', 2)],
      includeEmptyCategories: false,
      sections: [
        {
          category: category('default', 'Default', 1),
          links: [link('chatgpt', 'default', 'ChatGPT', 1)],
        },
      ],
    })

    expect(sectionSummary(sections)).toEqual([['default', ['chatgpt']]])
  })

  it('matches search query against link name, note, url, and category name', () => {
    const categories = [category('tools', 'Tools', 1), category('reading', 'Reading', 2)]
    const links = [
      link('github', 'tools', 'GitHub', 2, {
        note: 'Code hosting',
        url: 'https://github.com/',
      }),
      link('notion', 'tools', 'Notion', 1, {
        note: 'Workspace docs',
        url: 'https://www.notion.so/',
      }),
      link('hacker-news', 'reading', 'Hacker News', 1, {
        note: 'Startup and engineering news',
        url: 'https://news.ycombinator.com/',
      }),
    ]

    expect(sectionSummary(selectSearchMatchedSections(categories, links, 'docs', 'manual'))).toEqual([
      ['tools', ['notion']],
    ])
    expect(sectionSummary(selectSearchMatchedSections(categories, links, 'github.com', 'manual'))).toEqual([
      ['tools', ['github']],
    ])
    expect(sectionSummary(selectSearchMatchedSections(categories, links, 'Tools', 'manual'))).toEqual([
      ['tools', ['notion', 'github']],
    ])
  })

  it('sorts visible links by title and falls back to manual order for equal names', () => {
    const sortedLinks = sortLinks(
      [
        link('z-last', 'default', 'Zed', 1),
        link('alpha-late', 'default', 'Alpha', 4),
        link('alpha-early', 'default', 'Alpha', 2),
      ],
      'name',
    )

    expect(sortedLinks.map(item => item.id)).toEqual(['alpha-early', 'alpha-late', 'z-last'])
  })
})

function sectionSummary(sections: VisibleCategorySection[]): Array<[string, string[]]> {
  return sections.map(section => [section.category.id, section.links.map(item => item.id)])
}

function category(id: string, name: string, order: number): Category {
  return {
    id,
    name,
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function link(
  id: string,
  categoryId: string,
  name: string,
  order: number,
  overrides: Partial<SavedLink> = {},
): SavedLink {
  return {
    id,
    categoryId,
    name,
    url: `https://${id}.example.com/`,
    note: '',
    icon: { type: 'auto' },
    order,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
