// Verifies the main deck page container behavior through rendered user interactions.

import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import i18n from '@/i18n'
import { DeckContainer } from './deck-container'
import { getDisplaySizeConfig } from '@/app/display-size-config'
import type { DeckLinkHandlers, IconFileLoader } from '@/app/deck/deck-board-types'
import type { SettingsTab } from '@/app/settings/types'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, SavedLink } from '@/domain/deck/types'
import { selectSearchMatchedSections } from '@/domain/deck/selectors'

vi.mock('@/domain/deck/pinyin-search-loader', () => ({
  preloadPinyinSearchModule: vi.fn(),
}))

describe('DeckContainer', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh')
  })

  it('renders toolbar, search, links, and empty category add card', () => {
    renderDeck()

    expect(screen.getByRole('heading', { level: 1, name: 'Link Deck' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开设置' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '添加链接' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: '搜索链接' })).toBeInTheDocument()

    expect(screen.getByRole('heading', { level: 2, name: '默认' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '工具' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: '稍后阅读' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: '打开 GitHub' })).toHaveAttribute('href', 'https://github.com/')
    expect(screen.getByRole('link', { name: '打开 Notion' })).toHaveAttribute('href', 'https://www.notion.so/')
    expect(screen.getByRole('button', { name: '保存链接到 稍后阅读' })).toBeInTheDocument()
  })

  it('emits search changes and hides empty categories while query results are shown', () => {
    const { actions, rerenderDeck } = renderDeck()

    fireEvent.change(screen.getByRole('searchbox', { name: '搜索链接' }), { target: { value: 'docs' } })
    expect(actions.onSearchChange).toHaveBeenLastCalledWith('docs')

    rerenderDeck({ query: 'docs' })

    expect(screen.getByRole('link', { name: '打开 Notion' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '打开 GitHub' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: '稍后阅读' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '保存链接到 稍后阅读' })).not.toBeInTheDocument()
  })

  it('shows the no-match empty state for an initialized empty search result', () => {
    renderDeck({ query: 'missing' })

    expect(screen.getByRole('heading', { level: 2, name: '没有找到匹配链接' })).toBeInTheDocument()
    expect(screen.getByText('试试其他关键词。')).toBeInTheDocument()
  })

  it('routes toolbar and category add actions through callbacks', async () => {
    const user = userEvent.setup()
    const { actions } = renderDeck()

    await user.click(screen.getByRole('button', { name: '添加链接' }))
    expect(actions.onCreateLinkFromToolbar).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: '打开设置' }))
    expect(actions.onOpenSettings).toHaveBeenCalledWith()

    await user.click(screen.getByRole('button', { name: '保存链接到 稍后阅读' }))
    expect(actions.onAddLinkToCategory).toHaveBeenCalledWith('reading')
  })

  it('opens settings shortcut tab from the top-bar keyboard shortcut', async () => {
    const user = userEvent.setup()
    const { actions } = renderDeck()

    await user.keyboard('{Control>}/{/Control}')

    expect(actions.onOpenSettings).toHaveBeenCalledWith('shortcuts')
  })

  it('focuses search with shortcut, clears search text, and preloads search module on focus', async () => {
    const user = userEvent.setup()
    const { actions } = renderDeck({ query: 'docs' })
    const searchInput = screen.getByRole('searchbox', { name: '搜索链接' })

    await user.keyboard('{Control>}k{/Control}')
    expect(searchInput).toHaveFocus()
    expect(actions.onSearchFocus).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '清空搜索' }))
    expect(actions.onSearchChange).toHaveBeenCalledWith('')
  })

  it('opens the focused link in a new window through the keyboard shortcut', async () => {
    const user = userEvent.setup()
    const { actions, links } = renderDeck()
    const githubLink = screen.getByRole('link', { name: '打开 GitHub' })

    githubLink.focus()
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(actions.onOpenLinkInNewWindow).toHaveBeenCalledWith(links[0])
  })

  it('edits the focused link through the keyboard shortcut', async () => {
    const user = userEvent.setup()
    const { actions, links } = renderDeck()
    const githubLink = screen.getByRole('link', { name: '打开 GitHub' })

    githubLink.focus()
    await user.keyboard('{Control>}{Shift>}e{/Shift}{/Control}')

    expect(actions.onEditLink).toHaveBeenCalledWith(links[0])
  })

  it('opens link actions from the card context menu without rendering the old more button', async () => {
    const user = userEvent.setup()
    const { actions, links } = renderDeck()
    const githubLink = screen.getByRole('link', { name: '打开 GitHub' })

    expect(screen.queryByRole('button', { name: 'GitHub 的更多操作' })).not.toBeInTheDocument()

    fireEvent.contextMenu(githubLink)
    await user.click(await screen.findByRole('menuitem', { name: '编辑' }))

    expect(actions.onEditLink).toHaveBeenCalledWith(links[0])
  })

  it('renders the empty deck state after initialization when there are no sections', () => {
    renderDeck({
      categories: [],
      links: [],
      query: '',
    })

    expect(screen.getByRole('heading', { level: 2, name: '还没有链接' })).toBeInTheDocument()
    expect(screen.getByText('使用“添加链接”保存第一个链接。')).toBeInTheDocument()
  })
})

