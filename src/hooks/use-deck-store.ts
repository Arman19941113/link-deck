// Combines Link Deck page state, derived data, and persistent business actions.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { isDefaultCategory } from "@/domain/categories";
import { moveLink, reorderCategories } from "@/domain/reorder";
import { selectCategorySections } from "@/domain/selectors";
import {
  createDeckExportFile,
  parseDeckExportFile,
  type DeckExportFile,
} from "@/domain/deck-transfer";
import type {
  Category,
  CategorySection,
  IconFile,
  InterfaceSize,
  Link,
  LinkIcon,
  SortMode,
} from "@/domain/types";
import { normalizeUrl } from "@/domain/url";
import { storageService } from "@/services";

/** Fields submitted by the UI when adding or editing a saved link. */
export type LinkInput = {
  id?: string;
  categoryId: string;
  name: string;
  url: string;
  note?: string;
  icon?: LinkIcon;
  iconFile?: File | null;
};

/** Strategy chosen by the UI when deleting a category that contains saved links. */
export type DeleteCategoryOptions =
  | {
      mode: "move-links";
      targetCategoryId: string;
    }
  | {
      mode: "delete-links";
    };

export type CategoryDraftDeletePlan =
  | {
      categoryId: string;
      mode: "move-links";
      targetCategoryId: string;
    }
  | {
      categoryId: string;
      mode: "delete-links";
    };

export type CategoryDraft = {
  categories: Category[];
  deletePlans: CategoryDraftDeletePlan[];
};

/** State, derived data, and persistence actions consumed by the page. */
export type DeckStore = {
  categories: Category[];
  links: Link[];
  interfaceSize: InterfaceSize;
  sortMode: SortMode;
  query: string;
  initialized: boolean;
  error: string | null;
  sections: CategorySection[];
  setInterfaceSize: (interfaceSize: InterfaceSize) => void;
  setQuery: (query: string) => void;
  setSortMode: (sortMode: SortMode) => void;
  upsertLink: (input: LinkInput) => Promise<Link>;
  deleteLink: (link: Link) => Promise<void>;
  openLink: (link: Link, options?: { newWindow?: boolean }) => boolean;
  addCategory: (name: string) => Promise<Category>;
  renameCategory: (categoryId: string, name: string) => Promise<void>;
  deleteCategory: (categoryId: string, options?: DeleteCategoryOptions) => Promise<void>;
  saveCategoryDraft: (draft: CategoryDraft) => Promise<void>;
  moveLinkToCategory: (activeLinkId: string, categoryId: string, index: number) => Promise<void>;
  reorderCategoryList: (activeCategoryId: string, overCategoryId: string) => Promise<void>;
  getIconFile: (id: string) => Promise<IconFile | undefined>;
  exportDeck: () => Promise<DeckExportFile>;
  importDeck: (json: string) => Promise<void>;
  resetDeckToDefaults: () => Promise<void>;
  clearDeckData: () => Promise<void>;
};

const EMPTY_ICON: LinkIcon = { type: "auto" };

/** Generates a locally unique id for new data. */
function createRecordId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** Converts unknown errors into messages that can be shown directly to users. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Action failed. Please try again later.";
}

/** Creates a displayable business error. */
function createDisplayError(message: string): Error {
  return new Error(message);
}

/** Cleans and validates a required name field. */
function normalizeName(value: string, emptyMessage: string): string {
  const name = value.trim();

  if (!name) {
    throw createDisplayError(emptyMessage);
  }

  return name;
}

/** Returns a local icon id so file records can be cleaned up when replacing or deleting icons. */
function getLocalIconId(icon: LinkIcon | undefined): string | null {
  return icon?.type === "file" ? icon.fileId : null;
}

/** Checks whether the current link set still references a given local icon. */
function isIconReferenced(links: Link[], iconId: string): boolean {
  return links.some((link) => getLocalIconId(link.icon) === iconId);
}

