// Add-link card used as the inline creation entry at the end of each category grid.

import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { DisplaySizeConfig } from '@/app/display-size-config'
import { cn } from '@/lib/utils'

type AddLinkCardProps = {
  displaySizeConfig: DisplaySizeConfig
  categoryName: string
  onAddLink: () => void
}

/** Shows a fixed-size card that starts a new link in the current category. */
export function AddLinkCard({ displaySizeConfig, categoryName, onAddLink }: AddLinkCardProps) {
  const { t } = useTranslation()
  const cardConfig = displaySizeConfig.card

  return (
    <button
      type="button"
      aria-label={t('deck.addCard.description', { categoryName })}
      tabIndex={-1}
      className={cn(
        'group flex h-full w-full cursor-pointer items-center rounded-md border border-dashed border-border/70 bg-transparent text-left text-muted-foreground outline-none transition-[background-color,border-color,box-shadow,color,translate] duration-300 ease-app-hover hover:-translate-y-px hover:border-accent/35 hover:bg-card/35 hover:text-foreground hover:shadow-(--app-card-hover-shadow) focus-visible:border-ring/40 focus-visible:ring-[3px] focus-visible:ring-ring/35 motion-reduce:hover:translate-y-0 motion-reduce:transition-none',
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
        <span className={cn('truncate', cardConfig.addTitleClassName)}>{t('deck.addCard.title')}</span>
        <span className={cardConfig.addNoteClassName}>{t('deck.addCard.description', { categoryName })}</span>
      </span>
    </button>
  )
}
