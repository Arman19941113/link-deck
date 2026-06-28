// Provides default deck data used on first launch.

import type { SavedLinkIcon } from './icon-types'
import type { Category, DeckDocument, PersistedAppState, SavedLink } from './types'
import { createDefaultCategory } from './categories'
import type { AppLanguage } from '@/domain/settings/language'

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
  feishu: {
    type: 'builtin',
    slug: 'custom:feishu',
    title: 'Feishu',
    hex: '3370FF',
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

type DefaultCategorySeed = {
  id: string
  name: string
  order: number
}

type DefaultLinkSeed = {
  id: string
  categoryId: string
  name: string
  url: string
  order: number
}

type DefaultDeckSeed = {
  deckName: string
  defaultCategoryName: string
  emptyDeckName: string
  categories: DefaultCategorySeed[]
  links: DefaultLinkSeed[]
}

const DEFAULT_DECK_SEEDS: Record<AppLanguage, DefaultDeckSeed> = {
  en: {
    deckName: 'Default Deck',
    defaultCategoryName: 'Default',
    emptyDeckName: 'Local Deck',
    categories: [
      { id: 'tools', name: 'Tools', order: 2 },
      { id: 'social', name: 'Social', order: 3 },
      { id: 'video', name: 'Video', order: 4 },
      { id: 'discovery', name: 'Discovery', order: 5 },
    ],
    links: [
      {
        id: 'google',
        categoryId: 'default',
        name: 'Google',
        url: 'https://www.google.com/',
        order: 1,
      },
      {
        id: 'chatgpt',
        categoryId: 'default',
        name: 'ChatGPT',
        url: 'https://chatgpt.com/',
        order: 2,
      },
      {
        id: 'github',
        categoryId: 'default',
        name: 'GitHub',
        url: 'https://github.com/',
        order: 3,
      },
      {
        id: 'feishu',
        categoryId: 'tools',
        name: 'Feishu',
        url: 'https://my.feishu.cn/',
        order: 1,
      },
      {
        id: 'notion',
        categoryId: 'tools',
        name: 'Notion',
        url: 'https://www.notion.so/',
        order: 2,
      },
      {
        id: 'excalidraw',
        categoryId: 'tools',
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        order: 3,
      },
      {
        id: 'x',
        categoryId: 'social',
        name: 'X.com',
        url: 'https://x.com/',
        order: 1,
      },
      {
        id: 'instagram',
        categoryId: 'social',
        name: 'Instagram',
        url: 'https://www.instagram.com/',
        order: 2,
      },
      {
        id: 'xiaohongshu',
        categoryId: 'social',
        name: 'Xiaohongshu',
        url: 'https://www.xiaohongshu.com/',
        order: 3,
      },
      {
        id: 'youtube',
        categoryId: 'video',
        name: 'YouTube',
        url: 'https://www.youtube.com/',
        order: 1,
      },
      {
        id: 'douyin',
        categoryId: 'video',
        name: 'Douyin',
        url: 'https://www.douyin.com/',
        order: 2,
      },
      {
        id: 'bilibili',
        categoryId: 'video',
        name: '哔哩哔哩',
        url: 'https://www.bilibili.com/',
        order: 3,
      },
      {
        id: 'hacker-news',
        categoryId: 'discovery',
        name: 'Hacker News',
        url: 'https://news.ycombinator.com/',
        order: 1,
      },
      {
        id: 'product-hunt',
        categoryId: 'discovery',
        name: 'Product Hunt',
        url: 'https://www.producthunt.com/',
        order: 2,
      },
      {
        id: 'sspai',
        categoryId: 'discovery',
        name: 'Sspai',
        url: 'https://sspai.com/',
        order: 3,
      },
    ],
  },
  zh: {
    deckName: '默认链接面板',
    defaultCategoryName: '默认',
    emptyDeckName: '本地链接面板',
    categories: [
      { id: 'tools', name: '工具', order: 2 },
      { id: 'social', name: '社交', order: 3 },
      { id: 'video', name: '视频', order: 4 },
      { id: 'discovery', name: '发现', order: 5 },
    ],
    links: [
      {
        id: 'google',
        categoryId: 'default',
        name: 'Google',
        url: 'https://www.google.com/',
        order: 1,
      },
      {
        id: 'chatgpt',
        categoryId: 'default',
        name: 'ChatGPT',
        url: 'https://chatgpt.com/',
        order: 2,
      },
      {
        id: 'github',
        categoryId: 'default',
        name: 'GitHub',
        url: 'https://github.com/',
        order: 3,
      },
      {
        id: 'feishu',
        categoryId: 'tools',
        name: '飞书',
        url: 'https://my.feishu.cn/',
        order: 1,
      },
      {
        id: 'notion',
        categoryId: 'tools',
        name: 'Notion',
        url: 'https://www.notion.so/',
        order: 2,
      },
      {
        id: 'excalidraw',
        categoryId: 'tools',
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        order: 3,
      },
      {
        id: 'x',
        categoryId: 'social',
        name: 'X.com',
        url: 'https://x.com/',
        order: 1,
      },
      {
        id: 'instagram',
        categoryId: 'social',
        name: 'Instagram',
        url: 'https://www.instagram.com/',
        order: 2,
      },
      {
        id: 'xiaohongshu',
        categoryId: 'social',
        name: '小红书',
        url: 'https://www.xiaohongshu.com/',
        order: 3,
      },
      {
        id: 'youtube',
        categoryId: 'video',
        name: 'YouTube',
        url: 'https://www.youtube.com/',
        order: 1,
      },
      {
        id: 'douyin',
        categoryId: 'video',
        name: '抖音',
        url: 'https://www.douyin.com/',
        order: 2,
      },
      {
        id: 'bilibili',
        categoryId: 'video',
        name: 'Bilibili',
        url: 'https://www.bilibili.com/',
        order: 3,
      },
      {
        id: 'hacker-news',
        categoryId: 'discovery',
        name: 'Hacker News',
        url: 'https://news.ycombinator.com/',
        order: 1,
      },
      {
        id: 'product-hunt',
        categoryId: 'discovery',
        name: 'Product Hunt',
        url: 'https://www.producthunt.com/',
        order: 2,
      },
      {
        id: 'sspai',
        categoryId: 'discovery',
        name: '少数派',
        url: 'https://sspai.com/',
        order: 3,
      },
    ],
  },
}

/** Creates a default deck document with a fresh timestamp on every call. */
export function createDefaultDeck(language: AppLanguage = 'en'): DeckDocument {
  const now = new Date().toISOString()
  const seed = DEFAULT_DECK_SEEDS[language]
  const categories: Category[] = [
    createDefaultCategory(now, 1, seed.defaultCategoryName),
    ...seed.categories.map(category => createCategory(category.id, category.name, category.order, now)),
  ]
  const links = seed.links.map(link => createLink({ ...link, now }))

  return {
    id: 'default',
    name: seed.deckName,
    categories,
    links,
    iconFiles: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates the default persisted deck state. */
export function createDefaultPersistedDeck(language: AppLanguage = 'en'): PersistedAppState {
  return createDefaultDeck(language)
}

/** Creates an empty persisted deck with one usable default category. */
export function createEmptyPersistedDeck(
  language: AppLanguage = 'en',
  now = new Date().toISOString(),
): PersistedAppState {
  const seed = DEFAULT_DECK_SEEDS[language]

  return {
    id: 'local',
    name: seed.emptyDeckName,
    categories: [createDefaultCategory(now, 1, seed.defaultCategoryName)],
    links: [],
    iconFiles: [],
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
  order: number
  now: string
}): SavedLink {
  return {
    id: params.id,
    categoryId: params.categoryId,
    name: params.name,
    url: params.url,
    icon: DEFAULT_LINK_BUILTIN_ICONS[params.id] ?? { type: 'auto' },
    order: params.order,
    createdAt: params.now,
    updatedAt: params.now,
  }
}
