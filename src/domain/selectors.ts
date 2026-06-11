// Provides domain selectors for UI display.

import { createSearchIndex, matchesSearchIndex, normalizeSearchText } from "./search";
import type { Category, CategorySection, Link, SortMode } from "./types";

/** Creates a stable new array sorted by the domain order field. */
function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order);
}

/** Sorts missing or invalid visit times last. */
function getVisitedTime(link: Link): number {
  const timestamp = link.lastVisitedAt ? Date.parse(link.lastVisitedAt) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

/** Applies the display sort mode to a link list. */
function sortLinks(links: Link[], sortMode: SortMode): Link[] {
  switch (sortMode) {
    case "mostVisited":
      return [...links].sort(
        (left, right) => right.visitCount - left.visitCount || left.order - right.order,
      );
    case "recentVisited":
      return [...links].sort(
        (left, right) => getVisitedTime(right) - getVisitedTime(left) || left.order - right.order,
      );
    case "name":
      return [...links].sort(
        (left, right) => left.name.localeCompare(right.name, "zh-CN") || left.order - right.order,
      );
    case "manual":
      return sortByOrder(links);
  }
}

/** Checks whether the link fields match the query. */
function linkMatchesQuery(link: Link, query: string): boolean {
  return matchesSearchIndex(query, createSearchIndex([link.name, link.url, link.note ?? ""]));
}

/** Builds displayable category groups from categories, query, and sort mode. */
export function selectCategorySections(
  categories: Category[],
  links: Link[],
  query: string,
  sortMode: SortMode,
): CategorySection[] {
  const normalizedQuery = normalizeSearchText(query);

  return sortByOrder(categories).flatMap((category) => {
    const categoryLinks = links.filter((link) => link.categoryId === category.id);

    if (!categoryLinks.length) {
      return [];
    }

    const categoryMatches = normalizedQuery
      ? matchesSearchIndex(normalizedQuery, createSearchIndex([category.name]))
      : false;
    const visibleLinks =
      !normalizedQuery || categoryMatches
        ? categoryLinks
        : categoryLinks.filter((link) => linkMatchesQuery(link, normalizedQuery));

    if (!visibleLinks.length) {
      return [];
    }

    return [
      {
        category,
        links: sortLinks(visibleLinks, sortMode),
      },
    ];
  });
}
