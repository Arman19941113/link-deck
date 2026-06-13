// Start page app shell that connects the deck store and composes the main page regions.

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Data, Draggable, Droppable } from '@dnd-kit/abstract'
import { PointerActivationConstraints, PointerSensor } from '@dnd-kit/dom'
import { move as moveSortableItems } from '@dnd-kit/helpers'
import { DragDropProvider, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/react'
import { toast } from 'sonner'

import { CategorySection } from '@/components/category-section'
import { AppTopBar } from '@/components/app-top-bar'
import { DeckEmptyState } from '@/components/deck-empty-state'
import { getFocusedLinkCardId } from '@/components/link-card-keyboard'
import { LinkSearchBox } from '@/components/link-search-box'
import { PreferencesDialog, type PreferencesTab } from '@/components/preferences-dialog'
import { LinkDialog } from '@/components/link-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getInterfaceSizeConfig } from '@/domain/interface-size'
import { preloadPinyinSearchModule } from '@/domain/pinyin-search-loader'
import type { Category, CategorySection as CategorySectionData, Link, ThemePreference } from '@/domain/types'
import { useDeckStore } from '@/hooks/use-deck-store'
import { cn } from '@/lib/utils'
import { applyThemePreference, storageService, subscribeThemePreference } from '@/services'

type LinkIdGroups = Record<string, string[]>

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

/** Gets the full manually ordered link sequence for a category so visible drop positions can map to real indexes. */
function getManuallySortedLinks(links: Link[], categoryId: string): Link[] {
  return links.filter(link => link.categoryId === categoryId).sort((left, right) => left.order - right.order)
}

/** Builds sortable id groups from persisted link records. */
function getLinkIdGroups(categories: Category[], links: Link[]): LinkIdGroups {
  const groups = Object.fromEntries(categories.map(category => [category.id, [] as string[]]))

  for (const category of categories) {
    groups[category.id] = getManuallySortedLinks(links, category.id).map(link => link.id)
  }

  return groups
}

/** Builds visible category sections from lightweight sortable id groups. */
function getSectionsFromLinkIdGroups(
  categories: Category[],
  links: Link[],
  groups: LinkIdGroups,
): CategorySectionData[] {
  const linkById = new Map(links.map(link => [link.id, link]))

  return [...categories]
    .sort((left, right) => left.order - right.order)
    .map(category => ({
      category,
      links: (groups[category.id] ?? [])
        .map(linkId => linkById.get(linkId))
        .filter((link): link is Link => Boolean(link)),
    }))
}

/** Compares sortable id groups so pointer moves that do not change a target avoid rerendering. */
function areLinkIdGroupsEqual(left: LinkIdGroups, right: LinkIdGroups): boolean {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(key => {
      const leftIds = left[key] ?? []
      const rightIds = right[key] ?? []

      return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index])
    })
  )
}

/** Finds the final category and index for a link in sortable id groups. */
function getLinkTargetFromGroups(groups: LinkIdGroups, linkId: string) {
  for (const [categoryId, linkIds] of Object.entries(groups)) {
    const index = linkIds.indexOf(linkId)

    if (index >= 0) {
      return { categoryId, index }
    }
  }

  return null
}

/** Reads link metadata attached to new dnd-kit sortable entities. */
function getLinkDragData(entity: Draggable<Data> | Droppable<Data> | null | undefined) {
  const data = entity?.data

  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    data.type === 'link' &&
    'linkId' in data &&
    typeof data.linkId === 'string'
  ) {
    return data as { categoryId: string; linkId: string; type: 'link' }
  }

  return null
}

/** Checks whether a global shortcut should avoid hijacking editable text input. */
function isEditableShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

/** Checks whether a global shortcut should wait for the active modal interaction to finish. */
function isModalOpen(): boolean {
  return Boolean(document.querySelector('[data-slot="dialog-content"], [data-slot="alert-dialog-content"]'))
}

