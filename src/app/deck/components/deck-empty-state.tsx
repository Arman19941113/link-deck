// Deck empty state for no saved links or no matching search results.

import { useTranslation } from 'react-i18next'

type DeckEmptyStateProps = {
  hasQuery: boolean
}

/** Shows brief page feedback when there is no data or no search result. */
export function DeckEmptyState({ hasQuery }: DeckEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-md border bg-card px-4 py-12 text-center">
      <h2 className="text-lg font-medium tracking-normal">
        {hasQuery ? t('deck.empty.noMatchesTitle') : t('deck.empty.noLinksTitle')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {hasQuery ? t('deck.empty.noMatchesDescription') : t('deck.empty.noLinksDescription')}
      </p>
    </section>
  )
}
