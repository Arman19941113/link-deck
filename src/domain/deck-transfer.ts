// Converts Link Deck snapshots to and from a portable JSON backup format.

import type { Category, IconFile, InterfaceSize, Link, SortMode } from "@/domain/types";
import type { StoredDeckSnapshot } from "@/storage/deck-db";

type ExportedIconFile = Omit<IconFile, "blob"> & {
  dataUrl: string;
};

export type DeckExportFile = {
  app: "link-deck";
  version: 1;
  exportedAt: string;
  deck: {
    id: string;
    name: string;
    categories: Category[];
    links: Link[];
    iconFiles: ExportedIconFile[];
    interfaceSize: InterfaceSize;
    sortMode: SortMode;
    createdAt: string;
    updatedAt: string;
  };
};

const VALID_SORT_MODES = new Set<SortMode>(["manual", "mostVisited", "recentVisited", "name"]);
const VALID_INTERFACE_SIZES = new Set<InterfaceSize>(["compact", "comfortable", "spacious"]);

/** Reads a Blob as a data URL so local icons can be included in JSON exports. */
function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Icon file export failed"));
    });
    reader.addEventListener("error", () => {
      reject(new Error("Icon file export failed"));
    });
    reader.readAsDataURL(blob);
  });
}

/** Converts a data URL from an import file into a Blob record. */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error("Imported icon file could not be read");
  }

  return response.blob();
}

/** Checks whether an unknown value is a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Validates that a value is an ISO-like timestamp string. */
function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/** Validates imported category shape before persistence. */
function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.order === "number" &&
    Number.isFinite(value.order) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}

/** Validates imported link icon shape before persistence. */
function isLinkIcon(value: unknown): value is Link["icon"] {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "auto") {
    return true;
  }

  if (value.type === "builtin") {
    return (
      typeof value.slug === "string" &&
      value.slug.length > 0 &&
      typeof value.title === "string" &&
      value.title.length > 0 &&
      typeof value.hex === "string" &&
      value.hex.length > 0
    );
  }

  if (value.type === "url") {
    return typeof value.url === "string" && value.url.length > 0;
  }

  return (
    value.type === "file" &&
    typeof value.fileId === "string" &&
    value.fileId.length > 0 &&
    typeof value.name === "string" &&
    typeof value.mimeType === "string"
  );
}

/** Validates imported link shape before persistence. */
function isLink(value: unknown): value is Link {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.categoryId === "string" &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.url === "string" &&
    value.url.length > 0 &&
    (value.note === undefined || typeof value.note === "string") &&
    isLinkIcon(value.icon) &&
    typeof value.order === "number" &&
    Number.isFinite(value.order) &&
    typeof value.visitCount === "number" &&
    Number.isFinite(value.visitCount) &&
    (value.lastVisitedAt === undefined || isTimestamp(value.lastVisitedAt)) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}

/** Validates imported icon metadata and encoded data before persistence. */
function isExportedIconFile(value: unknown): value is ExportedIconFile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.name === "string" &&
    typeof value.mimeType === "string" &&
    typeof value.size === "number" &&
    Number.isFinite(value.size) &&
    isTimestamp(value.createdAt) &&
    typeof value.dataUrl === "string" &&
    value.dataUrl.startsWith("data:")
  );
}

/** Creates a downloadable JSON backup from the current deck snapshot. */
export async function createDeckExportFile(deck: StoredDeckSnapshot): Promise<DeckExportFile> {
  const iconFiles = await Promise.all(
    deck.iconFiles.map(async (iconFile) => ({
      id: iconFile.id,
      name: iconFile.name,
      mimeType: iconFile.mimeType,
      size: iconFile.size,
      createdAt: iconFile.createdAt,
      dataUrl: await readBlobAsDataUrl(iconFile.blob),
    })),
  );

  return {
    app: "link-deck",
    version: 1,
    exportedAt: new Date().toISOString(),
    deck: {
      id: deck.id,
      name: deck.name,
      categories: deck.categories,
      links: deck.links,
      iconFiles,
      interfaceSize: deck.interfaceSize,
      sortMode: deck.sortMode,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    },
  };
}

/** Parses and validates a JSON backup file before replacing local data. */
export async function parseDeckExportFile(json: string): Promise<StoredDeckSnapshot> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Import file is not valid JSON");
  }

  if (
    !isRecord(parsed) ||
    parsed.app !== "link-deck" ||
    parsed.version !== 1 ||
    !isRecord(parsed.deck)
  ) {
    throw new Error("Import file is not a Link Deck backup");
  }

  const deck = parsed.deck;

  if (!Array.isArray(deck.links) && Array.isArray(deck.sites)) {
    throw new Error("Unsupported backup format.");
  }

  if (
    typeof deck.id !== "string" ||
    typeof deck.name !== "string" ||
    !Array.isArray(deck.categories) ||
    !Array.isArray(deck.links) ||
    !Array.isArray(deck.iconFiles) ||
    !VALID_INTERFACE_SIZES.has(deck.interfaceSize as InterfaceSize) ||
    !VALID_SORT_MODES.has(deck.sortMode as SortMode) ||
    !isTimestamp(deck.createdAt) ||
    !isTimestamp(deck.updatedAt)
  ) {
    throw new Error("Import file is missing required deck data");
  }

  const categories = deck.categories;
  const links = deck.links;
  const exportedIconFiles = deck.iconFiles;

  if (!categories.length || !categories.every(isCategory)) {
    throw new Error("Import file must contain at least one valid category");
  }

  if (!links.every(isLink)) {
    throw new Error("Import file contains invalid links");
  }

  if (!exportedIconFiles.every(isExportedIconFile)) {
    throw new Error("Import file contains invalid icon files");
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  const iconFileIds = new Set(exportedIconFiles.map((iconFile) => iconFile.id));

  if (categoryIds.size !== categories.length) {
    throw new Error("Import file contains duplicate categories");
  }

  if (new Set(links.map((link) => link.id)).size !== links.length) {
    throw new Error("Import file contains duplicate links");
  }

  if (iconFileIds.size !== exportedIconFiles.length) {
    throw new Error("Import file contains duplicate icon files");
  }

  if (links.some((link) => !categoryIds.has(link.categoryId))) {
    throw new Error("Import file contains links for missing categories");
  }

  if (links.some((link) => link.icon.type === "file" && !iconFileIds.has(link.icon.fileId))) {
    throw new Error("Import file contains links with missing icon files");
  }

  const iconFiles = await Promise.all(
    exportedIconFiles.map(async (iconFile) => ({
      id: iconFile.id,
      blob: await dataUrlToBlob(iconFile.dataUrl),
      name: iconFile.name,
      mimeType: iconFile.mimeType,
      size: iconFile.size,
      createdAt: iconFile.createdAt,
    })),
  );

  return {
    id: deck.id,
    name: deck.name,
    categories,
    links,
    iconFiles,
    interfaceSize: deck.interfaceSize as InterfaceSize,
    legacyLinksDetected: false,
    sortMode: deck.sortMode as SortMode,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
  };
}
