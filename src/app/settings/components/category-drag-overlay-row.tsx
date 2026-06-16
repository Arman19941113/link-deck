// Drag overlay row snapshot for the settings categories panel.

import { GripVertical, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { isDefaultCategory } from '@/domain/deck/categories'
import type { Category } from '@/domain/deck/types'
import { cn } from '@/lib/utils'

type CategoryDragOverlayRowProps = {
  category: Category
}

/** Renders a top-level category row snapshot while dragging so dialog content does not clip it. */
export function CategoryDragOverlayRow({ category }: CategoryDragOverlayRowProps) {
  const isBuiltInDefault = isDefaultCategory(category.id)

  return (
    <div className={cn('flex h-12 items-center rounded-md border bg-card', 'border-accent shadow-lg')}>
      <div className="flex min-w-0 flex-1 items-center gap-2 p-2">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium" title={category.name}>
            {category.name}
          </span>
        </div>
      </div>

      <div className="flex w-20 shrink-0 items-center justify-end gap-2 p-2 pl-0">
        {isBuiltInDefault ? null : (
          <Button type="button" variant="ghost" size="icon-sm" aria-hidden="true" tabIndex={-1}>
            <Trash2 aria-hidden="true" />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-sm" aria-hidden="true" tabIndex={-1}>
          <Pencil aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
