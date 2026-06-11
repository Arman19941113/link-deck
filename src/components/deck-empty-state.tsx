// Deck empty state for no saved links or no matching search results.

type DeckEmptyStateProps = {
  hasQuery: boolean;
};

/** Shows brief page feedback when there is no data or no search result. */
export function DeckEmptyState({ hasQuery }: DeckEmptyStateProps) {
  return (
    <section className="rounded-md border bg-card px-4 py-12 text-center">
      <h2 className="text-lg font-medium tracking-normal">
        {hasQuery ? "No matching links found" : "No links yet"}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasQuery ? "Try another keyword." : "Use Add link to save your first link."}
      </p>
    </section>
  );
}
