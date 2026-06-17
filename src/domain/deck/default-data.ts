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
  note: string
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
        note: 'Search and everyday web access',
        order: 1,
      },
      {
        id: 'chatgpt',
        categoryId: 'default',
        name: 'ChatGPT',
        url: 'https://chatgpt.com/',
        note: 'AI assistant and research',
        order: 2,
      },
      {
        id: 'github',
        categoryId: 'default',
        name: 'GitHub',
        url: 'https://github.com/',
        note: 'Code hosting and collaboration',
        order: 3,
      },
      {
        id: 'notion',
        categoryId: 'tools',
        name: 'Notion',
        url: 'https://www.notion.so/',
        note: 'Notes, docs, and workspace',
        order: 1,
      },
      {
        id: 'excalidraw',
        categoryId: 'tools',
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        note: 'Sketches, diagrams, and visual thinking',
        order: 2,
      },
      {
        id: 'x',
        categoryId: 'social',
        name: 'X.com',
        url: 'https://x.com/',
        note: 'Real-time social updates',
        order: 1,
      },
      {
        id: 'instagram',
        categoryId: 'social',
        name: 'Instagram',
        url: 'https://www.instagram.com/',
        note: 'Photos, creators, and social feeds',
        order: 2,
      },
      {
        id: 'xiaohongshu',
        categoryId: 'social',
        name: 'Xiaohongshu',
        url: 'https://www.xiaohongshu.com/',
        note: 'Lifestyle search and community posts',
        order: 3,
      },
      {
        id: 'youtube',
        categoryId: 'video',
        name: 'YouTube',
        url: 'https://www.youtube.com/',
        note: 'Long-form video and learning',
        order: 1,
      },
      {
        id: 'douyin',
        categoryId: 'video',
        name: 'Douyin',
        url: 'https://www.douyin.com/',
        note: 'Short-form video and trends',
        order: 2,
      },
      {
        id: 'bilibili',
        categoryId: 'video',
        name: 'Bilibili',
        url: 'https://www.bilibili.com/',
        note: 'Videos, creators, and tech content',
        order: 3,
      },
      {
        id: 'hacker-news',
        categoryId: 'discovery',
        name: 'Hacker News',
        url: 'https://news.ycombinator.com/',
        note: 'Startup and engineering news',
        order: 1,
      },
      {
        id: 'product-hunt',
        categoryId: 'discovery',
        name: 'Product Hunt',
        url: 'https://www.producthunt.com/',
        note: 'New products and launches',
        order: 2,
      },
      {
        id: 'sspai',
        categoryId: 'discovery',
        name: 'Sspai',
        url: 'https://sspai.com/',
        note: 'Digital tools and productivity writing',
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
        note: '搜索与日常网页访问',
        order: 1,
      },
      {
        id: 'chatgpt',
        categoryId: 'default',
        name: 'ChatGPT',
        url: 'https://chatgpt.com/',
        note: 'AI 助手与资料研究',
        order: 2,
      },
      {
        id: 'github',
        categoryId: 'default',
        name: 'GitHub',
        url: 'https://github.com/',
        note: '代码托管与协作',
        order: 3,
      },
      {
        id: 'notion',
        categoryId: 'tools',
        name: 'Notion',
        url: 'https://www.notion.so/',
        note: '笔记、文档与工作区',
        order: 1,
      },
      {
        id: 'excalidraw',
        categoryId: 'tools',
        name: 'Excalidraw',
        url: 'https://excalidraw.com/',
        note: '草图、图表与视觉思考',
        order: 2,
      },
      {
        id: 'x',
        categoryId: 'social',
        name: 'X.com',
        url: 'https://x.com/',
        note: '实时社交动态',
        order: 1,
      },
      {
        id: 'instagram',
        categoryId: 'social',
        name: 'Instagram',
        url: 'https://www.instagram.com/',
        note: '图片、创作者与社交动态',
        order: 2,
      },
      {
        id: 'xiaohongshu',
        categoryId: 'social',
        name: '小红书',
        url: 'https://www.xiaohongshu.com/',
        note: '生活方式搜索与社区内容',
        order: 3,
      },
      {
        id: 'youtube',
        categoryId: 'video',
        name: 'YouTube',
        url: 'https://www.youtube.com/',
        note: '长视频与学习内容',
        order: 1,
      },
      {
        id: 'douyin',
        categoryId: 'video',
        name: '抖音',
        url: 'https://www.douyin.com/',
        note: '短视频与趋势内容',
        order: 2,
      },
      {
        id: 'bilibili',
        categoryId: 'video',
        name: 'Bilibili',
        url: 'https://www.bilibili.com/',
        note: '视频、创作者与科技内容',
        order: 3,
      },
      {
        id: 'hacker-news',
        categoryId: 'discovery',
        name: 'Hacker News',
        url: 'https://news.ycombinator.com/',
        note: '创业与工程新闻',
        order: 1,
      },
      {
        id: 'product-hunt',
        categoryId: 'discovery',
        name: 'Product Hunt',
        url: 'https://www.producthunt.com/',
        note: '新产品与发布动态',
        order: 2,
      },
      {
        id: 'sspai',
        categoryId: 'discovery',
        name: '少数派',
        url: 'https://sspai.com/',
        note: '数字工具与效率写作',
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
