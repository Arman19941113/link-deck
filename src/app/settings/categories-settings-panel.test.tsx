// Verifies category settings panel controls using a focused view-model stub.

import { createRef } from 'react'
import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/i18n'
import { CategoriesSettingsPanel } from './categories-settings-panel'
import type { Category } from '@/domain/deck/types'

vi.mock('@dnd-kit/sortable', async importOriginal => {
  const original = await importOriginal<typeof import('@dnd-kit/sortable')>()

  return {
    ...original,
    useSortable: () => ({
      attributes: {},
      isDragging: false,
      listeners: {},
      setActivatorNodeRef: vi.fn(),
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
    }),
  }
})

describe('CategoriesSettingsPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh')
  })

  it('updates and submits the new category name', () => {
    const viewModel = createCategoryPanelViewModel()

    fireEvent.change(screen.getByPlaceholderText('新分类名称，按 Enter 添加'), { target: { value: '阅读' } })

    expect(viewModel.setNewCategoryName).toHaveBeenLastCalledWith('阅读')

    fireEvent.submit(screen.getByPlaceholderText('新分类名称，按 Enter 添加').closest('form')!)
    expect(viewModel.handleAddCategory).toHaveBeenCalledTimes(1)
  })

  it('starts rename mode and saves edited category names', async () => {
    const user = userEvent.setup()
    const viewModel = createCategoryPanelViewModel({
      editingCategoryId: 'tools',
      editingCategoryName: '工具箱',
    })

    await user.click(screen.getByRole('button', { name: '重命名 默认' }))
    expect(viewModel.startRename).toHaveBeenCalledWith(expect.objectContaining({ id: 'default' }))

    fireEvent.change(screen.getByLabelText('分类名称'), { target: { value: '资料库' } })
    expect(viewModel.setEditingCategoryName).toHaveBeenLastCalledWith('资料库')

    await user.click(screen.getByRole('button', { name: '保存 工具' }))
    expect(viewModel.handleRename).toHaveBeenCalledWith('tools')

    await user.click(screen.getByRole('button', { name: '取消重命名' }))
    expect(viewModel.cancelRename).toHaveBeenCalledTimes(1)
  })

  it('does not render delete action for the default category and requests deletion for custom categories', async () => {
    const user = userEvent.setup()
    const viewModel = createCategoryPanelViewModel()

    expect(screen.queryByRole('button', { name: '删除 默认' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '删除 工具' }))
    expect(viewModel.requestDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'tools' }))
  })
})

type CategoryPanelViewModelOptions = {
  editingCategoryId?: string | null
  editingCategoryName?: string
}

function createCategoryPanelViewModel(options: CategoryPanelViewModelOptions = {}) {
  const viewModel = {
    canDeleteCategory: true,
    cancelRename: vi.fn(),
    categoryListRef: createRef<HTMLDivElement>(),
    categoryRows: [category('default', '默认', 1), category('tools', '工具', 2)],
    draggedCategory: null,
    draggedCategoryWidth: null,
    editingCategoryId: options.editingCategoryId ?? null,
    editingCategoryName: options.editingCategoryName ?? '',
    editingCategoryNameInputRef: createRef<HTMLInputElement>(),
    handleAddCategory: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
    handleCategoryDragCancel: vi.fn(),
    handleCategoryDragEnd: vi.fn(),
    handleCategoryDragStart: vi.fn(),
    handleEditCategoryKeyDown: vi.fn(),
    handleNewCategoryKeyDown: vi.fn(),
    handleRename: vi.fn(),
    newCategoryName: '',
    newCategoryNameInputRef: createRef<HTMLInputElement>(),
    requestDelete: vi.fn(),
    setEditingCategoryName: vi.fn(),
    setNewCategoryName: vi.fn(),
    startRename: vi.fn(),
  }

  render(<CategoriesSettingsPanel viewModel={viewModel} />)

  return viewModel
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
