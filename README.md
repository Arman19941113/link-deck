# Link Deck

Link Deck is a local-first start page for saving, grouping, searching, and opening frequently used links. It keeps link data in the browser with IndexedDB and supports custom categories, drag ordering, favicon handling, and local icon files.

## Features

- Save links with a title, URL, notes, category, and icon source.
- Group links into editable categories and reorder them with drag and drop.
- Search by title, notes, URL, and pinyin-friendly text matching.
- Sort links by manual order or title.
- Store custom icon files locally in the browser.

## Development

Install dependencies:

```bash
pnpm install
```

Run the local app:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Check formatting and lint rules:

```bash
pnpm format:check
pnpm lint
```
