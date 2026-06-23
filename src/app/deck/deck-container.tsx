// Deck feature container that coordinates drag previews before rendering the deck view.

import { useMemo } from 'react'

import { DeckBoardView } from './deck-board-view'
import type { DeckLinkHandlers, IconFileLoader } from './deck-board-types'
import { useLinkDragPreview } from './hooks/use-link-drag-preview'
import type { DisplaySizeConfig } from '@/app/display-size-config'
import type { SettingsTab } from '@/app/settings/types'
import { selectRenderableSections } from '@/domain/deck/selectors'
import type { SortMode } from '@/domain/deck/sort-mode'
import type { Category, VisibleCategorySection, SavedLink } from '@/domain/deck/types'
import type { DesignStylePreference } from '@/domain/settings/design-style'

type DeckContainerProps = {
  categories: Category[]
  links: SavedLink[]
  designStylePreference: DesignStylePreference
  displaySizeConfig: DisplaySizeConfig
  error: string | null
  loadStoredIconFile: IconFileLoader
  initialized: boolean
  query: string
  sortMode: SortMode
  filteredSections: VisibleCategorySection[]
  onAddLinkToCategory: (categoryId: string) => void
  onCreateLinkFromToolbar: () => void
  onMoveLinkToCategory: (activeLinkId: string, categoryId: string, index: number) => Promise<void>
  onOpenSettings: (tab?: SettingsTab) => void
  onSearchChange: (query: string) => void
  onSearchFocus: () => void
} & DeckLinkHandlers

/** Coordinates deck-only interaction state and passes render-ready props to DeckBoardView. */
export function DeckContainer({
  categories,
  links,
  designStylePreference,
  displaySizeConfig,
  error,
  loadStoredIconFile,
  initialized,
  query,
  sortMode,
  filteredSections,
  onAddLinkToCategory,
  onCreateLinkFromToolbar,
  onDeleteLink,
  onHomeFocusCapture,
  onEditLink,
  onMoveLinkToCategory,
  onOpenLinkInNewWindow,
  onOpenSettings,
  onSearchChange,
  onSearchFocus,
}: DeckContainerProps) {
  const hasQuery = query.trim().length > 0
  const isLinkDragEnabled = sortMode === 'manual' && !hasQuery
  const { previewSections, handleLinkDragEnd, handleLinkDragOver, handleLinkDragStart } = useLinkDragPreview({
    categories,
    links,
    baseSections: filteredSections,
    isLinkDragEnabled,
    moveLinkToCategory: onMoveLinkToCategory,
  })
  const renderSections = useMemo(
    () =>
      selectRenderableSections({
        categories,
        includeEmptyCategories: !hasQuery,
        sections: previewSections,
      }),
    [categories, hasQuery, previewSections],
  )

  return (
    <DeckBoardView
      designStylePreference={designStylePreference}
      displaySizeConfig={displaySizeConfig}
      error={error}
      loadStoredIconFile={loadStoredIconFile}
      hasQuery={hasQuery}
      initialized={initialized}
      isLinkDragEnabled={isLinkDragEnabled}
      query={query}
      sections={renderSections}
      onAddLinkToCategory={onAddLinkToCategory}
      onCreateLinkFromToolbar={onCreateLinkFromToolbar}
      onDeleteLink={onDeleteLink}
      onHomeFocusCapture={onHomeFocusCapture}
      onEditLink={onEditLink}
      onLinkDragStart={handleLinkDragStart}
      onLinkDragOver={handleLinkDragOver}
      onLinkDragEnd={handleLinkDragEnd}
      onOpenLinkInNewWindow={onOpenLinkInNewWindow}
      onOpenSettings={onOpenSettings}
      onSearchChange={onSearchChange}
      onSearchFocus={onSearchFocus}
    />
  )
}
