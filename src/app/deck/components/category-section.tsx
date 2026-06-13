// Category section that shows the category title and its link grid.

import type { CSSProperties } from 'react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useSortable } from '@dnd-kit/react/sortable'

import { AddLinkCard } from '@/app/deck/components/link-card'
import { LinkCard, SortableLinkCard } from '@/app/deck/components/link-card'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { DeckLinkHandlers, IconFileLoader } from '@/app/deck/deck-board-types'
import type { VisibleCategorySection } from '@/domain/deck/types'

type CategorySectionProps = {
  section: VisibleCategorySection
  displaySizeConfig: DisplaySizeConfig
  categoryIndex?: number
  isDragEnabled?: boolean
  showAddLinkCard?: boolean
  onAddLink: (categoryId: string) => void
  loadStoredIconFile: IconFileLoader
} & DeckLinkHandlers

/** Renders a category title and responsive card grid. */
export function CategorySection({
  section,
  displaySizeConfig,
  categoryIndex = 0,
  isDragEnabled = false,
  showAddLinkCard = false,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onOpenLinkInNewWindow,
  loadStoredIconFile,
}: CategorySectionProps) {
  const links = section.links ?? []
  const { ref: categoryRef } = useSortable({
    id: section.category.id,
    accept: ['link'],
    collisionPriority: CollisionPriority.Low,
    data: {
      categoryId: section.category.id,
      type: 'category',
    },
    disabled: !isDragEnabled,
    index: categoryIndex,
    type: 'category',
  })
  const linkGridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${displaySizeConfig.card.minColumnWidth}), 1fr))`,
    gridAutoRows: displaySizeConfig.card.height,
  }
  const addLinkCard = (
    <AddLinkCard
      displaySizeConfig={displaySizeConfig}
      categoryName={section.category.name}
      onAddLink={() => onAddLink(section.category.id)}
    />
  )

  return (
    <section
      ref={categoryRef}
      className={displaySizeConfig.section.className}
      aria-labelledby={`category-${section.category.id}`}
    >
      <div className="flex items-end">
        <h2
          id={`category-${section.category.id}`}
          className={displaySizeConfig.section.titleClassName}
          title={section.category.name}
        >
          {section.category.name}
        </h2>
      </div>

      {isDragEnabled ? (
        <div className={displaySizeConfig.card.gridClassName} style={linkGridStyle}>
          {links.map((link, index) => (
            <SortableLinkCard
              key={link.id}
              link={link}
              categoryId={section.category.id}
              index={index}
              onOpenLinkInNewWindow={onOpenLinkInNewWindow}
              onEditLink={onEditLink}
              onDeleteLink={onDeleteLink}
              loadStoredIconFile={loadStoredIconFile}
              displaySizeConfig={displaySizeConfig}
            />
          ))}
          {showAddLinkCard ? <div className="h-full">{addLinkCard}</div> : null}
        </div>
      ) : (
        <div className={displaySizeConfig.card.gridClassName} style={linkGridStyle}>
          {links.map(link => (
            <LinkCard
              key={link.id}
              link={link}
              onOpenLinkInNewWindow={onOpenLinkInNewWindow}
              onEditLink={onEditLink}
              onDeleteLink={onDeleteLink}
              loadStoredIconFile={loadStoredIconFile}
              displaySizeConfig={displaySizeConfig}
            />
          ))}
          {showAddLinkCard ? addLinkCard : null}
        </div>
      )}
    </section>
  )
}
