// Categories settings panel for immediate category editing and ordering.

import { createPortal } from 'react-dom'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Check, Pencil, Trash2, X } from 'lucide-react'

import { CategoryDragOverlayRow } from './components/category-drag-overlay-row'
import { CATEGORY_PANEL_CONTROL_TAB_INDEX, SortableCategoryRow } from './components/sortable-category-row'
import type { useCategorySettingsViewModel } from './hooks/use-category-settings-view-model'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isDefaultCategory } from '@/domain/deck/categories'

type CategorySettingsPanelViewModel = Pick<
  ReturnType<typeof useCategorySettingsViewModel>,
  | 'categoryRows'
  | 'canDeleteCategory'
  | 'categoryListRef'
  | 'draggedCategory'
  | 'draggedCategoryWidth'
  | 'editingCategoryId'
  | 'editingCategoryName'
  | 'editingCategoryNameInputRef'
  | 'handleAddCategory'
  | 'handleCategoryDragCancel'
  | 'handleCategoryDragEnd'
  | 'handleCategoryDragStart'
  | 'handleEditCategoryKeyDown'
  | 'handleNewCategoryKeyDown'
  | 'handleRename'
  | 'newCategoryName'
  | 'newCategoryNameInputRef'
  | 'requestDelete'
  | 'setEditingCategoryName'
  | 'setNewCategoryName'
  | 'cancelRename'
  | 'startRename'
>

type CategoriesSettingsPanelProps = {
  viewModel: CategorySettingsPanelViewModel
}

/** Renders the local category editor with drag sorting and immediate deletion. */
export function CategoriesSettingsPanel({ viewModel }: CategoriesSettingsPanelProps) {
  const {
    categoryRows,
    canDeleteCategory,
    categoryListRef,
    draggedCategory,
    draggedCategoryWidth,
    editingCategoryId,
    editingCategoryName,
    editingCategoryNameInputRef,
    handleAddCategory,
    handleCategoryDragCancel,
    handleCategoryDragEnd,
    handleCategoryDragStart,
    handleEditCategoryKeyDown,
    handleNewCategoryKeyDown,
    handleRename,
    newCategoryName,
    newCategoryNameInputRef,
    requestDelete,
    setEditingCategoryName,
    setNewCategoryName,
    startRename,
    cancelRename,
  } = viewModel
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

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAddCategory}>
        <div className="min-w-0 flex-1">
          <Label className="sr-only text-sm" htmlFor="settings-category-new-name">
            New category name
          </Label>
          <Input
            ref={newCategoryNameInputRef}
            id="settings-category-new-name"
            className="h-11 rounded-md px-3 text-base md:text-sm"
            value={newCategoryName}
            placeholder="New category name, press Enter to add"
            onChange={event => setNewCategoryName(event.target.value)}
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
          <SortableContext items={categoryRows.map(category => category.id)} strategy={verticalListSortingStrategy}>
            <div ref={categoryListRef} className="flex flex-col gap-2">
              {categoryRows.map(category => {
                const isEditing = editingCategoryId === category.id
                const isBuiltInDefault = isDefaultCategory(category.id)

                return (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    disabled={isEditing}
                    dragContent={
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <Label className="sr-only text-sm" htmlFor={`settings-category-edit-${category.id}`}>
                            Category name
                          </Label>
                        ) : null}
                        {isEditing ? (
                          <Input
                            ref={editingCategoryNameInputRef}
                            id={`settings-category-edit-${category.id}`}
                            value={editingCategoryName}
                            className="h-11 rounded-md px-3 text-base md:text-sm"
                            onChange={event => setEditingCategoryName(event.target.value)}
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
                            size="icon-sm"
                            tabIndex={CATEGORY_PANEL_CONTROL_TAB_INDEX}
                            aria-label="Cancel rename"
                            onClick={cancelRename}
                          >
                            <X aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            tabIndex={CATEGORY_PANEL_CONTROL_TAB_INDEX}
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
                              size="icon-sm"
                              disabled={!canDeleteCategory}
                              tabIndex={CATEGORY_PANEL_CONTROL_TAB_INDEX}
                              aria-label={
                                canDeleteCategory ? `Delete ${category.name}` : 'The last category cannot be deleted'
                              }
                              onClick={() => requestDelete(category)}
                            >
                              <Trash2 aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            tabIndex={CATEGORY_PANEL_CONTROL_TAB_INDEX}
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
              {draggedCategory ? (
                <div
                  className="pointer-events-none"
                  style={{
                    width: draggedCategoryWidth ?? undefined,
                  }}
                >
                  <CategoryDragOverlayRow category={draggedCategory} />
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
        </DndContext>
      </div>
    </div>
  )
}