/** Merges one link record into the latest state while preserving other concurrently produced links. */
function mergeLink(links: Link[], link: Link): Link[] {
  return links.some((currentLink) => currentLink.id === link.id)
    ? links.map((currentLink) => (currentLink.id === link.id ? link : currentLink))
    : [...links, link];
}

/** Merges a set of affected links into the latest state. */
function mergeLinks(links: Link[], changedLinks: Link[]): Link[] {
  const changedLinkMap = new Map(changedLinks.map((link) => [link.id, link]));
  const mergedLinks = links.map((link) => changedLinkMap.get(link.id) ?? link);
  const existingLinkIds = new Set(mergedLinks.map((link) => link.id));

  for (const link of changedLinks) {
    if (!existingLinkIds.has(link.id)) {
      mergedLinks.push(link);
    }
  }

  return mergedLinks;
}

/** Deletes the link with the given id while preserving the latest state for others. */
function removeLinks(links: Link[], linkIds: string[]): Link[] {
  const deletedLinkIds = new Set(linkIds);

  return links.filter((link) => !deletedLinkIds.has(link.id));
}

/** Merges one category record into the latest state. */
function mergeCategory(categories: Category[], category: Category): Category[] {
  return categories.some((currentCategory) => currentCategory.id === category.id)
    ? categories.map((currentCategory) =>
        currentCategory.id === category.id ? category : currentCategory,
      )
    : [...categories, category];
}

/** Merges category changes after draft save without overwriting concurrent state updates during save. */
function mergeCategoriesAfterDraftSave(
  categories: Category[],
  savedCategories: Category[],
  deletedCategoryIds: string[],
): Category[] {
  const deletedCategoryIdSet = new Set(deletedCategoryIds);
  const savedCategoryMap = new Map(savedCategories.map((category) => [category.id, category]));
  const mergedCategories = categories
    .filter((category) => !deletedCategoryIdSet.has(category.id))
    .map((category) => savedCategoryMap.get(category.id) ?? category);
  const existingCategoryIds = new Set(mergedCategories.map((category) => category.id));

  for (const category of savedCategories) {
    if (!existingCategoryIds.has(category.id)) {
      mergedCategories.push(category);
    }
  }

  return mergedCategories;
}

/** Checks whether persisted category fields changed. */
function hasCategoryChanged(left: Category | undefined, right: Category): boolean {
  return (
    !left ||
    left.name !== right.name ||
    left.order !== right.order ||
    left.updatedAt !== right.updatedAt
  );
}

/** Regenerates continuous order by category order. */
function compactCategoryOrders(categories: Category[], now: string): Category[] {
  return [...categories]
    .sort((left, right) => left.order - right.order)
    .map((category, index) => ({
      ...category,
      order: index + 1,
      updatedAt: now,
    }));
}

/** Calculates order for a new link at the end of a category. */
function getNextLinkOrder(links: Link[], categoryId: string): number {
  return (
    links
      .filter((link) => link.categoryId === categoryId)
      .reduce((maxOrder, link) => Math.max(maxOrder, link.order), 0) + 1
  );
}

/** Builds a link icon reference for a saved file. */
function createFileIcon(iconFile: IconFile): LinkIcon {
  return {
    type: "file",
    fileId: iconFile.id,
    name: iconFile.name,
    mimeType: iconFile.mimeType,
  };
}

/** Checks whether persisted link fields changed. */
function hasLinkChanged(left: Link | undefined, right: Link): boolean {
  return (
    !left ||
    left.categoryId !== right.categoryId ||
    left.name !== right.name ||
    left.url !== right.url ||
    left.note !== right.note ||
    left.order !== right.order ||
    left.visitCount !== right.visitCount ||
    left.lastVisitedAt !== right.lastVisitedAt ||
    left.updatedAt !== right.updatedAt ||
    JSON.stringify(left.icon) !== JSON.stringify(right.icon)
  );
}

