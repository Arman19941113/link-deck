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
import type { DesignStylePreference } from '@/domain/settings/design-style'
import { cn } from '@/lib/utils'

type DeckBoardViewProps = {
  displaySizeConfig: DisplaySizeConfig
  designStylePreference: DesignStylePreference
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
  onDialogTriggerPointerDown?: () => void
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
  designStylePreference,
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
  onDialogTriggerPointerDown,
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
          onDialogTriggerPointerDown={onDialogTriggerPointerDown}
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
      <div className="app-top-bar sticky top-0 z-20 border-b border-border/60 backdrop-blur">
        <div className={cn(displaySizeConfig.page.className, displaySizeConfig.page.stackClassName, 'min-h-0')}>
          <DeckToolbar
            designStylePreference={designStylePreference}
            displaySizeConfig={displaySizeConfig}
            onAddLink={onCreateLinkFromToolbar}
            onDialogTriggerPointerDown={onDialogTriggerPointerDown}
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
