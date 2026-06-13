// Main deck board UI module that composes toolbar, search, and link sections.

import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { DragDropProvider, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/react'

import { DeckToolbar } from './components/deck-toolbar'
import { CategorySection } from './components/category-section'
import { DeckEmptyState } from './components/deck-empty-state'
import { LinkSearchBox } from './components/link-search-box'
import type { DeckLinkHandlers, IconFileLoader } from './deck-board-types'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { SettingsTab } from '@/app/settings/types'
import type { VisibleCategorySection } from '@/domain/deck/types'
import { cn } from '@/lib/utils'

type DeckBoardViewProps = {
  displaySizeConfig: DisplaySizeConfig
  error: string | null
  loadStoredIconFile: IconFileLoader
  hasQuery: boolean
  initialized: boolean
  isLinkDragEnabled: boolean
  query: string
  sections: VisibleCategorySection[]
  onAddLinkToCategory: (categoryId: string) => void
  onCreateLinkFromToolbar: () => void
  onLinkDragEnd: (event: DragEndEvent) => void
  onLinkDragOver: (event: DragOverEvent) => void
  onLinkDragStart: (event: DragStartEvent) => void
  onOpenSettings: (tab?: SettingsTab) => void
  onSearchChange: (query: string) => void
  onSearchFocus: () => void
} & DeckLinkHandlers

const linkDragSensors = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 6 })],
    activatorElements(source) {
      return [source.element, source.handle]
    },
    preventActivation(_event, source) {
      return source.type !== 'link'
    },
  }),
]

/** Composes the visible deck area while keeping drag provider setup close to the section list. */
export function DeckBoardView({
  displaySizeConfig,
  error,
  loadStoredIconFile,
  hasQuery,
  initialized,
  isLinkDragEnabled,
  query,
  sections,
  onAddLinkToCategory,
  onCreateLinkFromToolbar,
  onDeleteLink,
  onEditLink,
  onLinkDragEnd,
  onLinkDragOver,
  onLinkDragStart,
  onOpenLinkInNewWindow,
  onOpenSettings,
  onSearchChange,
  onSearchFocus,
}: DeckBoardViewProps) {
  const sectionList = (
    <div className={displaySizeConfig.page.stackClassName}>
      {sections.map((section, categoryIndex) => (
        <CategorySection
          key={section.category.id}
          section={section}
          displaySizeConfig={displaySizeConfig}
          categoryIndex={categoryIndex}
          isDragEnabled={isLinkDragEnabled}
          showAddLinkCard={!hasQuery && section.links.length === 0}
          onOpenLinkInNewWindow={onOpenLinkInNewWindow}
          onAddLink={onAddLinkToCategory}
          onEditLink={onEditLink}
          onDeleteLink={onDeleteLink}
          loadStoredIconFile={loadStoredIconFile}
        />
      ))}
    </div>
  )

  return (
    <>
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
        <div className={cn(displaySizeConfig.page.className, displaySizeConfig.page.stackClassName, 'min-h-0')}>
          <DeckToolbar
            displaySizeConfig={displaySizeConfig}
            onAddLink={onCreateLinkFromToolbar}
            onOpenSettings={onOpenSettings}
          />

          <LinkSearchBox
            value={query}
            onChange={onSearchChange}
            onFocus={onSearchFocus}
            displaySizeConfig={displaySizeConfig}
          />
        </div>
      </div>

      <div className="overflow-x-clip">
        <div className={cn(displaySizeConfig.page.className, displaySizeConfig.page.stackClassName, 'min-h-0')}>
          {sections.length > 0 ? (
            isLinkDragEnabled ? (
              <DragDropProvider
                sensors={linkDragSensors}
                onDragStart={onLinkDragStart}
                onDragOver={onLinkDragOver}
                onDragEnd={onLinkDragEnd}
              >
                {sectionList}
              </DragDropProvider>
            ) : (
              sectionList
            )
          ) : !initialized ? null : error ? null : (
            <DeckEmptyState hasQuery={hasQuery} />
          )}
        </div>
      </div>
    </>
  )
}
