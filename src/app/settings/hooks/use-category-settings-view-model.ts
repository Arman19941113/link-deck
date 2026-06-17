// Coordinates direct category operations from the settings dialog.

import { type FormEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { useTranslation } from 'react-i18next'

import {
  applyCategoryEditingName,
  countLinksByCategoryId,
  haveSameCategoryOrder,
  isDefaultCategory,
  sortCategoriesByOrder,
} from '@/domain/deck/categories'
import type { DeleteCategoryLinksStrategy } from '@/domain/deck/category-delete-changes'
import { reorderCategories } from '@/domain/deck/reorder'
import type { Category, SavedLink } from '@/domain/deck/types'
import { getSettingsDialogErrorMessage } from '../utils/settings-errors'
import type { SettingsErrorController } from './use-settings-error'

type DeleteMode = DeleteCategoryLinksStrategy['mode']

type UseCategorySettingsViewModelParams = {
  categories: Category[]
  links: SavedLink[]
  addCategory: (name: string) => Promise<Category>
  renameCategory: (categoryId: string, name: string) => Promise<void>
  deleteCategory: (categoryId: string, options?: DeleteCategoryLinksStrategy) => Promise<void>
  reorderCategoryList: (activeCategoryId: string, overCategoryId: string) => Promise<void>
  settingsError: SettingsErrorController
}

/** Manages category settings controls while each valid edit calls the deck action directly. */
export function useCategorySettingsViewModel({
  categories,
  links,
  addCategory,
  renameCategory,
  deleteCategory,
  reorderCategoryList,
  settingsError,
}: UseCategorySettingsViewModelParams) {
  const { t } = useTranslation()
  const newCategoryNameInputRef = useRef<HTMLInputElement>(null)
  const editingCategoryNameInputRef = useRef<HTMLInputElement>(null)
  const categoryListRef = useRef<HTMLDivElement>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('move-links')
  const [deleteTargetCategoryId, setDeleteTargetCategoryId] = useState('')
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null)
  const [draggedCategoryWidth, setDraggedCategoryWidth] = useState<number | null>(null)
  const [optimisticCategories, setOptimisticCategories] = useState<Category[] | null>(null)
  const categoryRows = useMemo(
    () =>
      applyCategoryEditingName(
        sortCategoriesByOrder(optimisticCategories ?? categories),
        editingCategoryId,
        editingCategoryName,
      ),
    [categories, editingCategoryId, editingCategoryName, optimisticCategories],
  )
  const linkCountByCategoryId = useMemo(() => countLinksByCategoryId(links), [links])
  const pendingDeleteCategory = categoryRows.find(category => category.id === pendingDeleteCategoryId) ?? null
  const pendingDeleteLinkCount = pendingDeleteCategory ? (linkCountByCategoryId.get(pendingDeleteCategory.id) ?? 0) : 0
  const otherCategories = useMemo(
    () => (pendingDeleteCategory ? categoryRows.filter(category => category.id !== pendingDeleteCategory.id) : []),
    [categoryRows, pendingDeleteCategory],
  )
  const defaultTargetCategoryId = getDefaultDeleteTargetCategoryId(otherCategories)
  const effectiveDeleteTargetCategoryId = otherCategories.some(category => category.id === deleteTargetCategoryId)
    ? deleteTargetCategoryId
    : defaultTargetCategoryId
  const draggedCategory = categoryRows.find(category => category.id === draggedCategoryId) ?? null
  const canDeleteCategory = categoryRows.length > 1

  useEffect(() => {
    if (!editingCategoryId) {
      return
    }

    editingCategoryNameInputRef.current?.focus()
    editingCategoryNameInputRef.current?.select()
  }, [editingCategoryId])

  useEffect(() => {
    if (!optimisticCategories || !haveSameCategoryOrder(categories, optimisticCategories)) {
      return
    }

    setOptimisticCategories(null)
  }, [categories, optimisticCategories])

  /** Adds the category through the deck action as soon as the input is submitted. */
  function addCategoryFromInput(): void {
    const name = newCategoryName.trim()

    if (!name) {
      settingsError.showError(t('settings.errors.enterCategoryName'))
      newCategoryNameInputRef.current?.focus()
      return
    }

    void runCategoryAction(async () => {
      await addCategory(name)
      setOptimisticCategories(null)
      setNewCategoryName('')
      setPendingDeleteCategoryId(null)
      newCategoryNameInputRef.current?.focus()
    })
  }

  /** Keeps Enter as the creation shortcut even without a visible submit button. */
  function handleNewCategoryKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    addCategoryFromInput()
  }

  /** Keeps browser form submission as a fallback for category creation. */
  function handleAddCategory(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    addCategoryFromInput()
  }

  /** Starts inline rename mode for the current category. */
  function startRename(category: Category): void {
    setEditingCategoryId(category.id)
    setEditingCategoryName(category.name)
    setPendingDeleteCategoryId(null)
    settingsError.clearError()
  }

  /** Leaves inline rename mode without applying the input. */
  function cancelRename(): void {
    setEditingCategoryId(null)
    setEditingCategoryName('')
    settingsError.clearError()
  }

  /** Handles inline rename keyboard shortcuts without leaking them to the dialog shell. */
  function handleEditCategoryKeyDown(event: KeyboardEvent<HTMLInputElement>, categoryId: string): void {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      event.stopPropagation()
      handleRename(categoryId)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      cancelRename()
    }
  }

  /** Applies the current inline-edited category name through the deck action. */
  function handleRename(categoryId: string): void {
    const name = editingCategoryName.trim()

    if (!name) {
      settingsError.showError(t('settings.errors.enterCategoryName'))
      return
    }

    void runCategoryAction(async () => {
      await renameCategory(categoryId, name)
      setEditingCategoryId(null)
      setEditingCategoryName('')
    })
  }

  /** Opens the delete confirmation dialog for the selected category. */
  function requestDelete(category: Category): void {
    if (!canDeleteCategory) {
      return
    }

    if (isDefaultCategory(category.id)) {
      settingsError.showError(t('settings.errors.defaultCategoryCannotBeDeleted'))
      return
    }

    const linkCount = linkCountByCategoryId.get(category.id) ?? 0
    const nextTargetId = getDefaultDeleteTargetCategoryId(categoryRows.filter(item => item.id !== category.id))

    setEditingCategoryId(null)
    setEditingCategoryName('')
    settingsError.clearError()
    setPendingDeleteCategoryId(category.id)
    setDeleteMode('move-links')
    setDeleteTargetCategoryId(linkCount > 0 ? nextTargetId : '')
  }

  /** Deletes the pending category immediately with the selected link handling strategy. */
  async function confirmPendingDelete(): Promise<boolean> {
    if (!pendingDeleteCategory) {
      return false
    }

    if (categoryRows.length <= 1) {
      settingsError.showError(t('settings.errors.keepAtLeastOneCategory'))
      return false
    }

    if (pendingDeleteLinkCount > 0 && deleteMode === 'move-links' && !effectiveDeleteTargetCategoryId) {
      settingsError.showError(t('settings.errors.selectMoveTarget'))
      return false
    }

    const deleteOptions: DeleteCategoryLinksStrategy | undefined =
      pendingDeleteLinkCount === 0
        ? undefined
        : deleteMode === 'move-links'
          ? {
              mode: 'move-links',
              targetCategoryId: effectiveDeleteTargetCategoryId,
            }
          : {
              mode: 'delete-links',
            }
    const categoryId = pendingDeleteCategory.id

    return runCategoryAction(async () => {
      await deleteCategory(categoryId, deleteOptions)
      setOptimisticCategories(null)
      setPendingDeleteCategoryId(null)
      setDeleteTargetCategoryId('')
    })
  }

  /** Records the active item when category dragging starts for top-level DragOverlay rendering. */
  function handleCategoryDragStart(event: DragStartEvent): void {
    setDraggedCategoryId(String(event.active.id))
    setDraggedCategoryWidth(event.active.rect.current.initial?.width ?? null)
  }

  /** Calls the deck reorder action when category dragging ends. */
  function handleCategoryDragEnd(event: DragEndEvent): void {
    setDraggedCategoryId(null)
    setDraggedCategoryWidth(null)

    if (!event.over || event.active.id === event.over.id) {
      return
    }

    const activeCategoryId = String(event.active.id)
    const overCategoryId = String(event.over.id)
    const nextCategories = reorderCategories(categoryRows, activeCategoryId, overCategoryId)

    setOptimisticCategories(nextCategories)

    void runCategoryAction(async () => {
      try {
        await reorderCategoryList(activeCategoryId, overCategoryId)
        setPendingDeleteCategoryId(null)
      } catch (reorderError) {
        setOptimisticCategories(null)
        throw reorderError
      }
    })
  }

  /** Clears overlay state when dragging is canceled. */
  function handleCategoryDragCancel(): void {
    setDraggedCategoryId(null)
    setDraggedCategoryWidth(null)
  }

  function clearPendingDelete(): void {
    setPendingDeleteCategoryId(null)
    settingsError.clearError()
  }

  async function runCategoryAction(action: () => Promise<void>): Promise<boolean> {
    settingsError.clearError()

    try {
      await action()
      settingsError.clearError()
      return true
    } catch (actionError) {
      settingsError.showError(getSettingsDialogErrorMessage(actionError, t))
      return false
    }
  }

  return {
    draggedCategory,
    draggedCategoryWidth,
    canDeleteCategory,
    categoryListRef,
    clearPendingDelete,
    confirmPendingDelete,
    deleteMode,
    editingCategoryId,
    editingCategoryName,
    editingCategoryNameInputRef,
    effectiveDeleteTargetCategoryId,
    error: settingsError.error,
    handleAddCategory,
    handleCategoryDragCancel,
    handleCategoryDragEnd,
    handleCategoryDragStart,
    handleEditCategoryKeyDown,
    handleNewCategoryKeyDown,
    handleRename,
    newCategoryName,
    newCategoryNameInputRef,
    otherCategories,
    pendingDeleteCategory,
    pendingDeleteLinkCount,
    requestDelete,
    setDeleteMode,
    setDeleteTargetCategoryId,
    setEditingCategoryName,
    setNewCategoryName,
    categoryRows,
    startRename,
    cancelRename,
    deleteTargetCategoryId,
  }
}

function getDefaultDeleteTargetCategoryId(categories: Category[]): string {
  return categories.find(category => isDefaultCategory(category.id))?.id ?? categories[0]?.id ?? ''
}
