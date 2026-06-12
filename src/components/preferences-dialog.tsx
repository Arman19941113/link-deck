// Preferences dialog for display options and category draft editing.

import { startTransition, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Download, Eraser, GripVertical, Pencil, RotateCcw, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { InterfaceSizePicker } from '@/components/interface-size-picker'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { isDefaultCategory } from '@/domain/categories'
import { getInterfaceSizeConfig, type InterfaceSizeConfig } from '@/domain/interface-size'
import type { Category, InterfaceSize, Link, SortMode } from '@/domain/types'
import type { CategoryDraftDeletePlan, CategoryDraft } from '@/hooks/use-deck-store'
import { cn } from '@/lib/utils'

type DeleteMode = CategoryDraftDeletePlan['mode']

type PreferencesDialogProps = {
  open: boolean
  categories: Category[]
  links: Link[]
  interfaceSize: InterfaceSize
  sortMode: SortMode
  onOpenChange: (open: boolean) => void
  onInterfaceSizeChange: (interfaceSize: InterfaceSize) => void
  onSortModeChange: (sortMode: SortMode) => void
  saveCategoryDraft: (draft: CategoryDraft) => Promise<void>
  exportDeck: () => Promise<unknown>
  importDeck: (json: string) => Promise<void>
  resetDeckToDefaults: () => Promise<void>
  clearDeckData: () => Promise<void>
}

type PreferencesDialogContentProps = Omit<PreferencesDialogProps, 'open'>
type PreferencesTab = 'general' | 'categories' | 'data'
type DisplayLanguage = 'en'
type ConfirmDataAction = 'reset' | 'clear'

const SORT_LABELS: Record<SortMode, string> = {
  manual: 'Manual order',
  mostVisited: 'Most opened',
  recentVisited: 'Recently opened',
  name: 'Title',
}

const DISPLAY_LANGUAGE_LABELS: Record<DisplayLanguage, string> = {
  en: 'English',
}

const PREFERENCES_TABS: Array<{ value: PreferencesTab; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'categories', label: 'Categories' },
  { value: 'data', label: 'Data' },
]

/** Converts unknown errors into preference dialog messages. */
function getDialogErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Action failed. Please try again later.'
}

/** Converts import failures into short toast messages. */
function getImportErrorToastMessage(error: unknown): string {
  const message = getDialogErrorMessage(error)

  if (message === 'Unsupported backup format.') {
    return message
  }

  if (message === 'Import file is not valid JSON' || message === 'Import file is not a Link Deck backup') {
    return 'Choose a Link Deck backup file.'
  }

  if (message.startsWith('Import file')) {
    return 'Invalid backup file.'
  }

  return 'Import failed. Check the backup file.'
}

/** Creates a draft id for a locally added category; the store persists it on save. */
function createCategoryId(): string {
  return `category-${crypto.randomUUID()}`
}

/** Copies categories sorted by ascending order. */
function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => left.order - right.order)
}

/** Compacts category order before saving to avoid gaps after dragging or deleting. */
function normalizeDraftOrder(categories: Category[]): Category[] {
  return categories.map((category, index) => ({ ...category, order: index + 1 }))
}

/** Dirty checks only compare savable draft fields and delete plans. */
function createDraftSignature(categories: Category[], deletePlans: CategoryDraftDeletePlan[]): string {
  const signatureCategories = normalizeDraftOrder(categories).map(category => ({
    id: category.id,
    name: category.name,
    order: category.order,
  }))
  const signatureDeletePlans = [...deletePlans]
    .sort((left, right) => left.categoryId.localeCompare(right.categoryId))
    .map(plan =>
      plan.mode === 'move-links'
        ? {
            categoryId: plan.categoryId,
            mode: plan.mode,
            targetCategoryId: plan.targetCategoryId,
          }
        : {
            categoryId: plan.categoryId,
            mode: plan.mode,
          },
    )

  return JSON.stringify({
    categories: signatureCategories,
    deletePlans: signatureDeletePlans,
  })
}

/** Derives the pending draft from inline edit state so footer save does not read a stale name. */
function applyEditingName(categories: Category[], editingCategoryId: string | null, editingName: string): Category[] {
  if (!editingCategoryId) {
    return categories
  }

  return categories.map(category =>
    category.id === editingCategoryId ? { ...category, name: editingName.trim() } : category,
  )
}

type SortableCategoryRowProps = {
  actions: ReactNode
  category: Category
  disabled: boolean
  dragContent: ReactNode
  interfaceSizeConfig: InterfaceSizeConfig
}

