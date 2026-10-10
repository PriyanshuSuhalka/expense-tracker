# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Voice-first personal expense tracker: a React 18 + Vite PWA, no backend. All data lives in IndexedDB (Dexie). Mobile-first (Galaxy S23, Chrome). See README.md for deploy/install steps and known limitations.

## Commands

- `npm run dev` — dev server (mic works on localhost)
- `npm test` — Vitest (all tests are in `src/test/parser.spec.js`); single test: `npx vitest run -t "groceries"`
- `npm run build` / `npm run preview` — production build; the service worker only exists in the build, so test PWA/offline behaviour via `preview`
- `npm run icons` — regenerate `public/*.png` from the SVG in `scripts/gen-icons.mjs`
- Deploys on push to `main` via `.github/workflows/deploy.yml` (GitHub Pages; sets `BASE_PATH=/<repo>/`). Locally the base is `./`.

## Architecture

- **Parser (`src/lib/parser/`)** is pure and has no DOM/DB access. `parseExpense(text, categories, today)` → `splitExpenses` (one segment per expense) → per segment, extractors run in a fixed order, each removing what it matched from the working string: date → payment → amount → category → `cleanDescription` on the remainder. Order matters (e.g. dates are removed first so "5th" isn't read as an amount). `today` is injected so tests are deterministic. `category` in the result is the category *name*.
- **Data model**: expenses store the category **name**, not an id. `repo.js` therefore rewrites expenses on category rename and reassigns to "Other" on delete. "Other" cannot be deleted.
- **State**: `src/state/store.jsx` holds everything cross-cutting — live settings/categories (Dexie `liveQuery` via `useLive`), toast/undo, the confirm queue (`flow`: multi-expense drafts, new vs edit), capture sheet, and the `ask()` dialog. Screens read Dexie directly with `useLive`; routing is hash-based (`useRoute`) so Pages needs no rewrites.
- **Voice flow**: `CaptureSheet` → `lib/speech.js` (wraps SpeechRecognition) → `submitTranscript` → `parseAlternatives` → either auto-save (setting, only if amount and category confidence ≥ 0.8) or `ConfirmSheet`. The `#/?capture=1` hash is the PWA "Add by voice" shortcut target.
- **Excel** (`lib/excel.js`) is dynamically imported from Month/Settings to keep SheetJS out of the main bundle. Dates are written as numeric serials with a `dd-mmm-yyyy` format to avoid timezone shifts. SheetJS must come from the cdn.sheetjs.com tarball (not the npm `xlsx` package).

## Gotchas

- Large heredocs in the Bash tool fail on this machine; create source files with the Write tool.
- A weekday in the parser always means the most recent *past* occurrence, never today.
