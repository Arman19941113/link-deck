# AGENTS.md

This file gives AI coding agents the durable project context needed to modify Link Deck safely. It applies to the whole repository unless a more specific instruction overrides it.

## Product Intent

- Link Deck is a local-first browser start page for saving, grouping, searching, and opening frequently used links.
- There is no backend or account system. Deck data, settings, and uploaded icon files live in the browser.
- Keep the app quiet, fast, desktop-first, and utility-focused. Avoid marketing-page patterns and decorative UI that does not improve repeated daily use.

## Architecture

- Keep the dependency direction close to `UI -> app hooks/view model -> domain/services -> repositories`.
- Keep React state, toast handling, DOM access, IndexedDB transactions, and browser APIs out of `src/domain`.
- Keep domain value types near their owning rules instead of creating broad catch-all type files.
- Put deck-specific pure helpers in `src/domain/deck`; put browser-backed adapters and cross-store operations in `src/services`.
- Keep IndexedDB schema and transaction mechanics in `src/repositories`.
- Before changing the main deck flow, inspect `src/app/deck/hooks/use-deck-shell-view-model.ts` and the hooks it composes.

## Code Map

- `src/app`: React app composition, deck/settings flows, hooks, and view models.
- `src/domain`: pure deck/settings rules, types, selectors, validation, sorting, defaults, search, URL, and backup payload logic.
- `src/repositories`: IndexedDB schema and store-level persistence.
- `src/services`: cross-store operations and browser-facing adapters such as Blob/data URL handling.
- `src/components`, `src/lib`, `src/locales`, and `config/vite`: reusable UI, generic utilities, translations, and build config.

## Data and Persistence

- IndexedDB schema changes must update `DATABASE_VERSION` and upgrade logic in `src/repositories/schema.ts`.
- Preserve `createdAt`, `updatedAt`, and `order` semantics when saving links, categories, or icons.
- Category deletion, link moves, and reorder operations must keep references valid and avoid orphaned links.
- Persistence changes must account for import/export, defaults, existing browser data, and stored icon files.
- Exported backup data should stay portable and exclude transient UI/runtime state.

## UI and Styling

- Prefer existing UI patterns and components before adding new abstractions.
- Use Tailwind classes and existing CSS variables first. Add CSS layer rules only for shared, theme-level, or cross-component behavior.
- Theme tokens and design-style variables are centralized in `src/index.css`.
- Prefer `lucide-react` for icon buttons when an icon exists.
- When changing colors, surfaces, or theme behavior, check the existing design styles and dark mode.
- Do not start broad responsive/mobile rewrites unless requested.

## i18n

- User-visible text belongs in both `src/locales/en.json` and `src/locales/zh.json`.
- Keep translation key structure aligned between English and Chinese files.
- Source code identifiers and internal comments should be English, except localization copy.
- Keep English and Chinese default/demo content equivalent.

## Code Style

- Default to English in source code, except i18n/localization copy.
- New source files should start with a brief top-of-file comment explaining their purpose.
- Add comments for new functions/classes/interfaces only when the purpose is not obvious.
- Within related function groups, keep top-down order: primary caller first, direct helpers next, lower-level helpers later.

## Commands

- Use `pnpm` for package operations
- Install dependencies: `pnpm install`
- Dev server: `pnpm dev`
- Production build: `pnpm build`
- Preview: `pnpm preview`

## Post-Task Lint Check

After editing files, run these commands in order:

1. `pnpm run format`
2. `pnpm run lint`
3. `pnpm run tailwind:lint`
4. `pnpm run typecheck`

If any new errors were introduced by your edits, fix them immediately.