/** Adds a full-row drag area to category rows while keeping right-side action buttons independent. */
function SortableCategoryRow({
  actions,
  category,
  disabled,
  dragContent,
  interfaceSizeConfig,
}: SortableCategoryRowProps) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id: category.id,
    data: {
      categoryId: category.id,
      type: 'category-row',
    },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const dragHandleProps = disabled
    ? {}
    : {
        ...attributes,
        ...listeners,
        'aria-label': `Drag category ${category.name}`,
      }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(interfaceSizeConfig.dialog.rowClassName, isDragging && 'invisible')}
    >
      <div
        ref={setActivatorNodeRef}
        className={cn(
          'flex min-w-0 flex-1 touch-none items-center gap-2 p-2',
          disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        )}
        {...dragHandleProps}
      >
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {dragContent}
      </div>

      <div className={interfaceSizeConfig.dialog.rowActionsClassName}>{actions}</div>
    </div>
  )
}

type CategoryDragOverlayRowProps = {
  category: Category
  interfaceSizeConfig: InterfaceSizeConfig
}

/** Renders a top-level category row snapshot while dragging so dialog content does not clip it. */
function CategoryDragOverlayRow({ category, interfaceSizeConfig }: CategoryDragOverlayRowProps) {
  const isBuiltInDefault = isDefaultCategory(category.id)

  return (
    <div className={cn(interfaceSizeConfig.dialog.rowClassName, 'border-accent shadow-lg')}>
      <div className="flex min-w-0 flex-1 items-center gap-2 p-2">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" title={category.name}>
            {category.name}
          </span>
        </div>
      </div>

      <div className={interfaceSizeConfig.dialog.rowActionsClassName}>
        {isBuiltInDefault ? null : (
          <Button
            type="button"
            variant="ghost"
            size={interfaceSizeConfig.control.iconButtonSize}
            aria-hidden="true"
            tabIndex={-1}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size={interfaceSizeConfig.control.iconButtonSize}
          aria-hidden="true"
          tabIndex={-1}
        >
          <Pencil aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

/** Preferences dialog shell that resets internal edit state with a key. */
export function PreferencesDialog({
  open,
  categories,
  links,
  interfaceSize,
  sortMode,
  onOpenChange,
  onInterfaceSizeChange,
  onSortModeChange,
  saveCategoryDraft,
  exportDeck,
  importDeck,
  resetDeckToDefaults,
  clearDeckData,
}: PreferencesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (nextOpen) {
          onOpenChange(true)
        }
      }}
    >
      <PreferencesDialogContent
        key={`${open ? 'open' : 'closed'}-${categories.map(category => category.id).join('-')}`}
        categories={categories}
        links={links}
        interfaceSize={interfaceSize}
        sortMode={sortMode}
        onOpenChange={onOpenChange}
        onInterfaceSizeChange={onInterfaceSizeChange}
        onSortModeChange={onSortModeChange}
        saveCategoryDraft={saveCategoryDraft}
        exportDeck={exportDeck}
        importDeck={importDeck}
        resetDeckToDefaults={resetDeckToDefaults}
        clearDeckData={clearDeckData}
      />
    </Dialog>
  )
}

/** Preferences dialog content; all changes go to a local draft before the footer save commits them. */
function PreferencesDialogContent({
  categories,
  links,
  interfaceSize,
  sortMode,
  onOpenChange,
  onInterfaceSizeChange,
  onSortModeChange,
  saveCategoryDraft,
  exportDeck,
  importDeck,
  resetDeckToDefaults,
  clearDeckData,
}: PreferencesDialogContentProps) {
  const newNameInputRef = useRef<HTMLInputElement>(null)
  const editingNameInputRef = useRef<HTMLInputElement>(null)
  const categoryListRef = useRef<HTMLDivElement>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [initialSnapshot] = useState(() => {
    const initialDraftCategories = normalizeDraftOrder(sortCategories(categories))

    return {
      categoryMap: new Map(initialDraftCategories.map(category => [category.id, category])),
      categories: initialDraftCategories,
      signature: createDraftSignature(initialDraftCategories, []),
    }
  })
  const [draftCategories, setDraftCategories] = useState<Category[]>(() => initialSnapshot.categories)
  const [deletePlans, setDeletePlans] = useState<CategoryDraftDeletePlan[]>([])
  const [newName, setNewName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null)
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('move-links')
  const [targetCategoryId, setTargetCategoryId] = useState('')
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [activeCategoryWidth, setActiveCategoryWidth] = useState<number | null>(null)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [confirmDataAction, setConfirmDataAction] = useState<ConfirmDataAction | null>(null)
  const [activeTab, setActiveTab] = useState<PreferencesTab>('general')
  const [localInterfaceSize, setLocalInterfaceSize] = useState<InterfaceSize>(interfaceSize)
  const [localSortMode, setLocalSortMode] = useState<SortMode>(sortMode)
  const [displayLanguage, setDisplayLanguage] = useState<DisplayLanguage>('en')
  const interfaceSizeConfig = getInterfaceSizeConfig(interfaceSize)
  const sortedCategories = useMemo(
    () => normalizeDraftOrder(applyEditingName(draftCategories, editingCategoryId, editingName)),
    [draftCategories, editingCategoryId, editingName],
  )
  const linkCountByCategoryId = useMemo(() => {
    const countMap = new Map<string, number>()

    for (const link of links) {
      countMap.set(link.categoryId, (countMap.get(link.categoryId) ?? 0) + 1)
    }

    return countMap
  }, [links])
  const pendingDeleteCategory = sortedCategories.find(category => category.id === pendingDeleteCategoryId) ?? null
  const pendingDeleteLinkCount = pendingDeleteCategory ? (linkCountByCategoryId.get(pendingDeleteCategory.id) ?? 0) : 0
  const otherCategories = useMemo(
    () => (pendingDeleteCategory ? sortedCategories.filter(category => category.id !== pendingDeleteCategory.id) : []),
    [pendingDeleteCategory, sortedCategories],
  )
  const effectiveTargetCategoryId = otherCategories.some(category => category.id === targetCategoryId)
    ? targetCategoryId
    : (otherCategories[0]?.id ?? '')
  const activeCategory = sortedCategories.find(category => category.id === activeCategoryId) ?? null
  const currentSignature = createDraftSignature(sortedCategories, deletePlans)
  const isDirty = currentSignature !== initialSnapshot.signature
  const isBusy = busyAction !== null
  const isReplacingData = busyAction !== null && busyAction !== 'export'
  const canUseDataControls = !isReplacingData && !isDirty
  const canDeleteCategory = sortedCategories.length > 1
  const errorId = 'preferences-category-error'

  useEffect(() => {
    if (activeTab !== 'categories' || isBusy) {
      return
    }

    newNameInputRef.current?.focus()
  }, [activeTab, isBusy])

  useEffect(() => {
    if (!editingCategoryId) {
      return
    }

    editingNameInputRef.current?.focus()
    editingNameInputRef.current?.select()
  }, [editingCategoryId])

  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const restrictCategoryDragToListBounds: Modifier = ({ activeNodeRect, transform }) => {
    const listRect = categoryListRef.current?.getBoundingClientRect()

    if (!activeNodeRect || !listRect) {
      return {
        ...transform,
        x: 0,
      }
    }

    const minY = listRect.top - activeNodeRect.top
    const maxY = listRect.bottom - activeNodeRect.bottom

    return {
      ...transform,
      x: 0,
      y: Math.min(Math.max(transform.y, minY), maxY),
    }
  }

  /** Clears the input after adding a category and keeps the dialog open for more edits. */
  function addCategoryFromInput(): void {
    if (isBusy) {
      return
    }

    const name = newName.trim()

    if (!name) {
      setError('Enter a category name')
      newNameInputRef.current?.focus()
      return
    }

    const now = new Date().toISOString()

    setDraftCategories(currentCategories =>
      normalizeDraftOrder([
        ...currentCategories,
        {
          id: createCategoryId(),
          name,
          order: currentCategories.length + 1,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    )
    setNewName('')
    setPendingDeleteCategoryId(null)
    setError(null)
    newNameInputRef.current?.focus()
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
    setEditingName(category.name)
    setPendingDeleteCategoryId(null)
    setError(null)
  }

  /** Leaves inline rename mode without applying the draft input. */
  function cancelRename(): void {
    setEditingCategoryId(null)
    setEditingName('')
    setError(null)
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

  /** Saves the current inline-edited category name to the draft. */
  function handleRename(categoryId: string): void {
    if (isBusy) {
      return
    }

    const name = editingName.trim()

    if (!name) {
      setError('Enter a category name')
      return
    }

    setDraftCategories(currentCategories =>
      currentCategories.map(category => (category.id === categoryId ? { ...category, name } : category)),
    )
    setEditingCategoryId(null)
    setEditingName('')
    setError(null)
  }

  /** Removes a category from the draft while leaving existing delete plans for save-time target validation. */
  function removeCategoryFromDraft(categoryId: string): void {
    setDraftCategories(currentCategories =>
      normalizeDraftOrder(currentCategories.filter(category => category.id !== categoryId)),
    )
    setDeletePlans(currentPlans => currentPlans.filter(plan => plan.categoryId !== categoryId))

    if (editingCategoryId === categoryId) {
      setEditingCategoryId(null)
      setEditingName('')
    }
  }

  /** Removes from the draft directly or shows a second confirmation panel based on link count. */
  function requestDelete(category: Category): void {
    if (isBusy || !canDeleteCategory) {
      return
    }

    if (isDefaultCategory(category.id)) {
      setError('The default category cannot be deleted')
      return
    }

    const linkCount = linkCountByCategoryId.get(category.id) ?? 0
    const nextTargetId = sortedCategories.find(item => item.id !== category.id)?.id ?? ''
    const isMoveTarget = deletePlans.some(plan => plan.mode === 'move-links' && plan.targetCategoryId === category.id)

    if (isMoveTarget) {
      setError('This category is already a link move target. Save or cancel the current changes first.')
      return
    }

    setEditingCategoryId(null)
    setEditingName('')
    setError(null)

    if (linkCount > 0) {
      setPendingDeleteCategoryId(category.id)
      setDeleteMode('move-links')
      setTargetCategoryId(nextTargetId)
      return
    }

    removeCategoryFromDraft(category.id)
    setPendingDeleteCategoryId(null)
  }

  /** Records the delete plan for a category with links, then removes that category from the draft list. */
  function confirmPendingDelete(): void {
    if (!pendingDeleteCategory || isBusy) {
      return
    }

    if (sortedCategories.length <= 1) {
      setError('Keep at least one category')
      return
    }

    if (deleteMode === 'move-links' && !effectiveTargetCategoryId) {
      setError('Select the category to move links to')
      return
    }

    const deletePlan: CategoryDraftDeletePlan =
      deleteMode === 'move-links'
        ? {
            categoryId: pendingDeleteCategory.id,
            mode: 'move-links',
            targetCategoryId: effectiveTargetCategoryId,
          }
        : {
            categoryId: pendingDeleteCategory.id,
            mode: 'delete-links',
          }

    setDeletePlans(currentPlans => [
      ...currentPlans.filter(plan => plan.categoryId !== pendingDeleteCategory.id),
      deletePlan,
    ])
    removeCategoryFromDraft(pendingDeleteCategory.id)
    setPendingDeleteCategoryId(null)
    setTargetCategoryId('')
    setError(null)
  }

  /** Records the active item when category dragging starts for top-level DragOverlay rendering. */
  function handleCategoryDragStart(event: DragStartEvent): void {
    setActiveCategoryId(String(event.active.id))
    setActiveCategoryWidth(event.active.rect.current.initial?.width ?? null)
  }

  /** Only updates draft order after category dragging ends. */
  function handleCategoryDragEnd(event: DragEndEvent): void {
    setActiveCategoryId(null)
    setActiveCategoryWidth(null)

    if (!event.over || event.active.id === event.over.id || isBusy) {
      return
    }

    const activeCategoryId = String(event.active.id)
    const overCategoryId = String(event.over.id)

    setDraftCategories(currentCategories => {
      const oldIndex = currentCategories.findIndex(category => category.id === activeCategoryId)
      const newIndex = currentCategories.findIndex(category => category.id === overCategoryId)

      if (oldIndex < 0 || newIndex < 0) {
        return currentCategories
      }

      return normalizeDraftOrder(arrayMove(currentCategories, oldIndex, newIndex))
    })
    setPendingDeleteCategoryId(null)
    setError(null)
  }

  /** Clears overlay state when dragging is canceled. */
  function handleCategoryDragCancel(): void {
    setActiveCategoryId(null)
    setActiveCategoryWidth(null)
  }

  /** Saves the draft to the store, keeping the current draft and showing an error on failure. */
  async function handleSaveDraft(): Promise<void> {
    if (isBusy || !isDirty) {
      return
    }

    const nextDraftCategories = normalizeDraftOrder(applyEditingName(draftCategories, editingCategoryId, editingName))

    if (editingCategoryId && !editingName.trim()) {
      setError('Enter a category name')
      return
    }

    setBusyAction('save')
    setError(null)

    try {
      await saveCategoryDraft({
        categories: nextDraftCategories,
        deletePlans,
      })
      onOpenChange(false)
    } catch (saveError) {
      setDraftCategories(nextDraftCategories)
      setEditingCategoryId(null)
      setEditingName('')
      setError(getDialogErrorMessage(saveError))
      setBusyAction(null)
    }
  }

  /** Downloads a JSON backup generated from the current persisted deck. */
  async function handleExportDeck(): Promise<void> {
    if (isBusy || isDirty) {
      return
    }

    setBusyAction('export')
    setError(null)

    try {
      const exportFile = await exportDeck()
      const blob = new Blob([JSON.stringify(exportFile, null, 2)], {
        type: 'application/json',
      })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = objectUrl
      link.download = `link-deck-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
      setError(null)
      toast.success('Backup exported.')
    } catch (exportError) {
      setError(getDialogErrorMessage(exportError))
    } finally {
      setBusyAction(null)
    }
  }

  /** Opens the hidden JSON import picker when data replacement is allowed. */
  function requestImportDeck(): void {
    if (isBusy) {
      return
    }

    if (isDirty) {
      setError('Save or discard category changes before importing data.')
      return
    }

    importFileInputRef.current?.click()
  }

  /** Reads the selected JSON backup and replaces the current deck. */
  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0] ?? null

    event.target.value = ''

    if (!file || isBusy) {
      return
    }

    if (isDirty) {
      setError('Save or discard category changes before importing data.')
      return
    }

    setBusyAction('import')
    setError(null)

    try {
      await importDeck(await file.text())
      toast.success('Backup imported.')
      setBusyAction(null)
      onOpenChange(false)
    } catch (importError) {
      toast.error(getImportErrorToastMessage(importError), { id: 'backup-import-error' })
      setBusyAction(null)
    }
  }

  /** Opens the destructive confirmation dialog for reset and clear actions. */
  function requestDataAction(action: ConfirmDataAction): void {
    if (isBusy) {
      return
    }

    if (isDirty) {
      setError('Save or discard category changes before replacing data.')
      return
    }

    setConfirmDataAction(action)
    setError(null)
  }

  /** Updates interface size locally before scheduling the page-wide recalculation. */
  function handleInterfaceSizeChange(nextInterfaceSize: InterfaceSize): void {
    setLocalInterfaceSize(nextInterfaceSize)
    startTransition(() => {
      onInterfaceSizeChange(nextInterfaceSize)
    })
  }

  /** Updates sort selection locally before scheduling the visible section recalculation. */
  function handleSortModeChange(nextSortMode: SortMode): void {
    setLocalSortMode(nextSortMode)
    startTransition(() => {
      onSortModeChange(nextSortMode)
    })
  }

  /** Runs the confirmed destructive data replacement action. */
  async function handleConfirmDataAction(): Promise<void> {
    if (!confirmDataAction || isBusy) {
      return
    }

    setBusyAction(confirmDataAction)
    setError(null)

    try {
      if (confirmDataAction === 'reset') {
        await resetDeckToDefaults()
        toast.success('Default data restored.')
      } else {
        await clearDeckData()
        toast.success('Data cleared.')
      }

      setConfirmDataAction(null)
      setBusyAction(null)
      onOpenChange(false)
    } catch (dataError) {
      setError(getDialogErrorMessage(dataError))
      setBusyAction(null)
    }
  }

  /** Intercepts unsaved changes before closing the dialog. */
  function requestClose(): void {
    if (isBusy) {
      return
    }

    if (isDirty) {
      setDiscardDialogOpen(true)
      return
    }

    onOpenChange(false)
  }

  return (
    <>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          interfaceSizeConfig.dialog.surfaceClassName,
          'grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0',
        )}
        showCloseButton={false}
        onEscapeKeyDown={event => {
          event.preventDefault()

          if (editingCategoryId) {
            cancelRename()
            return
          }

          requestClose()
        }}
        onPointerDownOutside={event => {
          if (discardDialogOpen) {
            return
          }

          event.preventDefault()
          requestClose()
        }}
      >
        <DialogHeader className={cn('border-b px-4 py-4 sm:px-6', interfaceSizeConfig.dialog.headerClassName)}>
          <DialogTitle className={interfaceSizeConfig.dialog.titleClassName}>Preferences</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]">
          <nav
            className="flex gap-1 overflow-x-auto border-b bg-muted/40 p-2 sm:flex-col sm:border-r sm:border-b-0"
            aria-label="Preferences navigation"
          >
            {PREFERENCES_TABS.map(tab => (
              <Button
                key={tab.value}
                type="button"
                variant={activeTab === tab.value ? 'secondary' : 'ghost'}
                size={interfaceSizeConfig.control.buttonSize}
                className="justify-start"
                aria-current={activeTab === tab.value ? 'page' : undefined}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </nav>

          <section className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
            {activeTab === 'general' ? (
              <div className={cn('max-w-none', interfaceSizeConfig.dialog.formClassName)}>
                <div className={interfaceSizeConfig.dialog.fieldClassName}>
                  <InterfaceSizePicker value={localInterfaceSize} onChange={handleInterfaceSizeChange} />
                </div>

                <div className={interfaceSizeConfig.dialog.fieldClassName}>
                  <Label htmlFor="settings-sort-mode" className={interfaceSizeConfig.control.labelClassName}>
                    Sort order
                  </Label>
                  <Select
                    value={localSortMode}
                    onValueChange={value => {
                      handleSortModeChange(value as SortMode)
                    }}
                  >
                    <SelectTrigger
                      id="settings-sort-mode"
                      className={cn('w-full bg-card', interfaceSizeConfig.control.inputClassName)}
                    >
                      <SelectValue placeholder="Select a sort order">{SORT_LABELS[localSortMode]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        {Object.entries(SORT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className={interfaceSizeConfig.dialog.fieldClassName}>
                  <Label htmlFor="settings-language" className={interfaceSizeConfig.control.labelClassName}>
                    Display language
                  </Label>
                  <Select
                    value={displayLanguage}
                    disabled
                    onValueChange={value => setDisplayLanguage(value as DisplayLanguage)}
                  >
                    <SelectTrigger
                      id="settings-language"
                      className={cn('w-full bg-card', interfaceSizeConfig.control.inputClassName)}
                    >
                      <SelectValue placeholder="Select a language">
                        {DISPLAY_LANGUAGE_LABELS[displayLanguage]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        {Object.entries(DISPLAY_LANGUAGE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Link Deck currently ships with English interface copy.
                  </p>
                </div>

                {error ? (
                  <p
                    id={errorId}
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            ) : activeTab === 'data' ? (
              <div className={cn('max-w-xl', interfaceSizeConfig.dialog.formClassName)}>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={event => void handleImportFileChange(event)}
                />

                {isDirty ? (
                  <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                    Save or discard category changes before importing, resetting, or clearing data.
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-sm font-medium">Import backup</p>
                  <Button
                    type="button"
                    variant="outline"
                    size={interfaceSizeConfig.control.buttonSize}
                    className="w-full sm:w-32"
                    disabled={!canUseDataControls}
                    onClick={requestImportDeck}
                  >
                    <Download data-icon="inline-start" aria-hidden="true" />
                    {busyAction === 'import' ? 'Importing...' : 'Import'}
                  </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-sm font-medium">Export backup</p>
                  <Button
                    type="button"
                    variant="outline"
                    size={interfaceSizeConfig.control.buttonSize}
                    className="w-full sm:w-32"
                    aria-busy={busyAction === 'export'}
                    disabled={!canUseDataControls}
                    onClick={() => void handleExportDeck()}
                  >
                    <Upload data-icon="inline-start" aria-hidden="true" />
                    Export
                  </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-sm font-medium">Reset to defaults</p>
                  <Button
                    type="button"
                    variant="outline"
                    size={interfaceSizeConfig.control.buttonSize}
                    className="w-full sm:w-32"
                    disabled={!canUseDataControls}
                    onClick={() => requestDataAction('reset')}
                  >
                    <RotateCcw data-icon="inline-start" aria-hidden="true" />
                    Reset
                  </Button>
                </div>

                <div className="flex flex-col gap-3 rounded-md bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 text-sm font-medium">Clear data</p>
                  <Button
                    type="button"
                    variant="outline"
                    size={interfaceSizeConfig.control.buttonSize}
                    className="w-full sm:w-32"
                    disabled={!canUseDataControls}
                    onClick={() => requestDataAction('clear')}
                  >
                    <Eraser data-icon="inline-start" aria-hidden="true" />
                    Clear data
                  </Button>
                </div>

                {error ? (
                  <p
                    id={errorId}
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className={interfaceSizeConfig.dialog.formClassName}>
                <form onSubmit={handleAddCategory}>
                  <div className="min-w-0 flex-1">
                    <Label
                      className={cn('sr-only', interfaceSizeConfig.control.labelClassName)}
                      htmlFor="preferences-category-new-name"
                    >
                      New category name
                    </Label>
                    <Input
                      ref={newNameInputRef}
                      id="preferences-category-new-name"
                      className={interfaceSizeConfig.control.inputClassName}
                      value={newName}
                      disabled={isBusy}
                      placeholder="New category name, press Enter to add"
                      onChange={event => setNewName(event.target.value)}
                      onKeyDown={handleNewCategoryKeyDown}
                    />
                  </div>
                </form>

                <div className="flex flex-col gap-2">
                  <DndContext
                    sensors={categorySensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictCategoryDragToListBounds]}
                    onDragStart={handleCategoryDragStart}
                    onDragEnd={handleCategoryDragEnd}
                    onDragCancel={handleCategoryDragCancel}
                  >
                    <SortableContext
                      items={sortedCategories.map(category => category.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div ref={categoryListRef} className="flex flex-col gap-2">
                        {sortedCategories.map(category => {
                          const isEditing = editingCategoryId === category.id
                          const isBuiltInDefault = isDefaultCategory(category.id)

                          return (
                            <SortableCategoryRow
                              key={category.id}
                              category={category}
                              disabled={isBusy || isEditing}
                              interfaceSizeConfig={interfaceSizeConfig}
                              dragContent={
                                <div className="min-w-0 flex-1">
                                  {isEditing ? (
                                    <Label
                                      className={cn('sr-only', interfaceSizeConfig.control.labelClassName)}
                                      htmlFor={`preferences-category-edit-${category.id}`}
                                    >
                                      Category name
                                    </Label>
                                  ) : null}
                                  {isEditing ? (
                                    <Input
                                      ref={editingNameInputRef}
                                      id={`preferences-category-edit-${category.id}`}
                                      value={editingName}
                                      disabled={isBusy}
                                      className={interfaceSizeConfig.control.inputClassName}
                                      onChange={event => setEditingName(event.target.value)}
                                      onKeyDown={event => handleEditCategoryKeyDown(event, category.id)}
                                    />
                                  ) : (
                                    <span className="block truncate text-sm font-medium" title={category.name}>
                                      {category.name}
                                    </span>
                                  )}
                                </div>
                              }
                              actions={
                                isEditing ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size={interfaceSizeConfig.control.iconButtonSize}
                                      disabled={isBusy}
                                      aria-label="Cancel rename"
                                      onClick={cancelRename}
                                    >
                                      <X aria-hidden="true" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size={interfaceSizeConfig.control.iconButtonSize}
                                      disabled={isBusy}
                                      aria-label={`Save ${category.name}`}
                                      onClick={() => handleRename(category.id)}
                                    >
                                      <Check aria-hidden="true" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {isBuiltInDefault ? null : (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size={interfaceSizeConfig.control.iconButtonSize}
                                        disabled={isBusy || !canDeleteCategory}
                                        aria-label={
                                          canDeleteCategory
                                            ? `Delete ${category.name}`
                                            : 'The last category cannot be deleted'
                                        }
                                        onClick={() => requestDelete(category)}
                                      >
                                        <Trash2 aria-hidden="true" />
                                      </Button>
                                    )}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size={interfaceSizeConfig.control.iconButtonSize}
                                      disabled={isBusy}
                                      aria-label={`Rename ${category.name}`}
                                      onClick={() => startRename(category)}
                                    >
                                      <Pencil aria-hidden="true" />
                                    </Button>
                                  </>
                                )
                              }
                            />
                          )
                        })}
                      </div>
                    </SortableContext>
                    {createPortal(
                      <DragOverlay dropAnimation={null}>
                        {activeCategory ? (
                          <div
                            className="pointer-events-none"
                            style={{
                              width: activeCategoryWidth ?? undefined,
                            }}
                          >
                            <CategoryDragOverlayRow
                              category={activeCategory}
                              interfaceSizeConfig={interfaceSizeConfig}
                            />
                          </div>
                        ) : null}
                      </DragOverlay>,
                      document.body,
                    )}
                  </DndContext>
                </div>

                {pendingDeleteCategory ? (
                  <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-card p-3">
                    <div className="flex flex-col gap-1">
                      <p className="wrap-break-word text-sm font-medium text-destructive">
                        Delete "{pendingDeleteCategory.name}"
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This category contains {pendingDeleteLinkCount} links. Choose an action before deleting.
                      </p>
                    </div>

                    <div className={interfaceSizeConfig.dialog.gridClassName}>
                      <div className={interfaceSizeConfig.dialog.fieldClassName}>
                        <Label
                          htmlFor="preferences-category-delete-mode"
                          className={interfaceSizeConfig.control.labelClassName}
                        >
                          Action
                        </Label>
                        <Select
                          value={deleteMode}
                          disabled={isBusy}
                          onValueChange={value => setDeleteMode(value as DeleteMode)}
                        >
                          <SelectTrigger
                            id="preferences-category-delete-mode"
                            className={cn('w-full', interfaceSizeConfig.control.inputClassName)}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="move-links">Move to another category</SelectItem>
                              <SelectItem value="delete-links">Delete links too</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {deleteMode === 'move-links' ? (
                        <div className={interfaceSizeConfig.dialog.fieldClassName}>
                          <Label
                            htmlFor="preferences-category-delete-target"
                            className={interfaceSizeConfig.control.labelClassName}
                          >
                            Target category
                          </Label>
                          <Select
                            value={effectiveTargetCategoryId}
                            disabled={isBusy}
                            onValueChange={setTargetCategoryId}
                          >
                            <SelectTrigger
                              id="preferences-category-delete-target"
                              className={cn('w-full', interfaceSizeConfig.control.inputClassName)}
                              aria-invalid={!targetCategoryId && Boolean(error)}
                            >
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {otherCategories.map(category => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size={interfaceSizeConfig.control.buttonSize}
                        disabled={isBusy}
                        onClick={() => {
                          setPendingDeleteCategoryId(null)
                          setError(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size={interfaceSizeConfig.control.buttonSize}
                        disabled={isBusy}
                        onClick={confirmPendingDelete}
                      >
                        Confirm delete
                      </Button>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <p
                    id={errorId}
                    role="alert"
                    className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className={cn('border-t px-4 py-2 sm:px-6', interfaceSizeConfig.dialog.footerClassName)}>
          {activeTab === 'categories' ? (
            <>
              <Button
                type="button"
                variant="outline"
                size={interfaceSizeConfig.control.buttonSize}
                disabled={isBusy}
                onClick={requestClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size={interfaceSizeConfig.control.buttonSize}
                disabled={isBusy || !isDirty}
                onClick={() => void handleSaveDraft()}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={isBusy}
              onClick={requestClose}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <AlertDialog
        open={confirmDataAction !== null}
        onOpenChange={open => {
          if (!open && !isBusy) {
            setConfirmDataAction(null)
          }
        }}
      >
        <AlertDialogContent size="default" className={interfaceSizeConfig.dialog.contentClassName}>
          <AlertDialogHeader className={interfaceSizeConfig.dialog.headerClassName}>
            <AlertDialogTitle className={interfaceSizeConfig.dialog.titleClassName}>
              {confirmDataAction === 'reset' ? 'Reset to default data?' : 'Clear all data?'}
            </AlertDialogTitle>
            <AlertDialogDescription className={interfaceSizeConfig.dialog.descriptionClassName}>
              {confirmDataAction === 'reset'
                ? 'This will replace all current links, categories, local icons, and settings with the bundled default data.'
                : 'This will delete all links, local icons, and custom categories. One default category will remain.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={interfaceSizeConfig.dialog.footerClassName}>
            <AlertDialogCancel size={interfaceSizeConfig.control.buttonSize} disabled={isBusy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={isBusy}
              onClick={() => void handleConfirmDataAction()}
            >
              {busyAction === 'reset'
                ? 'Resetting...'
                : busyAction === 'clear'
                  ? 'Clearing...'
                  : confirmDataAction === 'reset'
                    ? 'Reset'
                    : 'Clear data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent size="default" className={interfaceSizeConfig.dialog.contentClassName}>
          <AlertDialogHeader className={interfaceSizeConfig.dialog.headerClassName}>
            <AlertDialogTitle className={interfaceSizeConfig.dialog.titleClassName}>
              Discard unsaved changes?
            </AlertDialogTitle>
            <AlertDialogDescription className={interfaceSizeConfig.dialog.descriptionClassName}>
              Closing will discard category additions, renames, deletions, and ordering changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={interfaceSizeConfig.dialog.footerClassName}>
            <AlertDialogCancel size={interfaceSizeConfig.control.buttonSize} disabled={isBusy}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