type RenderDeckOptions = {
  categories?: Category[]
  links?: SavedLink[]
  query?: string
  sortMode?: SortMode
}

type DeckActionSpies = DeckLinkHandlers & {
  onAddLinkToCategory: ReturnType<typeof vi.fn<(categoryId: string) => void>>
  onCreateLinkFromToolbar: ReturnType<typeof vi.fn<() => void>>
  onMoveLinkToCategory: ReturnType<
    typeof vi.fn<(activeLinkId: string, categoryId: string, index: number) => Promise<void>>
  >
  onOpenSettings: ReturnType<typeof vi.fn<(tab?: SettingsTab) => void>>
  onSearchChange: ReturnType<typeof vi.fn<(query: string) => void>>
  onSearchFocus: ReturnType<typeof vi.fn<() => void>>
}

function renderDeck(options: RenderDeckOptions = {}) {
  const categories = options.categories ?? createCategories()
  const links = options.links ?? createLinks()
  const query = options.query ?? ''
  const sortMode = options.sortMode ?? 'name'
  const filteredSections = selectSearchMatchedSections(categories, links, query, sortMode)
  const actions = createActions()
  const loadStoredIconFile: IconFileLoader = vi.fn()

  const renderResult = render(
    <DeckContainer
      categories={categories}
      links={links}
      designStylePreference="paper"
      displaySizeConfig={getDisplaySizeConfig('normal')}
      error={null}
      initialized
      query={query}
      sortMode={sortMode}
      filteredSections={filteredSections}
      loadStoredIconFile={loadStoredIconFile}
      onAddLinkToCategory={actions.onAddLinkToCategory}
      onCreateLinkFromToolbar={actions.onCreateLinkFromToolbar}
      onDeleteLink={actions.onDeleteLink}
      onEditLink={actions.onEditLink}
      onMoveLinkToCategory={actions.onMoveLinkToCategory}
      onOpenLinkInNewWindow={actions.onOpenLinkInNewWindow}
      onOpenSettings={actions.onOpenSettings}
      onSearchChange={actions.onSearchChange}
      onSearchFocus={actions.onSearchFocus}
    />,
  )

  function rerenderDeck(nextOptions: RenderDeckOptions): void {
    const nextCategories = nextOptions.categories ?? categories
    const nextLinks = nextOptions.links ?? links
    const nextQuery = nextOptions.query ?? query
    const nextSortMode = nextOptions.sortMode ?? sortMode

    renderResult.rerender(
      <DeckContainer
        categories={nextCategories}
        links={nextLinks}
        designStylePreference="paper"
        displaySizeConfig={getDisplaySizeConfig('normal')}
        error={null}
        initialized
        query={nextQuery}
        sortMode={nextSortMode}
        filteredSections={selectSearchMatchedSections(nextCategories, nextLinks, nextQuery, nextSortMode)}
        loadStoredIconFile={loadStoredIconFile}
        onAddLinkToCategory={actions.onAddLinkToCategory}
        onCreateLinkFromToolbar={actions.onCreateLinkFromToolbar}
        onDeleteLink={actions.onDeleteLink}
        onEditLink={actions.onEditLink}
        onMoveLinkToCategory={actions.onMoveLinkToCategory}
        onOpenLinkInNewWindow={actions.onOpenLinkInNewWindow}
        onOpenSettings={actions.onOpenSettings}
        onSearchChange={actions.onSearchChange}
        onSearchFocus={actions.onSearchFocus}
      />,
    )
  }

  return { actions, categories, links, rerenderDeck }
}

function createActions(): DeckActionSpies {
  return {
    onAddLinkToCategory: vi.fn(),
    onCreateLinkFromToolbar: vi.fn(),
    onDeleteLink: vi.fn(),
    onEditLink: vi.fn(),
    onMoveLinkToCategory: vi.fn().mockResolvedValue(undefined),
    onOpenLinkInNewWindow: vi.fn(),
    onOpenSettings: vi.fn(),
    onSearchChange: vi.fn(),
    onSearchFocus: vi.fn(),
  }
}

function createCategories(): Category[] {
  return [category('default', '默认', 1), category('tools', '工具', 2), category('reading', '稍后阅读', 3)]
}

function createLinks(): SavedLink[] {
  return [
    link('github', 'default', 'GitHub', 1, {
      note: '代码托管与协作',
      url: 'https://github.com/',
    }),
    link('notion', 'tools', 'Notion', 1, {
      note: 'Workspace docs',
      url: 'https://www.notion.so/',
    }),
  ]
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
