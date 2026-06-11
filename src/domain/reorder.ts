// Provides domain update helpers for category and link drag sorting.

import type { Category, Link } from "./types";

/** Creates a stable new array sorted by the domain order field. */
function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order);
}

/** Clamps external positions to the valid insertion range. */
function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(index)) {
    return length;
  }

  return Math.min(Math.max(Math.trunc(index), 0), length);
}

/** Inserts an item without mutating the original array. */
function insertAt<T>(items: T[], item: T, index: number): T[] {
  const nextItems = [...items];
  nextItems.splice(clampIndex(index, nextItems.length), 0, item);
  return nextItems;
}

/** Reorders categories from drag results and writes continuous order values. */
export function reorderCategories(
  categories: Category[],
  activeId: string,
  overId: string,
): Category[] {
  const orderedCategories = sortByOrder(categories);
  const activeIndex = orderedCategories.findIndex((category) => category.id === activeId);
  const overIndex = orderedCategories.findIndex((category) => category.id === overId);

  if (activeIndex < 0 || overIndex < 0) {
    return categories;
  }

  const [activeCategory] = orderedCategories.splice(activeIndex, 1);
  orderedCategories.splice(overIndex, 0, activeCategory);

  return orderedCategories.map((category, index) => ({
    ...category,
    order: index + 1,
  }));
}

/** Rewrites link order in a category with continuous numbers. */
function withSequentialOrder(links: Link[]): Link[] {
  return links.map((link, index) => ({
    ...link,
    order: index + 1,
  }));
}

/** Moves a link to a target category and position while reordering source and target categories. */
export function moveLink(
  links: Link[],
  activeId: string,
  targetCategoryId: string,
  targetIndex: number,
): Link[] {
  const activeLink = links.find((link) => link.id === activeId);

  if (!activeLink) {
    return links;
  }

  const now = new Date().toISOString();
  const sourceCategoryId = activeLink.categoryId;
  const movedLink: Link = {
    ...activeLink,
    categoryId: targetCategoryId,
    updatedAt: now,
  };
  const replacements = new Map<string, Link>();

  if (sourceCategoryId === targetCategoryId) {
    const orderedLinks = sortByOrder(
      links.filter((link) => link.categoryId === sourceCategoryId && link.id !== activeId),
    );

    for (const link of withSequentialOrder(insertAt(orderedLinks, movedLink, targetIndex))) {
      replacements.set(link.id, link);
    }
  } else {
    const sourceLinks = sortByOrder(
      links.filter((link) => link.categoryId === sourceCategoryId && link.id !== activeId),
    );
    const targetLinks = sortByOrder(links.filter((link) => link.categoryId === targetCategoryId));

    for (const link of withSequentialOrder(sourceLinks)) {
      replacements.set(link.id, link);
    }

    for (const link of withSequentialOrder(insertAt(targetLinks, movedLink, targetIndex))) {
      replacements.set(link.id, link);
    }
  }

  return links.map((link) => replacements.get(link.id) ?? link);
}
