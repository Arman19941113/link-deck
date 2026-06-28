---
name: capture-readme-previews
description: Regenerate Link Deck README preview screenshots for the English and Chinese home screens. Use when asked to refresh, recapture, update, or verify README assets such as public/preview/link-deck-home-en.png and public/preview/link-deck-home-zh.png, especially when the screenshots must use reset browser data, the Normal display size setting, a 1200x800 CSS viewport, and DPR 2 output.
---

# Capture README Previews

Use this skill to refresh the two README home screen images:

- `public/preview/link-deck-home-en.png`
- `public/preview/link-deck-home-zh.png`

The required capture state is deterministic: reset browser data, set the app language, open Settings, choose the Normal display size through the UI, close Settings, then capture the home screen at 1200x800 CSS pixels with DPR 2.

## Workflow

1. Confirm the README image paths if the user did not name them:
   - `README.md` should reference `public/preview/link-deck-home-en.png`.
   - `README_CN.md` should reference `public/preview/link-deck-home-zh.png`.
2. Start the dev server with `pnpm dev --host 127.0.0.1 --port 4173`, unless a suitable local server is already running.
3. Use the built-in browser, not standalone Playwright, when the user asks for the built-in browser. Read the `browser:control-in-app-browser` skill before browser tool calls.
4. Read `references/browser-workflow.md` and run the Node REPL workflow there.
5. Validate both PNGs with `sips -g pixelWidth -g pixelHeight`; expected dimensions are `2400x1600`.
6. Stop any dev server you started.
7. Report the updated file paths, the verified dimensions, and whether unrelated worktree changes were present.
