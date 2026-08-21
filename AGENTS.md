# Tathya — Agent Notes

Single-page React PWA. Personal quote/wisdom library rendered as swipeable, story-style typography cards. No backend — all state is `localStorage`. Deployed via Vercel (project name `tathya`).

## Stack
- Vite 8 + React 19 (JSX, no TypeScript)
- Linter: **oxlint** (not ESLint). No typecheck step, no test framework — neither is configured.
- PWA via `vite-plugin-pwa` (`registerType: 'autoUpdate'`)
- Runtime: `framer-motion`, `lucide-react`, `html-to-image`
- React Compiler is intentionally **not** enabled (per README)

## Commands
- `npm run dev` — Vite dev server, default `http://localhost:5173`
- `npm run build` — static build to `dist/` (what Vercel serves)
- `npm run preview` — serve `dist/` locally
- `npm run lint` — oxlint; configured rules in `.oxlintrc.json` (`react/rules-of-hooks`, `react/only-export-components`)

There is no `test` script. Do not invent one.

## Architecture
- Entry: `src/main.jsx` → `src/App.jsx`
- `src/components/` — `FeedView`, `AddFlow`, `SuccessView`, `ShareSheet`, `OnboardingModal`
- `src/hooks/` — `useTimeTheme.js` (time-of-day), `useShare.js`
- `src/utils/exportCard.js` — `downloadCardImage` / `getCardFile` via `html-to-image` (filters out nodes with class `no-export`)
- App-level tab routing is a single `activeTab` state in `App.jsx`: `'feed' | 'add' | 'success'`. There is no router.

## Persistence (`localStorage` keys)
- `tathya_wisdom_quotes` — JSON array of quote objects `{ id, text, author, source, theme, tags, favorite }`
- `tathya_onboarding_seen` — flag; absence triggers `OnboardingModal` on first load
- Seed data: `DEFAULT_QUOTES` in `App.jsx` populates only when storage is empty.

## Theming (two independent systems)
1. **Time-of-day** — `useTimeTheme` sets `data-theme` on `<html>` (`dawn` 5–9, `day` 9–17, `dusk` 17–20, `night` otherwise). Re-evaluated every 5 min. CSS lives in `styles/theme.css` (imported at top of `src/index.css`).
2. **Per-quote** — `App.jsx` derives a class like `theme-${theme.toLowerCase().replace(/\s+/g, '-')}` from `activeQuote.theme`. Defined classes in `src/index.css` lines ~115–165: `midnight-cobalt`, `ethereal-dawn`, `forest-green`, `sunset-orange`, `sand-solid`, `charcoal-solid`. **Adding a new quote theme requires adding the matching `.theme-*` class in `src/index.css`**, otherwise the quote falls back to `theme-charcoal-solid`.

## PWA assets
- Manifest: `public/manifest.json` (also referenced from `index.html`)
- Icons: `public/icons/icon-192.png`, `public/icons/icon-512.png` — required, referenced by `vite.config.js` and the manifest
- Favicon is inline-SVG in `index.html`; do not assume a separate `favicon.svg` is referenced.

## Conventions / gotchas
- Lint config expects React fast-refresh friendly exports; the `only-export-components` rule allows constant exports.
- Heavy inline styles in `App.jsx`'s options drawer — intentional, not a bug to "fix".
- `dist/`, `node_modules/`, `.vercel/` are gitignored.
- README has unfilled `<!-- ... -->` placeholders for backend, hosting, and license — don't treat those sections as authoritative.
