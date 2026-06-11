// Start page app shell that connects the deck store and composes the main page regions.

import { useMemo, useRef, useState } from "react";
import type { Data, Draggable, Droppable } from "@dnd-kit/abstract";
import { KeyboardSensor, PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { move as moveSortableItems } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { AlertCircle } from "lucide-react";

import { CategorySection } from "@/components/category-section";
import { AppTopBar } from "@/components/app-top-bar";
import { DeckEmptyState } from "@/components/deck-empty-state";
import { LinkSearchBox } from "@/components/link-search-box";
import { PreferencesDialog } from "@/components/preferences-dialog";
import { LinkDialog } from "@/components/link-dialog";
import { getInterfaceSizeConfig } from "@/domain/interface-size";
import type { Category, CategorySection as CategorySectionData, Link } from "@/domain/types";
import { useDeckStore } from "@/hooks/use-deck-store";
import { cn } from "@/lib/utils";

type LinkIdGroups = Record<string, string[]>;

const linkDragSensors = [
  PointerSensor.configure({
    activationConstraints: [new PointerActivationConstraints.Distance({ value: 6 })],
    activatorElements(source) {
      return [source.element, source.handle];
    },
    preventActivation(_event, source) {
      return source.type !== "link";
    },
  }),
  KeyboardSensor,
];

/** Gets the full manually ordered link sequence for a category so visible drop positions can map to real indexes. */
function getManuallySortedLinks(links: Link[], categoryId: string): Link[] {
  return links
    .filter((link) => link.categoryId === categoryId)
    .sort((left, right) => left.order - right.order);
}

/** Builds sortable id groups from persisted link records. */
function getLinkIdGroups(categories: Category[], links: Link[]): LinkIdGroups {
  const groups = Object.fromEntries(categories.map((category) => [category.id, [] as string[]]));

  for (const category of categories) {
    groups[category.id] = getManuallySortedLinks(links, category.id).map((link) => link.id);
  }

  return groups;
}

/** Builds visible category sections from lightweight sortable id groups. */
function getSectionsFromLinkIdGroups(
  categories: Category[],
  links: Link[],
  groups: LinkIdGroups,
): CategorySectionData[] {
  const linkById = new Map(links.map((link) => [link.id, link]));

  return [...categories]
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      category,
      links: (groups[category.id] ?? [])
        .map((linkId) => linkById.get(linkId))
        .filter((link): link is Link => Boolean(link)),
    }));
}

/** Compares sortable id groups so pointer moves that do not change a target avoid rerendering. */
function areLinkIdGroupsEqual(left: LinkIdGroups, right: LinkIdGroups): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => {
      const leftIds = left[key] ?? [];
      const rightIds = right[key] ?? [];

      return (
        leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index])
      );
    })
  );
}

/** Finds the final category and index for a link in sortable id groups. */
function getLinkTargetFromGroups(groups: LinkIdGroups, linkId: string) {
  for (const [categoryId, linkIds] of Object.entries(groups)) {
    const index = linkIds.indexOf(linkId);

    if (index >= 0) {
      return { categoryId, index };
    }
  }

  return null;
}

/** Reads link metadata attached to new dnd-kit sortable entities. */
function getLinkDragData(entity: Draggable<Data> | Droppable<Data> | null | undefined) {
  const data = entity?.data;

  if (
    data &&
    typeof data === "object" &&
    "type" in data &&
    data.type === "link" &&
    "linkId" in data &&
    typeof data.linkId === "string"
  ) {
    return data as { categoryId: string; linkId: string; type: "link" };
  }

  return null;
}

