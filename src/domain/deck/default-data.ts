// Provides default deck data used on first launch.

import type { SavedLinkIcon } from './icon-types'
import type { Category, DeckDocument, PersistedAppState, SavedLink } from './types'
import { createDefaultCategory } from './categories'
import { DEFAULT_SORT_MODE } from './sort-mode'
import { DEFAULT_DISPLAY_SIZE } from '@/domain/settings/display-size'

const DEFAULT_LINK_BUILTIN_ICONS: Record<string, Extract<SavedLinkIcon, { type: 'builtin' }>> = {
  bilibili: {
    type: 'builtin',
    slug: 'simple-icons:bilibili',
    title: 'Bilibili',
    hex: '00A1D6',
  },
  chatgpt: {
    type: 'builtin',
    slug: 'logos:openai-icon',
    title: 'ChatGPT',
    hex: '000000',
  },
  douyin: {
    type: 'builtin',
    slug: 'custom:douyin-tiktok',
    title: 'Douyin / TikTok',
    hex: '000000',
  },
  excalidraw: {
    type: 'builtin',
    slug: 'simple-icons:excalidraw',
    title: 'Excalidraw',
    hex: '6965DB',
  },
  github: {
    type: 'builtin',
    slug: 'simple-icons:github',
    title: 'GitHub',
    hex: '181717',
  },
  google: {
    type: 'builtin',
    slug: 'material-icon-theme:google',
    title: 'Google',
    hex: '000000',
  },
  'hacker-news': {
    type: 'builtin',
    slug: 'fa6-brands:hacker-news',
    title: 'Hacker News',
    hex: 'FF6600',
  },
  instagram: {
    type: 'builtin',
    slug: 'simple-icons:instagram',
    title: 'Instagram',
    hex: 'FF0069',
  },
  notion: {
    type: 'builtin',
    slug: 'simple-icons:notion',
    title: 'Notion',
    hex: '000000',
  },
  'product-hunt': {
    type: 'builtin',
    slug: 'simple-icons:producthunt',
    title: 'Product Hunt',
    hex: 'DA552F',
  },
  sspai: {
    type: 'builtin',
    slug: 'custom:sspai',
    title: 'Sspai',
    hex: 'DA282A',
  },
  x: {
    type: 'builtin',
    slug: 'simple-icons:x',
    title: 'X',
    hex: '000000',
  },
  xiaohongshu: {
    type: 'builtin',
    slug: 'simple-icons:xiaohongshu',
    title: 'Xiaohongshu',
    hex: 'FF2442',
  },
  youtube: {
    type: 'builtin',
    slug: 'simple-icons:youtube',
    title: 'YouTube',
    hex: 'FF0000',
  },
}

/** Creates a default deck document with a fresh timestamp on every call. */
export function createDefaultDeck(): DeckDocument {
  const now = new Date().toISOString()
  const categories: Category[] = [
    createDefaultCategory(now, 1),
    createCategory('tools', 'Tools', 2, now),
    createCategory('social', 'Social', 3, now),
    createCategory('video', 'Video', 4, now),
    createCategory('discovery', 'Discovery', 5, now),
  ]
  const links: SavedLink[] = [
    createLink({
      id: 'google',
      categoryId: 'default',
      name: 'Google',
      url: 'https://www.google.com/',
      note: 'Search and everyday web access',
      order: 1,
      now,
    }),
    createLink({
      id: 'chatgpt',
      categoryId: 'default',
      name: 'ChatGPT',
      url: 'https://chatgpt.com/',
      note: 'AI assistant and research',
      order: 2,
      now,
    }),
    createLink({
      id: 'notion',
      categoryId: 'tools',
      name: 'Notion',
      url: 'https://www.notion.so/',
      note: 'Notes, docs, and workspace',
      order: 1,
      now,
    }),
    createLink({
      id: 'github',
      categoryId: 'default',
      name: 'GitHub',
      url: 'https://github.com/',
      note: 'Code hosting and collaboration',
      order: 3,
      now,
    }),
    createLink({
      id: 'excalidraw',
      categoryId: 'tools',
      name: 'Excalidraw',
      url: 'https://excalidraw.com/',
      note: 'Sketches, diagrams, and visual thinking',
      order: 2,
      now,
    }),
    createLink({
      id: 'x',
      categoryId: 'social',
      name: 'X.com',
      url: 'https://x.com/',
      note: 'Real-time social updates',
      order: 1,
      now,
    }),
    createLink({
      id: 'instagram',
      categoryId: 'social',
      name: 'Instagram',
      url: 'https://www.instagram.com/',
      note: 'Photos, creators, and social feeds',
      order: 2,
      now,
    }),
    createLink({
      id: 'xiaohongshu',
      categoryId: 'social',
      name: 'Xiaohongshu',
      url: 'https://www.xiaohongshu.com/',
      note: 'Lifestyle search and community posts',
      order: 3,
      now,
    }),
    createLink({
      id: 'youtube',
      categoryId: 'video',
      name: 'YouTube',
      url: 'https://www.youtube.com/',
      note: 'Long-form video and learning',
      order: 1,
      now,
    }),
    createLink({
      id: 'douyin',
      categoryId: 'video',
      name: 'Douyin',
      url: 'https://www.douyin.com/',
      note: 'Short-form video and trends',
      order: 2,
      now,
    }),
    createLink({
      id: 'bilibili',
      categoryId: 'video',
      name: 'Bilibili',
      url: 'https://www.bilibili.com/',
      note: 'Videos, creators, and tech content',
      order: 3,
      now,
    }),
    createLink({
      id: 'hacker-news',
      categoryId: 'discovery',
      name: 'Hacker News',
      url: 'https://news.ycombinator.com/',
      note: 'Startup and engineering news',
      order: 1,
      now,
    }),
    createLink({
      id: 'product-hunt',
      categoryId: 'discovery',
      name: 'Product Hunt',
      url: 'https://www.producthunt.com/',
      note: 'New products and launches',
      order: 2,
      now,
    }),
    createLink({
      id: 'sspai',
      categoryId: 'discovery',
      name: 'Sspai',
      url: 'https://sspai.com/',
      note: 'Digital tools and productivity writing',
      order: 3,
      now,
    }),
  ]

  return {
    id: 'default',
    name: 'Default Deck',
    categories,
    links,
    iconFiles: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates the default persisted deck state with settings attached. */
export function createDefaultPersistedDeck(): PersistedAppState {
  return {
    ...createDefaultDeck(),
    displaySize: DEFAULT_DISPLAY_SIZE,
    sortMode: DEFAULT_SORT_MODE,
  }
}

/** Creates an empty persisted deck with one usable default category. */
export function createEmptyPersistedDeck(now = new Date().toISOString()): PersistedAppState {
  return {
    id: 'local',
    name: 'Local Deck',
    categories: [createDefaultCategory(now)],
    links: [],
    iconFiles: [],
    displaySize: DEFAULT_DISPLAY_SIZE,
    sortMode: DEFAULT_SORT_MODE,
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates a default category with a shared timestamp. */
function createCategory(id: string, name: string, order: number, now: string): Category {
  return {
    id,
    name,
    order,
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates a default link entry that uses automatic icons. */
function createLink(params: {
  id: string
  categoryId: string
  name: string
  url: string
  note: string
  order: number
  now: string
}): SavedLink {
  return {
    id: params.id,
    categoryId: params.categoryId,
    name: params.name,
    url: params.url,
    note: params.note,
    icon: DEFAULT_LINK_BUILTIN_ICONS[params.id] ?? { type: 'auto' },
    order: params.order,
    createdAt: params.now,
    updatedAt: params.now,
  }
}
