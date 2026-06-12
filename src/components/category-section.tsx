// Category section that shows the category title and its link grid.

import type { CSSProperties } from 'react'
import { CollisionPriority } from '@dnd-kit/abstract'
import { useSortable } from '@dnd-kit/react/sortable'

import { AddLinkCard } from '@/components/add-link-card'
import { LinkCard } from '@/components/link-card'
import { SortableLinkCard } from '@/components/sortable-link-card'
import { getInterfaceSizeConfig } from '@/domain/interface-size'
import type { CategorySection as CategorySectionData, IconFile, InterfaceSize, Link } from '@/domain/types'

type CategorySectionProps = {
  section: CategorySectionData
  interfaceSize: InterfaceSize
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
  interfaceSize,
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
  const interfaceSizeConfig = getInterfaceSizeConfig(interfaceSize)
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
    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${interfaceSizeConfig.card.minColumnWidth}), 1fr))`,
    gridAutoRows: interfaceSizeConfig.card.height,
  }
  const addLinkCard = (
    <AddLinkCard
      interfaceSize={interfaceSize}
      categoryName={section.category.name}
      onAddLink={() => onAddLink(section.category.id)}
    />
  )

  return (
    <section
      ref={categoryRef}
      className={interfaceSizeConfig.section.className}
      aria-labelledby={`category-${section.category.id}`}
    >
      <div className="flex items-end">
        <h2
          id={`category-${section.category.id}`}
          className={interfaceSizeConfig.section.titleClassName}
          title={section.category.name}
        >
          {section.category.name}
        </h2>
      </div>

      {isDragEnabled ? (
        <div className={interfaceSizeConfig.card.gridClassName} style={linkGridStyle}>
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
              interfaceSize={interfaceSize}
            />
          ))}
          {showAddLinkCard ? <div className="h-full">{addLinkCard}</div> : null}
        </div>
      ) : (
        <div className={interfaceSizeConfig.card.gridClassName} style={linkGridStyle}>
          {links.map(link => (
            <LinkCard
              key={link.id}
              link={link}
              onOpenLink={onOpenLink}
              onEditLink={onEditLink}
              onDeleteLink={onDeleteLink}
              getIconFile={getIconFile}
              interfaceSize={interfaceSize}
            />
          ))}
          {showAddLinkCard ? addLinkCard : null}
        </div>
      )}
    </section>
  )
}
