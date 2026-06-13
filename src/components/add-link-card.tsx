// Add-link card used as the inline creation entry at the end of each category grid.

import { Plus } from 'lucide-react'

import { getDisplaySizeConfig } from '@/domain/display-size'
import type { DisplaySize } from '@/domain/types'
import { cn } from '@/lib/utils'

type AddLinkCardProps = {
  displaySize: DisplaySize
  categoryName: string
  onAddLink: () => void
}

/** Shows a fixed-size card that starts a new link in the current category. */
export function AddLinkCard({ displaySize, categoryName, onAddLink }: AddLinkCardProps) {
  const cardConfig = getDisplaySizeConfig(displaySize).card

  return (
    <button
      type="button"
      aria-label={`Add link to ${categoryName}`}
      tabIndex={-1}
      className={cn(
        'group flex h-full w-full cursor-pointer items-center rounded-md border border-dashed border-border/70 bg-transparent text-left text-muted-foreground outline-none transition-[background-color,border-color,box-shadow,color,translate] duration-300 ease-app-hover hover:-translate-y-px hover:border-accent/35 hover:bg-card/35 hover:text-foreground hover:shadow-[0_10px_22px_-20px_rgb(17_17_17/0.35)] focus-visible:border-ring/40 focus-visible:ring-[3px] focus-visible:ring-ring/35 motion-reduce:hover:translate-y-0 motion-reduce:transition-none dark:hover:shadow-[0_10px_24px_-20px_rgb(0_0_0/0.65)]',
        cardConfig.paddingClassName,
        cardConfig.contentGapClassName,
      )}
      onClick={onAddLink}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center border border-dashed border-border/70 bg-muted/25 text-muted-foreground transition-colors duration-300 ease-app-hover group-hover:border-accent/35 group-hover:bg-muted/40 group-hover:text-foreground motion-reduce:transition-none',
          cardConfig.addIconBoxClassName,
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
      </span>
      <span className={cn('flex min-w-0 flex-1 flex-col', cardConfig.textGapClassName)}>
        <span className={cn('truncate', cardConfig.addTitleClassName)}>Add link</span>
        <span className={cardConfig.addNoteClassName}>Save a new link to {categoryName}</span>
      </span>
    </button>
  )
}
