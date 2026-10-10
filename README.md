# Expense Tracker

A voice-first, mobile-first personal expense tracker that runs as an installable PWA. Say “250 groceries at DMart”, confirm, done. Everything is stored on your phone (IndexedDB) and any month exports to Excel.

**Privacy:** there is no backend, no login and no analytics. The only data that leaves the device is the speech audio itself, which Chrome sends to Google’s speech service when you use the mic (the same engine as Gboard voice typing). Typed input never leaves the device.

## Features

- **Voice capture** with the Web Speech API (`en-IN` by default), live transcript, auto-stop on silence, friendly errors, and a typed fallback.
- **Natural-language parser** (`src/lib/parser/`, pure and unit-tested): amounts (`1,250`, `₹`, `2k`, “two thousand five hundred”, “one lakh”), categories (keywords, plurals, “under X”), dates (today, yesterday, weekdays, “5th October”), payment method, and several expenses per sentence.
- **Confirmation sheet** — never saves silently. Asks for a missing category/amount (tap or voice), 5-second Undo, learns new keywords, optional auto-save.
- **Home / Month / Categories / Settings**, swipe-left or long-press to edit/delete.
- **Excel export** (`Expenses_YYYY-MM.xlsx`: Transactions + Summary sheets), shared through the Android share sheet, plus “export everything”.
- **Backup/restore** as JSON. **Offline** after first load.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173  (microphone works on localhost)
npm test           # parser unit tests
npm run build && npm run preview   # production build with service worker
```

`npm run icons` regenerates the PNG icons from the SVG in `scripts/gen-icons.mjs`.

## Deploy

### GitHub Pages (configured)
`.github/workflows/deploy.yml` builds and deploys on every push to `main`. In the repo: **Settings → Pages → Source: GitHub Actions**. The site is served at `https://<user>.github.io/<repo>/` (HTTPS, required for the mic). The workflow sets `BASE_PATH` automatically.

### Netlify
Drag the `dist/` folder onto <https://app.netlify.com/drop>, or connect the repo — `netlify.toml` already sets `npm run build` / `dist`. No base path needed.

## Install on a Galaxy S23

1. Open the site in **Chrome**, allow the microphone when asked.
2. Menu (⋮) → **Add to Home screen** → **Install**.
3. Long-press the home-screen icon for the **Add by voice** shortcut.
4. Open **Settings** in the app and check *Persistent storage*. Installing to the home screen usually gets it granted.

If the mic is blocked: Chrome → ⋮ → Settings → Site settings → Microphone → allow this site.

## Parser notes

- A weekday means the most recent **past** occurrence — saying “on Sunday” on a Sunday gives last Sunday.
- “on the 5th” rolls back to the previous month if the 5th is still in the future; “5th October” rolls back a year.
- A category is only filled when exactly one category matches best; ties are left blank so the app asks.
- Amounts: the largest unit-less number wins, so “2 kg tomatoes 80” → 80.

## Known limitations

- **Voice needs internet** (Chrome’s cloud speech). Offline, use the typed box or your keyboard’s mic.
- `maxAlternatives: 3` is requested, but Chrome on Android usually returns a single alternative; the multi-alternative logic is in place but rarely has more than one to choose from.
- Samsung Internet’s Web Speech support is patchy; the typed fallback covers it.
- Data is per-browser-profile: clearing Chrome site data, or uninstalling the PWA, **deletes everything**. Use Settings → Backup regularly.
- Excel export has no bold header or frozen row (SheetJS Community Edition can’t write styles; no extra library added by design).
- Web Share with files needs Chrome on Android over HTTPS; elsewhere the file downloads.
- The parser is English (+ Indian number units). Hindi speech is recognised if you pick *Hindi* but the parser expects English words.
- Typed text entered in the capture box is stored with source `manual`; only speech recognition results are `voice`.
- Lighthouse was not run in this environment; build output is small (the Excel library is lazy-loaded) and the app shell is precached.
- Tested in desktop Chromium emulating a 393×851 phone; not yet on a physical S23.