/** Composes start page data, status messages, and navigation display regions. */
export function AppShell() {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [addingLinkCategoryId, setAddingLinkCategoryId] = useState<string | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [dragLinkIdGroups, setDragLinkIdGroups] = useState<LinkIdGroups | null>(null);
  const dragLinkIdGroupsRef = useRef<LinkIdGroups | null>(null);
  const {
    categories,
    links,
    interfaceSize,
    sortMode,
    query,
    loading,
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
  } = useDeckStore();
  const interfaceSizeConfig = getInterfaceSizeConfig(interfaceSize);
  const isManualSort = sortMode === "manual";
  const hasQuery = query.trim().length > 0;
  const isLinkDragEnabled = isManualSort && !hasQuery;
  const baseLinkIdGroups = useMemo(() => getLinkIdGroups(categories, links), [categories, links]);
  const displaySections = useMemo(
    () =>
      dragLinkIdGroups && isLinkDragEnabled
        ? getSectionsFromLinkIdGroups(categories, links, dragLinkIdGroups)
        : sections,
    [categories, dragLinkIdGroups, isLinkDragEnabled, sections, links],
  );
  const visibleSections = useMemo(() => {
    if (hasQuery) {
      return displaySections;
    }

    const sectionByCategoryId = new Map(
      displaySections.map((section) => [section.category.id, section] as const),
    );

    return [...categories]
      .sort((left, right) => left.order - right.order)
      .map((category) => sectionByCategoryId.get(category.id) ?? { category, links: [] });
  }, [categories, displaySections, hasQuery]);

  /** Opens a blank form for adding a link from the global action. */
  function handleCreateLink(): void {
    setEditingLink(null);
    setAddingLinkCategoryId(null);
    setLinkDialogOpen(true);
  }

  /** Opens a blank form for adding a link. */
  function handleAddLink(categoryId: string): void {
    setEditingLink(null);
    setAddingLinkCategoryId(categoryId);
    setLinkDialogOpen(true);
  }

  /** Opens the edit form with the current link data. */
  function handleEditLink(link: Link): void {
    setEditingLink(link);
    setAddingLinkCategoryId(null);
    setLinkDialogOpen(true);
  }

  /** Clears edit state when closing the link dialog so the next add does not reuse stale data. */
  function handleLinkDialogOpenChange(open: boolean): void {
    setLinkDialogOpen(open);

    if (!open) {
      setEditingLink(null);
      setAddingLinkCategoryId(null);
    }
  }

  /** Records the initial id groups before sorting starts. */
  function handleLinkDragStart(event: DragStartEvent): void {
    const activeData = getLinkDragData(event.operation.source);

    if (!activeData) {
      return;
    }

    dragLinkIdGroupsRef.current = baseLinkIdGroups;
  }

  /** Updates only lightweight id groups while dnd-kit handles visual clone feedback. */
  function handleLinkDragOver(event: DragOverEvent): void {
    const activeData = getLinkDragData(event.operation.source);

    if (!activeData || !event.operation.target) {
      return;
    }

    const currentGroups = dragLinkIdGroupsRef.current ?? baseLinkIdGroups;
    const nextGroups = moveSortableItems(currentGroups, event);

    if (areLinkIdGroupsEqual(currentGroups, nextGroups)) {
      return;
    }

    dragLinkIdGroupsRef.current = nextGroups;
    setDragLinkIdGroups(nextGroups);
  }

  /** Moves a link based on release position, letting the store rewrite order for same-category and cross-category moves. */
  function handleLinkDragEnd(event: DragEndEvent): void {
    if (!isLinkDragEnabled) {
      resetLinkDragState();
      return;
    }

    const activeData = getLinkDragData(event.operation.source);

    if (!activeData) {
      resetLinkDragState();
      return;
    }

    if (event.canceled) {
      resetLinkDragState();
      return;
    }

    const finalGroups =
      dragLinkIdGroupsRef.current ??
      (event.operation.target ? moveSortableItems(baseLinkIdGroups, event) : baseLinkIdGroups);
    const finalTarget = getLinkTargetFromGroups(finalGroups, activeData.linkId);

    if (!finalTarget) {
      resetLinkDragState();
      return;
    }

    const initialTarget = getLinkTargetFromGroups(baseLinkIdGroups, activeData.linkId);

    if (
      initialTarget &&
      initialTarget.categoryId === finalTarget.categoryId &&
      initialTarget.index === finalTarget.index
    ) {
      resetLinkDragState();
      return;
    }

    setDragLinkIdGroups(finalGroups);

    void moveLinkToCategory(activeData.linkId, finalTarget.categoryId, finalTarget.index)
      .catch((moveError: unknown) => {
        console.error("Failed to move link", moveError);
      })
      .finally(() => {
        resetLinkDragState();
      });
  }

  /** Clears temporary UI state used during link dragging. */
  function resetLinkDragState(): void {
    dragLinkIdGroupsRef.current = null;
    setDragLinkIdGroups(null);
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-background text-foreground">
        <div className="mx-auto flex min-h-svh w-full max-w-7xl items-center justify-center px-6 py-6">
          <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
            Loading links...
          </div>
        </div>
      </main>
    );
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
  );

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div
          className={cn(
            interfaceSizeConfig.page.className,
            interfaceSizeConfig.page.stackClassName,
            "min-h-0",
          )}
        >
          <AppTopBar
            interfaceSizeConfig={interfaceSizeConfig}
            onAddLink={handleCreateLink}
            onOpenPreferences={() => setPreferencesOpen(true)}
          />

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-card px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </div>
          ) : null}

          <LinkSearchBox
            value={query}
            onChange={setQuery}
            interfaceSizeConfig={interfaceSizeConfig}
          />
        </div>
      </div>

      <div
        className={cn(
          interfaceSizeConfig.page.className,
          interfaceSizeConfig.page.stackClassName,
          "min-h-0",
        )}
      >
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
        ) : (
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
        categories={categories}
        links={links}
        interfaceSize={interfaceSize}
        sortMode={sortMode}
        onOpenChange={setPreferencesOpen}
        onInterfaceSizeChange={setInterfaceSize}
        onSortModeChange={setSortMode}
        saveCategoryDraft={saveCategoryDraft}
        exportDeck={exportDeck}
        importDeck={importDeck}
        resetDeckToDefaults={resetDeckToDefaults}
        clearDeckData={clearDeckData}
      />
    </main>
  );
}
