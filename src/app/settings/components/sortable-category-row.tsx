// Sortable category row used by the settings categories panel.

import type { ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { Category } from '@/domain/deck/types'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

export const CATEGORY_PANEL_CONTROL_TAB_INDEX = -1

type SortableCategoryRowProps = {
  actions: ReactNode
  category: Category
  disabled: boolean
  dragContent: ReactNode
  displaySizeConfig: DisplaySizeConfig
}

/** Adds a full-row drag area to category rows while keeping right-side action buttons independent. */
export function SortableCategoryRow({
  actions,
  category,
  disabled,
  dragContent,
  displaySizeConfig,
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
        tabIndex: CATEGORY_PANEL_CONTROL_TAB_INDEX,
      }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(displaySizeConfig.dialog.rowClassName, isDragging && 'invisible')}
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

      <div className={displaySizeConfig.dialog.rowActionsClassName}>{actions}</div>
    </div>
  )
}
