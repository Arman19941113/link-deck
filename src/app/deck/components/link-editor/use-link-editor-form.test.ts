// Verifies link editor form state, validation, and submit payloads.

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import i18n from '@/i18n'
import { useLinkEditorForm } from './use-link-editor-form'
import type { Category, SavedLink, StoredIconFile } from '@/domain/deck/types'
import type { UpsertLinkInput } from '@/domain/deck/link-upsert-plan'

const { toastError } = vi.hoisted(() => ({
  toastError: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}))

describe('useLinkEditorForm', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh')
  })

  it('submits a new link with fallback name and default category', async () => {
    const { form, onOpenChange, upsertLink } = renderLinkEditorForm()

    await act(async () => {
      form.current.setUrl('https://example.com/docs')
      form.current.setNote('Reference docs')
    })
    await submit(form.current.handleSubmit)

    expect(upsertLink).toHaveBeenCalledWith({
      categoryId: 'default',
      name: 'example.com',
      url: 'https://example.com/docs',
      note: 'Reference docs',
      icon: { type: 'auto' },
      iconFile: null,
      id: undefined,
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses the provided default category when adding from a category section', async () => {
    const { form, upsertLink } = renderLinkEditorForm({ defaultCategoryId: 'tools' })

    await act(async () => {
      form.current.setUrl('https://github.com/')
      form.current.setName('GitHub')
    })
    await submit(form.current.handleSubmit)

    expect(upsertLink).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 'tools',
        name: 'GitHub',
      }),
    )
  })

  it('matches a built-in icon only when an added auto URL loses focus', () => {
    const { form } = renderLinkEditorForm()

    act(() => {
      form.current.setUrl('https://www.google.com/search')
    })

    expect(form.current.iconMode).toBe('auto')
    expect(form.current.builtinIcon).toBeNull()

    act(() => {
      form.current.handleUrlBlur()
    })

    expect(form.current.iconMode).toBe('builtin')
    expect(form.current.builtinIcon).toEqual({
      type: 'builtin',
      slug: 'material-icon-theme:google',
      title: 'Google',
      hex: '000000',
    })
  })

  it('prefers a product icon that matches both the subdomain and registrable domain', () => {
    const { form } = renderLinkEditorForm()

    act(() => {
      form.current.setUrl('https://gemini.google.com/')
    })
    act(() => {
      form.current.handleUrlBlur()
    })

    expect(form.current.builtinIcon).toEqual({
      type: 'builtin',
      slug: 'simple-icons:googlegemini',
      title: 'Gemini',
      hex: '3186FF',
    })
  })

  it('updates an automatically matched icon on a later URL blur', () => {
    const { form } = renderLinkEditorForm()

    act(() => {
      form.current.setUrl('https://google.com')
    })
    act(() => {
      form.current.handleUrlBlur()
    })
    act(() => {
      form.current.setUrl('https://github.com')
    })
    act(() => {
      form.current.handleUrlBlur()
    })

    expect(form.current.builtinIcon).toMatchObject({
      slug: 'simple-icons:github',
      title: 'GitHub',
    })
  })

  it('keeps the previous automatic icon when the next URL has no match', () => {
    const { form } = renderLinkEditorForm()

    act(() => {
      form.current.setUrl('https://google.com')
    })
    act(() => {
      form.current.handleUrlBlur()
    })
    const matchedIcon = form.current.builtinIcon

    act(() => {
      form.current.setUrl('https://example.com')
    })
    act(() => {
      form.current.handleUrlBlur()
    })

    expect(form.current.builtinIcon).toEqual(matchedIcon)
  })

  it('does not replace a manually selected built-in icon', () => {
    const { form } = renderLinkEditorForm()
    const manualIcon = {
      type: 'builtin',
      slug: 'simple-icons:notion',
      title: 'Notion',
      hex: '000000',
    } as const

    act(() => {
      form.current.setUrl('https://google.com')
    })
    act(() => {
      form.current.handleUrlBlur()
    })
    act(() => {
      form.current.handleBuiltinIconChange(manualIcon)
      form.current.setUrl('https://github.com')
    })
    act(() => {
      form.current.handleUrlBlur()
    })

    expect(form.current.builtinIcon).toEqual(manualIcon)
  })

  it('does not match built-in icons while editing a link', () => {
    const editingLink = link('existing', 'default', 'Existing')
    const { form } = renderLinkEditorForm({ link: editingLink })

    act(() => {
      form.current.setUrl('https://google.com')
      form.current.handleUrlBlur()
    })

    expect(form.current.iconMode).toBe('auto')
    expect(form.current.builtinIcon).toBeNull()
  })

  it('submits an edited link with the existing id and URL icon', async () => {
    const editingLink = link('github', 'default', 'GitHub', {
      icon: { type: 'url', url: 'https://github.com/icon.png' },
      note: 'Old note',
    })
    const { form, upsertLink } = renderLinkEditorForm({ link: editingLink })

    expect(form.current.editorTitle).toBe('编辑链接')
    expect(form.current.iconMode).toBe('url')

    await act(async () => {
      form.current.setCategoryId('tools')
      form.current.setName('GitHub Docs')
      form.current.setIconUrl('https://github.com/new-icon.png')
    })
    await submit(form.current.handleSubmit)

    expect(upsertLink).toHaveBeenCalledWith({
      id: 'github',
      categoryId: 'tools',
      name: 'GitHub Docs',
      url: 'https://github.com/',
      note: 'Old note',
      icon: { type: 'url', url: 'https://github.com/new-icon.png' },
      iconFile: null,
    })
  })

  it('shows a localized validation error when URL is missing', async () => {
    const { form, upsertLink } = renderLinkEditorForm()

    await submit(form.current.handleSubmit)

    expect(upsertLink).not.toHaveBeenCalled()
    expect(form.current.error).toBe('请输入链接 URL')
    expect(toastError).toHaveBeenCalledWith('请输入链接 URL', { id: 'link-editor-error' })
  })

  it('requires an icon URL when URL icon mode is selected', async () => {
    const { form, upsertLink } = renderLinkEditorForm()

    await act(async () => {
      form.current.setUrl('https://example.com/')
      form.current.handleIconModeChange('url')
    })
    await submit(form.current.handleSubmit)

    expect(upsertLink).not.toHaveBeenCalled()
    expect(form.current.error).toBe('请输入图标 URL')
  })

  it('validates local icon file type and size before submit', async () => {
    const { form, upsertLink } = renderLinkEditorForm()
    const invalidFile = new File(['plain text'], 'icon.txt', { type: 'text/plain' })

    await act(async () => {
      form.current.setUrl('https://example.com/')
      form.current.handleIconModeChange('file')
      form.current.handleIconFileChange(createFileInputChange(invalidFile))
    })
    await submit(form.current.handleSubmit)

    expect(upsertLink).not.toHaveBeenCalled()
    expect(form.current.error).toBe('请选择 PNG、JPEG、WebP 或 SVG 图标')
  })

  it('submits a selected valid file icon', async () => {
    const { form, upsertLink } = renderLinkEditorForm()
    const iconFile = new File(['svg'], 'icon.svg', { type: 'image/svg+xml' })

    await act(async () => {
      form.current.setUrl('https://example.com/')
      form.current.handleIconModeChange('file')
      form.current.handleIconFileChange(createFileInputChange(iconFile))
    })
    await submit(form.current.handleSubmit)

    expect(upsertLink).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: undefined,
        iconFile,
      }),
    )
  })

  it('keeps an existing file icon when editing without choosing a replacement', async () => {
    const editingLink = link('notion', 'tools', 'Notion', {
      icon: {
        type: 'file',
        fileId: 'icon-file-1',
        name: 'notion.svg',
        mimeType: 'image/svg+xml',
      },
    })
    const iconFile = storedIconFile('icon-file-1')
    const { form, loadStoredIconFile, upsertLink } = renderLinkEditorForm({
      link: editingLink,
      loadStoredIconFile: vi.fn().mockResolvedValue(iconFile),
    })

    await act(async () => {
      await Promise.resolve()
    })
    await submit(form.current.handleSubmit)

    expect(loadStoredIconFile).toHaveBeenCalledWith('icon-file-1')
    expect(form.current.currentFileLabel).toBe('notion.svg')
    expect(upsertLink).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: editingLink.icon,
        iconFile: null,
      }),
    )
  })

  it('keeps the dialog open and shows save errors from the action', async () => {
    const { form, onOpenChange } = renderLinkEditorForm({
      upsertLink: vi.fn().mockRejectedValue(new Error('Save exploded')),
    })

    await act(async () => {
      form.current.setUrl('https://example.com/')
    })
    await submit(form.current.handleSubmit)

    expect(form.current.error).toBe('Save exploded')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

type RenderLinkEditorFormOptions = {
  defaultCategoryId?: string
  link?: SavedLink | null
  loadStoredIconFile?: (id: string) => Promise<StoredIconFile | undefined>
  upsertLink?: (input: UpsertLinkInput) => Promise<SavedLink>
}

function renderLinkEditorForm(options: RenderLinkEditorFormOptions = {}) {
  const onOpenChange = vi.fn()
  const upsertLink =
    options.upsertLink ??
    vi.fn().mockImplementation((input: UpsertLinkInput) => Promise.resolve(savedLinkFromInput(input)))
  const loadStoredIconFile = options.loadStoredIconFile ?? vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() =>
    useLinkEditorForm({
      categories: createCategories(),
      defaultCategoryId: options.defaultCategoryId,
      link: options.link,
      loadStoredIconFile,
      onOpenChange,
      upsertLink,
    }),
  )

  return {
    form: result,
    loadStoredIconFile,
    onOpenChange,
    upsertLink,
  }
}

async function submit(handleSubmit: ReturnType<typeof useLinkEditorForm>['handleSubmit']): Promise<void> {
  const preventDefault = vi.fn()

  await act(async () => {
    await handleSubmit({ preventDefault } as unknown as React.FormEvent<HTMLFormElement>)
  })

  expect(preventDefault).toHaveBeenCalled()
}

function createFileInputChange(file: File): React.ChangeEvent<HTMLInputElement> {
  return {
    target: {
      files: [file],
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>
}

function createCategories(): Category[] {
  return [category('default', '默认', 1), category('tools', '工具', 2)]
}

function savedLinkFromInput(input: UpsertLinkInput): SavedLink {
  return link(input.id ?? 'saved-link', input.categoryId, input.name, {
    icon: input.icon ?? { type: 'auto' },
    note: input.note,
    url: input.url,
  })
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

function link(id: string, categoryId: string, name: string, overrides: Partial<SavedLink> = {}): SavedLink {
  return {
    id,
    categoryId,
    name,
    url: 'https://github.com/',
    note: '',
    icon: { type: 'auto' },
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function storedIconFile(id: string): StoredIconFile {
  return {
    id,
    blob: new Blob(['svg'], { type: 'image/svg+xml' }),
    name: 'notion.svg',
    mimeType: 'image/svg+xml',
    size: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}
