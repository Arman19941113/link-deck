// Category section that shows the category title and its link grid.

import type { CSSProperties } from 'react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useSortable } from '@dnd-kit/react/sortable'

import { AddLinkCard } from '@/components/add-link-card'
import { LinkCard } from '@/components/link-card'
import { SortableLinkCard } from '@/components/sortable-link-card'
import { getDisplaySizeConfig } from '@/domain/display-size'
import type { CategorySection as CategorySectionData, IconFile, DisplaySize, Link } from '@/domain/types'

type CategorySectionProps = {
  section: CategorySectionData
  displaySize: DisplaySize
  categoryIndex?: number
  isDragEnabled?: boolean
  showAddLinkCard?: boolean
  onOpenLink: (link: Link, options?: { newWindow?: boolean }) => boolean
  onAddLink: (categoryId: string) => void
  onEditLink: (link: Link) => void
  onDeleteLink: (link: Link) => Promise<void>
  getIconFile: (id: string) => Promise<IconFile | undefined>
}

/** Renders a category title and responsive card grid. */
export function CategorySection({
  section,
  displaySize,
  categoryIndex = 0,
  isDragEnabled = false,
  showAddLinkCard = false,
  onOpenLink,
  onAddLink,
  onEditLink,
  onDeleteLink,
  getIconFile,
}: CategorySectionProps) {
  const links = section.links ?? []
  const displaySizeConfig = getDisplaySizeConfig(displaySize)
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
      displaySize={displaySize}
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
              onOpenLink={onOpenLink}
              onEditLink={onEditLink}
              onDeleteLink={onDeleteLink}
              getIconFile={getIconFile}
              displaySize={displaySize}
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
              onOpenLink={onOpenLink}
              onEditLink={onEditLink}
              onDeleteLink={onDeleteLink}
              getIconFile={getIconFile}
              displaySize={displaySize}
            />
          ))}
          {showAddLinkCard ? addLinkCard : null}
        </div>
      )}
    </section>
  )
}