/** Filters link records that actually changed compared with old state. */
function getChangedLinks(previousLinks: Link[], nextLinks: Link[]): Link[] {
  const previousLinkMap = new Map(previousLinks.map((link) => [link.id, link]));

  return nextLinks.filter((link) => hasLinkChanged(previousLinkMap.get(link.id), link));
}

/** Creates the data-store hook consumed directly by the app page. */
export function useDeckStore(): DeckStore {
  const [initialDeckMirror] = useState(storageService.getInitialDeckSnapshotMirror);
  const [categories, setCategories] = useState<Category[]>(
    () => initialDeckMirror?.categories ?? [],
  );
  const [links, setLinks] = useState<Link[]>(() => initialDeckMirror?.links ?? []);
  const [interfaceSize, setInterfaceSizeState] = useState<InterfaceSize>(
    () => initialDeckMirror?.interfaceSize ?? storageService.getInitialInterfaceSize(),
  );
  const [sortMode, setSortModeState] = useState<SortMode>(
    () => initialDeckMirror?.sortMode ?? "manual",
  );
  const [query, setQuery] = useState("");
  const [initialized, setInitialized] = useState(() => Boolean(initialDeckMirror));
  const [error, setError] = useState<string | null>(null);
  const categoriesRef = useRef<Category[]>(initialDeckMirror?.categories ?? []);
  const linksRef = useRef<Link[]>(initialDeckMirror?.links ?? []);
  const interfaceSizeRef = useRef<InterfaceSize>(
    initialDeckMirror?.interfaceSize ?? storageService.getInitialInterfaceSize(),
  );
  const sortModeRef = useRef<SortMode>(initialDeckMirror?.sortMode ?? "manual");

  const saveCurrentDeckMirror = useCallback(() => {
    if (!categoriesRef.current.length && !linksRef.current.length) {
      return;
    }

    storageService.saveDeckSnapshotMirror({
      categories: categoriesRef.current,
      links: linksRef.current,
      interfaceSize: interfaceSizeRef.current,
      sortMode: sortModeRef.current,
    });
  }, []);

  const updateCategoriesState = useCallback(
    (nextCategories: Category[]) => {
      categoriesRef.current = nextCategories;
      setCategories(nextCategories);
      saveCurrentDeckMirror();
    },
    [saveCurrentDeckMirror],
  );

  const updateLinksState = useCallback(
    (nextLinks: Link[]) => {
      linksRef.current = nextLinks;
      setLinks(nextLinks);
      saveCurrentDeckMirror();
    },
    [saveCurrentDeckMirror],
  );

  const updateInterfaceSizeState = useCallback(
    (nextInterfaceSize: InterfaceSize) => {
      interfaceSizeRef.current = nextInterfaceSize;
      setInterfaceSizeState(nextInterfaceSize);
      saveCurrentDeckMirror();
    },
    [saveCurrentDeckMirror],
  );

  const updateSortModeState = useCallback(
    (nextSortMode: SortMode) => {
      sortModeRef.current = nextSortMode;
      setSortModeState(nextSortMode);
      saveCurrentDeckMirror();
    },
    [saveCurrentDeckMirror],
  );

  const applyStoredDeckState = useCallback(
    (deck: {
      interfaceSize: InterfaceSize;
      categories: Category[];
      links: Link[];
      sortMode: SortMode;
    }) => {
      updateCategoriesState(deck.categories);
      updateLinksState(deck.links);
      updateInterfaceSizeState(deck.interfaceSize);
      updateSortModeState(deck.sortMode);
      setQuery("");
    },
    [updateCategoriesState, updateInterfaceSizeState, updateLinksState, updateSortModeState],
  );

  const cleanupIconIfUnused = useCallback(async (iconId: string, nextLinks: Link[]) => {
    if (isIconReferenced(nextLinks, iconId)) {
      return;
    }

    try {
      await storageService.deleteIconFile(iconId);
    } catch (cleanupError) {
      setError(`Icon file cleanup failed: ${getErrorMessage(cleanupError)}`);
    }
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load(): Promise<void> {
      try {
        const deck = await storageService.loadDeck();

        if (canceled) {
          return;
        }

        updateCategoriesState(deck.categories);
        updateLinksState(deck.links);
        updateInterfaceSizeState(deck.interfaceSize);
        updateSortModeState(deck.sortMode);
        if (deck.legacyLinksDetected) {
          toast.warning("Old local link data was detected and is incompatible with this version.", {
            id: "legacy-link-data",
          });
        }
        setError(null);
      } catch (loadError) {
        if (!canceled) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!canceled) {
          setInitialized(true);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, [updateCategoriesState, updateInterfaceSizeState, updateLinksState, updateSortModeState]);

  const sections = useMemo(
    () => selectCategorySections(categories, links, query, sortMode),
    [categories, query, links, sortMode],
  );

  const exportDeck = useCallback(async (): Promise<DeckExportFile> => {
    try {
      const deck = await storageService.loadDeck();

      setError(null);

      return createDeckExportFile(deck);
    } catch (exportError) {
      setError(getErrorMessage(exportError));
      throw exportError;
    }
  }, []);

  const importDeck = useCallback(
    async (json: string): Promise<void> => {
      const deck = await parseDeckExportFile(json);
      const storedDeck = await storageService.replaceDeck(deck);

      applyStoredDeckState(storedDeck);
      setError(null);
    },
    [applyStoredDeckState],
  );

  const resetDeckToDefaults = useCallback(async (): Promise<void> => {
    try {
      const deck = await storageService.resetDeckToDefaults();

      applyStoredDeckState(deck);
      setError(null);
    } catch (resetError) {
      setError(getErrorMessage(resetError));
      throw resetError;
    }
  }, [applyStoredDeckState]);

  const clearDeckData = useCallback(async (): Promise<void> => {
    try {
      const deck = await storageService.clearDeckData();

      applyStoredDeckState(deck);
      setError(null);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
      throw clearError;
    }
  }, [applyStoredDeckState]);

  const setInterfaceSize = useCallback(
    (nextInterfaceSize: InterfaceSize): void => {
      updateInterfaceSizeState(nextInterfaceSize);
      void storageService.saveInterfaceSize(nextInterfaceSize).catch(() => undefined);
    },
    [updateInterfaceSizeState],
  );

  const setSortMode = useCallback(
    (nextSortMode: SortMode): void => {
      updateSortModeState(nextSortMode);
      void storageService.saveSortMode(nextSortMode).catch(() => undefined);
    },
    [updateSortModeState],
  );

  const upsertLink = useCallback(
    async (input: LinkInput): Promise<Link> => {
      const latestCategories = categoriesRef.current;
      const latestLinks = linksRef.current;
      const name = normalizeName(input.name, "Enter a link title");
      const normalizedUrl = normalizeUrl(input.url);

      if (!normalizedUrl) {
        const urlError = createDisplayError("Enter a valid http/https address");

        setError(urlError.message);
        throw urlError;
      }

      if (!latestCategories.some((category) => category.id === input.categoryId)) {
        const categoryError = createDisplayError("Select a valid category");

        setError(categoryError.message);
        throw categoryError;
      }

      const now = new Date().toISOString();
      const existingLink = input.id ? latestLinks.find((link) => link.id === input.id) : undefined;

      if (input.id && !existingLink) {
        const missingLinkError = createDisplayError("Link not found");

        setError(missingLinkError.message);
        throw missingLinkError;
      }

      let savedIconFile: IconFile | null = null;

      if (input.iconFile) {
        try {
          savedIconFile = await storageService.saveIconFile(input.iconFile);
        } catch (iconError) {
          setError(getErrorMessage(iconError));
          throw iconError;
        }
      }

      const nextIcon = savedIconFile
        ? createFileIcon(savedIconFile)
        : (input.icon ?? existingLink?.icon ?? EMPTY_ICON);
      const previousLocalIconId = getLocalIconId(existingLink?.icon);
      const nextLocalIconId = getLocalIconId(nextIcon);
      const note = input.note?.trim() || undefined;
      let nextLink: Link;
      let changedLinks: Link[];

      if (existingLink) {
        nextLink = {
          ...existingLink,
          categoryId: input.categoryId,
          name,
          url: normalizedUrl,
          note,
          icon: nextIcon,
          updatedAt: now,
        };

        if (existingLink.categoryId === input.categoryId) {
          changedLinks = [nextLink];
        } else {
          const editedInSourceCategory = {
            ...nextLink,
            categoryId: existingLink.categoryId,
          };
          const linksWithEdit = latestLinks.map((link) =>
            link.id === existingLink.id ? editedInSourceCategory : link,
          );
          const movedLinks = moveLink(
            linksWithEdit,
            existingLink.id,
            input.categoryId,
            latestLinks.filter((link) => link.categoryId === input.categoryId).length,
          );

          nextLink = movedLinks.find((link) => link.id === existingLink.id) ?? nextLink;
          changedLinks = getChangedLinks(latestLinks, movedLinks);
        }
      } else {
        nextLink = {
          id: createRecordId("link"),
          categoryId: input.categoryId,
          name,
          url: normalizedUrl,
          note,
          icon: nextIcon,
          order: getNextLinkOrder(latestLinks, input.categoryId),
          visitCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        changedLinks = [nextLink];
      }

      try {
        if (changedLinks.length === 1) {
          await storageService.saveLink(changedLinks[0]);
        } else {
          await storageService.saveLinks(changedLinks);
        }
      } catch (upsertError) {
        if (savedIconFile) {
          await cleanupIconIfUnused(savedIconFile.id, linksRef.current);
        }

        setError(getErrorMessage(upsertError));
        throw upsertError;
      }

      const nextLinks = mergeLinks(linksRef.current, changedLinks);

      updateLinksState(nextLinks);
      setError(null);

      if (previousLocalIconId && previousLocalIconId !== nextLocalIconId) {
        await cleanupIconIfUnused(previousLocalIconId, nextLinks);
      }

      return nextLink;
    },
    [cleanupIconIfUnused, updateLinksState],
  );

  const deleteLink = useCallback(
    async (link: Link): Promise<void> => {
      const latestLinks = linksRef.current;
      const targetLink = latestLinks.find((currentLink) => currentLink.id === link.id) ?? link;
      const localIconId = getLocalIconId(targetLink.icon);

      try {
        await storageService.deleteLink(link.id);
      } catch (deleteError) {
        setError(getErrorMessage(deleteError));
        throw deleteError;
      }

      const nextLinks = removeLinks(linksRef.current, [link.id]);

      updateLinksState(nextLinks);
      setError(null);

      if (localIconId) {
        await cleanupIconIfUnused(localIconId, nextLinks);
      }
    },
    [cleanupIconIfUnused, updateLinksState],
  );

  const openLink = useCallback(
    (link: Link, options?: { newWindow?: boolean }): boolean => {
      const openedWindow = window.open(
        link.url,
        "_blank",
        options?.newWindow ? "popup,width=1200,height=800" : undefined,
      );

      if (openedWindow) {
        openedWindow.opener = null;
      } else {
        setError("If the link did not open, allow browser pop-ups and try again.");
      }

      void (async () => {
        try {
          const updatedLink = await storageService.recordLinkVisit(link.id);

          if (updatedLink) {
            updateLinksState(mergeLink(linksRef.current, updatedLink));
          }

          setError(null);
        } catch (visitError) {
          setError(`Failed to save visit history: ${getErrorMessage(visitError)}`);
        }
      })();

      return openedWindow !== null;
    },
    [updateLinksState],
  );

  const addCategory = useCallback(
    async (nameInput: string): Promise<Category> => {
      const latestCategories = categoriesRef.current;
      const name = normalizeName(nameInput, "Enter a category name");
      const now = new Date().toISOString();
      const category: Category = {
        id: createRecordId("category"),
        name,
        order:
          latestCategories.reduce(
            (maxOrder, categoryItem) => Math.max(maxOrder, categoryItem.order),
            0,
          ) + 1,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await storageService.saveCategory(category);
        updateCategoriesState(mergeCategory(categoriesRef.current, category));
        setError(null);

        return category;
      } catch (addError) {
        setError(getErrorMessage(addError));
        throw addError;
      }
    },
    [updateCategoriesState],
  );

  const renameCategory = useCallback(
    async (categoryId: string, nameInput: string): Promise<void> => {
      const latestCategories = categoriesRef.current;
      const name = normalizeName(nameInput, "Enter a category name");
      const now = new Date().toISOString();
      const category = latestCategories.find(
        (currentCategory) => currentCategory.id === categoryId,
      );

      if (!category) {
        const renameError = createDisplayError("Category not found");

        setError(renameError.message);
        throw renameError;
      }

      const nextCategory: Category = {
        ...category,
        name,
        updatedAt: now,
      };

      try {
        await storageService.saveCategory(nextCategory);
        updateCategoriesState(mergeCategory(categoriesRef.current, nextCategory));
        setError(null);
      } catch (renameError) {
        setError(getErrorMessage(renameError));
        throw renameError;
      }
    },
    [updateCategoriesState],
  );

  const deleteCategory = useCallback(
    async (categoryId: string, options?: DeleteCategoryOptions): Promise<void> => {
      const latestCategories = categoriesRef.current;
      const latestLinks = linksRef.current;

      if (latestCategories.length <= 1) {
        const lastCategoryError = createDisplayError("Keep at least one category");

        setError(lastCategoryError.message);
        throw lastCategoryError;
      }

      const category = latestCategories.find((categoryItem) => categoryItem.id === categoryId);

      if (!category) {
        const missingCategoryError = createDisplayError("Category not found");

        setError(missingCategoryError.message);
        throw missingCategoryError;
      }

      if (isDefaultCategory(categoryId)) {
        const defaultCategoryError = createDisplayError("The default category cannot be deleted");

        setError(defaultCategoryError.message);
        throw defaultCategoryError;
      }

      const now = new Date().toISOString();
      const categoryLinks = latestLinks.filter((link) => link.categoryId === categoryId);
      const nextCategories = compactCategoryOrders(
        latestCategories.filter((categoryItem) => categoryItem.id !== categoryId),
        now,
      );

      if (categoryLinks.length > 0 && !options) {
        const optionError = createDisplayError(
          "This category contains links. Choose whether to move or delete them.",
        );

        setError(optionError.message);
        throw optionError;
      }

      try {
        if (!categoryLinks.length) {
          await storageService.deleteCategory(categoryId);
          await storageService.saveCategories(nextCategories);
          updateCategoriesState(nextCategories);
          setError(null);
          return;
        }

        if (options?.mode === "move-links") {
          if (options.targetCategoryId === categoryId) {
            throw createDisplayError("Select another category as the move target");
          }

          if (
            !nextCategories.some((nextCategory) => nextCategory.id === options.targetCategoryId)
          ) {
            throw createDisplayError("Target category not found");
          }

          let order = getNextLinkOrder(latestLinks, options.targetCategoryId);
          const movedLinks = categoryLinks.map((link) => ({
            ...link,
            categoryId: options.targetCategoryId,
            order: order++,
            updatedAt: now,
          }));

          await storageService.saveLinks(movedLinks);
          await storageService.deleteCategory(categoryId);
          await storageService.saveCategories(nextCategories);

          updateLinksState(mergeLinks(linksRef.current, movedLinks));
          updateCategoriesState(nextCategories);
          setError(null);
          return;
        }

        const deletedLinkIds = categoryLinks.map((link) => link.id);
        const localIconIds = [
          ...new Set(
            categoryLinks
              .map((link) => getLocalIconId(link.icon))
              .filter((iconId): iconId is string => iconId !== null),
          ),
        ];
        await storageService.deleteLinks(deletedLinkIds);
        await storageService.deleteCategory(categoryId);
        await storageService.saveCategories(nextCategories);

        const nextLinks = removeLinks(linksRef.current, deletedLinkIds);

        updateLinksState(nextLinks);
        updateCategoriesState(nextCategories);
        setError(null);

        for (const iconId of localIconIds) {
          await cleanupIconIfUnused(iconId, nextLinks);
        }
      } catch (deleteError) {
        setError(getErrorMessage(deleteError));
        throw deleteError;
      }
    },
    [cleanupIconIfUnused, updateCategoriesState, updateLinksState],
  );

  const saveCategoryDraft = useCallback(
    async (draft: CategoryDraft): Promise<void> => {
      const latestCategories = categoriesRef.current;
      const latestLinks = linksRef.current;

      /** Throws a draft save validation error and syncs it to page error state. */
      const throwDraftError = (message: string): never => {
        const draftError = createDisplayError(message);

        setError(draftError.message);
        throw draftError;
      };

      if (!draft.categories.length) {
        throwDraftError("Keep at least one category");
      }

      const now = new Date().toISOString();
      const latestCategoryMap = new Map(
        latestCategories.map((category) => [category.id, category]),
      );
      const draftCategoryIds = new Set<string>();

      for (const category of draft.categories) {
        if (!category.id) {
          throwDraftError("Category not found");
        }

        if (draftCategoryIds.has(category.id)) {
          throwDraftError("Categories cannot be duplicated");
        }

        draftCategoryIds.add(category.id);
      }

      const deletedCategories = latestCategories.filter(
        (category) => !draftCategoryIds.has(category.id),
      );
      const deletedCategoryIds = new Set(deletedCategories.map((category) => category.id));
      const deletePlanMap = new Map<string, CategoryDraftDeletePlan>();

      for (const plan of draft.deletePlans) {
        if (deletePlanMap.has(plan.categoryId)) {
          throwDraftError("Delete plans cannot be duplicated");
        }

        if (!deletedCategoryIds.has(plan.categoryId)) {
          throwDraftError("Invalid delete plan");
        }

        if (plan.mode === "move-links") {
          if (plan.targetCategoryId === plan.categoryId) {
            throwDraftError("Select another category as the move target");
          }

          if (!draftCategoryIds.has(plan.targetCategoryId)) {
            throwDraftError("Target category not found");
          }
        }

        deletePlanMap.set(plan.categoryId, plan);
      }

      for (const category of deletedCategories) {
        if (isDefaultCategory(category.id)) {
          throwDraftError("The default category cannot be deleted");
        }
      }

      const nextCategories = draft.categories.map((category, index) => {
        const existingCategory = latestCategoryMap.get(category.id);
        const name = category.name.trim();

        if (!name) {
          throwDraftError("Enter a category name");
        }

        const orderedCategory: Category = {
          ...(existingCategory ?? category),
          name,
          order: index + 1,
          updatedAt: category.updatedAt,
        };
        const shouldRefreshTimestamp =
          !existingCategory ||
          existingCategory.name !== orderedCategory.name ||
          existingCategory.order !== orderedCategory.order ||
          existingCategory.updatedAt !== orderedCategory.updatedAt;

        return shouldRefreshTimestamp
          ? {
              ...orderedCategory,
              updatedAt: now,
            }
          : orderedCategory;
      });
      const categoriesToSave = nextCategories.filter((category) =>
        hasCategoryChanged(latestCategoryMap.get(category.id), category),
      );
      const categoryIdsToDelete = deletedCategories.map((category) => category.id);
      const linksToSave: Link[] = [];
      const linkIdsToDelete: string[] = [];
      const localIconIdsToCleanup = new Set<string>();
      const targetNextOrders = new Map<string, number>();

      const getTargetNextOrder = (targetCategoryId: string): number => {
        const currentOrder = targetNextOrders.get(targetCategoryId);

        if (currentOrder !== undefined) {
          return currentOrder;
        }

        const nextOrder = getNextLinkOrder(latestLinks, targetCategoryId);

        targetNextOrders.set(targetCategoryId, nextOrder);

        return nextOrder;
      };

      for (const category of deletedCategories) {
        const categoryLinks = latestLinks.filter((link) => link.categoryId === category.id);

        if (!categoryLinks.length) {
          continue;
        }

        const deletePlan = deletePlanMap.get(category.id);

        if (deletePlan === undefined) {
          const planError = createDisplayError(
            "This category contains links. Choose whether to move or delete them.",
          );

          setError(planError.message);
          throw planError;
        }

        if (deletePlan.mode === "move-links") {
          let order = getTargetNextOrder(deletePlan.targetCategoryId);

          for (const link of categoryLinks) {
            linksToSave.push({
              ...link,
              categoryId: deletePlan.targetCategoryId,
              order: order++,
              updatedAt: now,
            });
          }

          targetNextOrders.set(deletePlan.targetCategoryId, order);
          continue;
        }

        for (const link of categoryLinks) {
          linkIdsToDelete.push(link.id);

          const iconId = getLocalIconId(link.icon);

          if (iconId) {
            localIconIdsToCleanup.add(iconId);
          }
        }
      }

      try {
        await storageService.saveCategoryDraftChanges({
          categoriesToSave,
          categoryIdsToDelete,
          linksToSave,
          linkIdsToDelete,
        });
      } catch (saveError) {
        setError(getErrorMessage(saveError));
        throw saveError;
      }

      const nextLinks = mergeLinks(removeLinks(linksRef.current, linkIdsToDelete), linksToSave);
      const mergedCategories = mergeCategoriesAfterDraftSave(
        categoriesRef.current,
        categoriesToSave,
        categoryIdsToDelete,
      );

      updateCategoriesState(mergedCategories);
      updateLinksState(nextLinks);
      setError(null);

      for (const iconId of localIconIdsToCleanup) {
        await cleanupIconIfUnused(iconId, nextLinks);
      }
    },
    [cleanupIconIfUnused, updateCategoriesState, updateLinksState],
  );

  const moveLinkToCategory = useCallback(
    async (activeLinkId: string, categoryId: string, index: number): Promise<void> => {
      const latestCategories = categoriesRef.current;
      const latestLinks = linksRef.current;

      if (!latestCategories.some((category) => category.id === categoryId)) {
        const missingCategoryError = createDisplayError("Target category not found");

        setError(missingCategoryError.message);
        throw missingCategoryError;
      }

      const nextLinks = moveLink(latestLinks, activeLinkId, categoryId, index);
      const changedLinks = getChangedLinks(latestLinks, nextLinks);

      try {
        await storageService.saveLinks(changedLinks);
        updateLinksState(mergeLinks(linksRef.current, changedLinks));
        setError(null);
      } catch (moveError) {
        setError(getErrorMessage(moveError));
        throw moveError;
      }
    },
    [updateLinksState],
  );

  const reorderCategoryList = useCallback(
    async (activeCategoryId: string, overCategoryId: string): Promise<void> => {
      const latestCategories = categoriesRef.current;
      const nextCategories = reorderCategories(latestCategories, activeCategoryId, overCategoryId);

      try {
        await storageService.saveCategories(nextCategories);
        updateCategoriesState(nextCategories);
        setError(null);
      } catch (reorderError) {
        setError(getErrorMessage(reorderError));
        throw reorderError;
      }
    },
    [updateCategoriesState],
  );

  return {
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
    openLink,
    addCategory,
    renameCategory,
    deleteCategory,
    saveCategoryDraft,
    moveLinkToCategory,
    reorderCategoryList,
    getIconFile: storageService.getIconFile,
    exportDeck,
    importDeck,
    resetDeckToDefaults,
    clearDeckData,
  };
}
