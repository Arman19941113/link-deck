# AGENTS.md

Durable project context for coding agents working on Link Deck. Keep this file limited to project-specific constraints that are hard to infer from code.

## Product

- Link Deck is a local-first browser start page for saving, grouping, searching, and opening frequently used links.
- There is no backend or account system. Deck data, settings, and uploaded icons live in browser storage.
- Optimize for quiet, fast daily desktop use. The app intentionally has a `64rem` minimum body width; do not replace this with a broad mobile-first rewrite unless requested.

## Architecture

- Keep dependency direction close to `UI -> app hooks/view models -> domain/services -> repositories`.
- Keep `src/domain` pure: no React state, toasts, DOM access, IndexedDB transactions, or browser APIs.
- Put deck-specific pure rules in `src/domain/deck`; browser-backed adapters and cross-store operations in `src/services`; IndexedDB schema and transactions in `src/repositories`.
- Before changing the main deck flow, inspect `src/app/deck/hooks/use-deck-shell-view-model.ts` and the hooks it composes.

## Persistence

- IndexedDB schema changes must update `DATABASE_VERSION` and upgrade logic in `src/repositories/schema.ts`.
- Preserve `createdAt`, `updatedAt`, and `order` semantics for links, categories, and icons.
- Category deletion, link moves, and reorder operations must keep references valid and avoid orphaned links.
- Import/export changes must account for defaults, existing browser data, stored icon files, and portable backup payloads. Export should exclude transient UI/runtime state.

## UI and i18n

- Reuse existing components, Tailwind classes, and CSS variables before adding new abstractions or CSS layer rules.
- Theme tokens live in `src/index.css`; check dark mode when changing colors, surfaces, or theme behavior.
- Prefer `lucide-react` for icon buttons when an icon exists.
- Avoid marketing-page layouts and decorative UI that does not improve repeated use.
- User-visible text belongs in both `src/locales/en.json` and `src/locales/zh.json`; keep key structures aligned and demo/default content equivalent.
- Source identifiers and internal comments stay in English except localization copy.

## Verification

- Use `pnpm` for package operations.
- Add or update the closest relevant test for domain rules, persistence/import/export behavior, user-visible workflows, or regressions.
- Use Vitest for domain, hooks, and components. Use Playwright only for browser-backed flows such as IndexedDB workflows, dialogs, and screenshots.
- After edits, run `pnpm run format`, `pnpm run lint`, `pnpm run tailwind:lint`, and `pnpm run typecheck`.
- For behavior changes, also run `pnpm test` or `pnpm run test:e2e` when relevant.