/** Composes start page data, status messages, and navigation display regions. */
export function AppShell() {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [addingLinkCategoryId, setAddingLinkCategoryId] = useState<string | null>(null)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [preferencesInitialTab, setPreferencesInitialTab] = useState<PreferencesTab>('general')
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(storageService.getTheme)
  const [shortcutDeleteLink, setShortcutDeleteLink] = useState<Link | null>(null)
  const [isShortcutDeleting, setIsShortcutDeleting] = useState(false)
  const [dragLinkIdGroups, setDragLinkIdGroups] = useState<LinkIdGroups | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const shortcutDeleteActionRef = useRef<HTMLButtonElement>(null)
  const dragLinkIdGroupsRef = useRef<LinkIdGroups | null>(null)
  const {
    categories,
    links,
    interfaceSize,
    sortMode,
    query,
    initialized,
    error,
    sections,
    setInterfaceSize,
    setQuery,
    setSortMode,
    upsertLink,
    deleteLink,
    moveLinkToCategory,
    openLink,
    saveCategoryDraft,
    getIconFile,
    exportDeck,
    importDeck,
    resetDeckToDefaults,
    clearDeckData,
  } = useDeckStore()
  const interfaceSizeConfig = getInterfaceSizeConfig(interfaceSize)
  const isManualSort = sortMode === 'manual'
  const hasQuery = query.trim().length > 0
  const isLinkDragEnabled = isManualSort && !hasQuery
  const baseLinkIdGroups = useMemo(() => getLinkIdGroups(categories, links), [categories, links])
  const displaySections = useMemo(
    () =>
      dragLinkIdGroups && isLinkDragEnabled
        ? getSectionsFromLinkIdGroups(categories, links, dragLinkIdGroups)
        : sections,
    [categories, dragLinkIdGroups, isLinkDragEnabled, sections, links],
  )
  const visibleSections = useMemo(() => {
    if (hasQuery) {
      return displaySections
    }

    const sectionByCategoryId = new Map(displaySections.map(section => [section.category.id, section] as const))

    return [...categories]
      .sort((left, right) => left.order - right.order)
      .map(category => sectionByCategoryId.get(category.id) ?? { category, links: [] })
  }, [categories, displaySections, hasQuery])

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: Window['requestIdleCallback']
      cancelIdleCallback?: Window['cancelIdleCallback']
    }

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(preloadPinyinSearchModule, { timeout: 3000 })

      return () => {
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timeoutId = globalThis.setTimeout(preloadPinyinSearchModule, 1000)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    applyThemePreference(themePreference)

    return subscribeThemePreference(themePreference, () => {
      applyThemePreference(themePreference)
    })
  }, [themePreference])

  useEffect(() => {
    if (error) {
      toast.error(error, { id: 'deck-error' })
    }
  }, [error])

  useEffect(() => {
    if (shortcutDeleteLink && !links.some(link => link.id === shortcutDeleteLink.id)) {
      setShortcutDeleteLink(null)
    }
  }, [links, shortcutDeleteLink])

  useEffect(() => {
    /** Handles supported app-wide shortcuts before browser defaults can take over. */
    function handleGlobalKeyDown(event: KeyboardEvent): void {
      const hasPlatformModifier = event.metaKey || event.ctrlKey

      if (!hasPlatformModifier || event.altKey || event.isComposing) {
        return
      }

      const key = event.key.toLowerCase()

      if (isModalOpen()) {
        return
      }

      if (!event.shiftKey && key === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus({ preventScroll: true })
        searchInputRef.current?.select()
        preloadPinyinSearchModule()
        return
      }

      if (!event.shiftKey && event.key === '/') {
        event.preventDefault()
        openPreferences('shortcuts')
        return
      }

      if (isEditableShortcutTarget(event.target)) {
        return
      }

      if (event.shiftKey && key === 'o') {
        event.preventDefault()
        handleCreateLink()
        return
      }

      if (event.shiftKey && event.key === 'Backspace') {
        const focusedLinkId = getFocusedLinkCardId()
        const focusedLink = focusedLinkId ? links.find(link => link.id === focusedLinkId) : null

        if (!focusedLink) {
          return
        }

        event.preventDefault()
        setShortcutDeleteLink(focusedLink)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [links])

  /** Opens a blank form for adding a link from the global action. */
  function handleCreateLink(): void {
    setEditingLink(null)
    setAddingLinkCategoryId(null)
    setLinkDialogOpen(true)
  }

  /** Opens preferences to a specific tab. */
  function openPreferences(tab: PreferencesTab = 'general'): void {
    setPreferencesInitialTab(tab)
    setPreferencesOpen(true)
  }

  /** Persists the app appearance preference and applies it to the document root. */
  function handleThemePreferenceChange(nextThemePreference: ThemePreference): void {
    setThemePreferenceState(nextThemePreference)
    storageService.setTheme(nextThemePreference)
    applyThemePreference(nextThemePreference)
  }

  /** Opens a blank form for adding a link. */
  function handleAddLink(categoryId: string): void {
    setEditingLink(null)
    setAddingLinkCategoryId(categoryId)
    setLinkDialogOpen(true)
  }

  /** Opens the edit form with the current link data. */
  function handleEditLink(link: Link): void {
    setEditingLink(link)
    setAddingLinkCategoryId(null)
    setLinkDialogOpen(true)
  }

  /** Clears edit state when closing the link dialog so the next add does not reuse stale data. */
  function handleLinkDialogOpenChange(open: boolean): void {
    setLinkDialogOpen(open)

    if (!open) {
      setEditingLink(null)
      setAddingLinkCategoryId(null)
    }
  }

  /** Deletes the card selected by the global delete shortcut after confirmation. */
  async function handleShortcutDeleteLink(): Promise<void> {
    if (!shortcutDeleteLink || isShortcutDeleting) {
      return
    }

    setIsShortcutDeleting(true)

    try {
      await deleteLink(shortcutDeleteLink)
      setShortcutDeleteLink(null)
    } catch (deleteError) {
      console.error('Failed to delete link from keyboard shortcut', deleteError)
    } finally {
      setIsShortcutDeleting(false)
    }
  }

  /** Records the initial id groups before sorting starts. */
  function handleLinkDragStart(event: DragStartEvent): void {
    const activeData = getLinkDragData(event.operation.source)

    if (!activeData) {
      return
    }

    dragLinkIdGroupsRef.current = baseLinkIdGroups
  }

  /** Updates only lightweight id groups while dnd-kit handles visual clone feedback. */
  function handleLinkDragOver(event: DragOverEvent): void {
    const activeData = getLinkDragData(event.operation.source)

    if (!activeData || !event.operation.target) {
      return
    }

    const currentGroups = dragLinkIdGroupsRef.current ?? baseLinkIdGroups
    const nextGroups = moveSortableItems(currentGroups, event)

    if (areLinkIdGroupsEqual(currentGroups, nextGroups)) {
      return
    }

    dragLinkIdGroupsRef.current = nextGroups
    setDragLinkIdGroups(nextGroups)
  }

  /** Moves a link based on release position, letting the store rewrite order for same-category and cross-category moves. */
  function handleLinkDragEnd(event: DragEndEvent): void {
    if (!isLinkDragEnabled) {
      resetLinkDragState()
      return
    }

    const activeData = getLinkDragData(event.operation.source)

    if (!activeData) {
      resetLinkDragState()
      return
    }

    if (event.canceled) {
      resetLinkDragState()
      return
    }

    const finalGroups =
      dragLinkIdGroupsRef.current ??
      (event.operation.target ? moveSortableItems(baseLinkIdGroups, event) : baseLinkIdGroups)
    const finalTarget = getLinkTargetFromGroups(finalGroups, activeData.linkId)

    if (!finalTarget) {
      resetLinkDragState()
      return
    }

    const initialTarget = getLinkTargetFromGroups(baseLinkIdGroups, activeData.linkId)

    if (
      initialTarget &&
      initialTarget.categoryId === finalTarget.categoryId &&
      initialTarget.index === finalTarget.index
    ) {
      resetLinkDragState()
      return
    }

    setDragLinkIdGroups(finalGroups)

    void moveLinkToCategory(activeData.linkId, finalTarget.categoryId, finalTarget.index)
      .catch((moveError: unknown) => {
        console.error('Failed to move link', moveError)
      })
      .finally(() => {
        resetLinkDragState()
      })
  }

  /** Clears temporary UI state used during link dragging. */
  function resetLinkDragState(): void {
    dragLinkIdGroupsRef.current = null
    setDragLinkIdGroups(null)
  }

  const sectionList = (
    <div className={interfaceSizeConfig.page.stackClassName}>
      {visibleSections.map((section, categoryIndex) => (
        <CategorySection
          key={section.category.id}
          section={section}
          interfaceSize={interfaceSize}
          categoryIndex={categoryIndex}
          isDragEnabled={isLinkDragEnabled}
          showAddLinkCard={!hasQuery && section.links.length === 0}
          onOpenLink={openLink}
          onAddLink={handleAddLink}
          onEditLink={handleEditLink}
          onDeleteLink={deleteLink}
          getIconFile={getIconFile}
        />
      ))}
    </div>
  )

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
        <div className={cn(interfaceSizeConfig.page.className, interfaceSizeConfig.page.stackClassName, 'min-h-0')}>
          <AppTopBar
            interfaceSizeConfig={interfaceSizeConfig}
            onAddLink={handleCreateLink}
            onOpenPreferences={() => openPreferences()}
          />

          <LinkSearchBox
            inputRef={searchInputRef}
            value={query}
            onChange={setQuery}
            onFocus={preloadPinyinSearchModule}
            interfaceSizeConfig={interfaceSizeConfig}
          />
        </div>
      </div>

      <div className={cn(interfaceSizeConfig.page.className, interfaceSizeConfig.page.stackClassName, 'min-h-0')}>
        {visibleSections.length > 0 ? (
          isLinkDragEnabled ? (
            <DragDropProvider
              sensors={linkDragSensors}
              onDragStart={handleLinkDragStart}
              onDragOver={handleLinkDragOver}
              onDragEnd={handleLinkDragEnd}
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

      <LinkDialog
        open={linkDialogOpen}
        link={editingLink}
        initialCategoryId={addingLinkCategoryId}
        categories={categories}
        interfaceSizeConfig={interfaceSizeConfig}
        getIconFile={getIconFile}
        onOpenChange={handleLinkDialogOpenChange}
        upsertLink={upsertLink}
      />
      <PreferencesDialog
        open={preferencesOpen}
        initialTab={preferencesInitialTab}
        categories={categories}
        links={links}
        interfaceSize={interfaceSize}
        sortMode={sortMode}
        themePreference={themePreference}
        onOpenChange={setPreferencesOpen}
        onInterfaceSizeChange={setInterfaceSize}
        onSortModeChange={setSortMode}
        onThemePreferenceChange={handleThemePreferenceChange}
        saveCategoryDraft={saveCategoryDraft}
        exportDeck={exportDeck}
        importDeck={importDeck}
        resetDeckToDefaults={resetDeckToDefaults}
        clearDeckData={clearDeckData}
      />
      <AlertDialog
        open={shortcutDeleteLink !== null}
        onOpenChange={open => {
          if (!open && !isShortcutDeleting) {
            setShortcutDeleteLink(null)
          }
        }}
      >
        <AlertDialogContent
          size="default"
          className={interfaceSizeConfig.dialog.contentClassName}
          onOpenAutoFocus={event => {
            event.preventDefault()
            shortcutDeleteActionRef.current?.focus({ preventScroll: true })
          }}
        >
          <AlertDialogHeader className={interfaceSizeConfig.dialog.headerClassName}>
            <AlertDialogTitle className={interfaceSizeConfig.dialog.titleClassName}>Delete link</AlertDialogTitle>
            <AlertDialogDescription className={cn('wrap-break-word', interfaceSizeConfig.dialog.descriptionClassName)}>
              Delete "{shortcutDeleteLink?.name}"? This removes the link from your deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={interfaceSizeConfig.dialog.footerClassName}>
            <AlertDialogCancel size={interfaceSizeConfig.control.buttonSize} disabled={isShortcutDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              ref={shortcutDeleteActionRef}
              variant="destructive"
              size={interfaceSizeConfig.control.buttonSize}
              disabled={isShortcutDeleting}
              onClick={event => {
                event.preventDefault()
                void handleShortcutDeleteLink()
              }}
            >
              {isShortcutDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
