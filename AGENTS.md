# Tathya — Agent Notes

Single-page React PWA. Personal quote/wisdom library rendered as swipeable, story-style typography cards. No backend — all state is `localStorage`. Deployed via Vercel (project name `tathya`).

## Stack
- Vite 8 + React 19 (JSX, no TypeScript)
- Linter: **oxlint** (not ESLint). No typecheck step, no test framework — neither is configured.
- PWA via `vite-plugin-pwa` (`registerType: 'autoUpdate'`)
- Runtime UI dependency: `lucide-react` (card export uses the local SVG/canvas pipeline)
- React Compiler is intentionally **not** enabled (per README)

## Commands
- `npm run dev` — Vite dev server, default `http://localhost:5173`
- `npm run build` — static build to `dist/` (what Vercel serves)
- `npm run preview` — serve `dist/` locally
- `npm run curate:photos` — authoring-time Unsplash curation (needs `UNSPLASH_ACCESS_KEY` in `.env`)
- `npm run check:photos` — validates the generated pool (every cell populated, credited, ixid-tagged)
- `npm run lint` — oxlint over `src/`, `scripts/`, and `vite.config.js`; configured rules in `.oxlintrc.json` (`react/rules-of-hooks`, `react/only-export-components`)

There is no `test` script. Do not invent one.

## Architecture
- Entry: `src/main.jsx` → `src/App.jsx`
- `src/components/` — `FeedView`, `AddFlow`, `SuccessView`, `ShareSheet`, `DesignPanel`, `OptionsSheet`, `ConfirmDialog`, `Sheet`
- `src/hooks/` — `useTimeTheme.js` (time-of-day), `useShare.js`, `useDesign.js` (style + palette)
- `src/design/` — `presets.js` (STYLES + PALETTES registry), `quoteThemes.js` (per-quote card colors), `photoPresets.js` (backdrop pool + per-style/per-palette treatment)
- `src/design.css` — `[data-style]` / `[data-palette]` token layers + shared chrome primitives
- `src/components/PhotoBackdrop.jsx` — full-bleed photo layer (base → img → tint → scrim → grain)
- `src/utils/cardExport/` — SVG-based card export pipeline (replaced html-to-image):
  - `exportQuoteCard.js` / `index.js` — public API (`downloadCardPng`, `getCardFile`, `downloadCardSvg`)
  - `quoteCardToSvg.js` — renders card state to a standalone SVG string
  - `svgToPng.js` — Blob → Image → Canvas rasterizer at arbitrary output resolution
  - `photoBake.js` — canvas bake: fetch photo → filter/tint/scrim/grain → base64 data URI
  - `cardColors.js` — resolves the palette cascade so the export paints the colors the app shows
  - `themeTokens.js` — JS mirror of the `.theme-*` CSS classes; **must stay in sync with `index.css`**
  - `gradientToSvg.js` — parses CSS `linear-gradient()` into SVG `<linearGradient>` defs
  - `wrapText.js` — DOM-measured word wrap (requires fonts loaded first)
  - `fontEmbed.js` — fetches woff2 files, base64-embeds them as data URIs into exported SVGs (blob:-loaded SVGs cannot resolve relative font URLs). Embeds **only the faces the active style needs**
- Fonts are self-hosted: `public/fonts/*.woff2` + `@font-face` in `src/fonts.css`. No Google Fonts requests.
- App-level tab routing is a single `activeTab` state in `App.jsx`: `'feed' | 'add' | 'success'`. There is no router.

## Photo backdrops
Off by default (`photoMode: 'off'`). When on, `PhotoBackdrop` stacks:
`dominant-color base → <img> → palette tint (multiply) → scrim gradient → grain`.

- **The scrim is the accessibility guarantee, not a wash.** It holds `--photo-scrim-from` to 14% then ramps to `--photo-scrim-to` by 42% — above where the centred quote block can start. Verified worst-case (hostile solid photo) at **≥8.3:1 across all 35 style × palette cells**; 20:1 on dark palettes. Changing any scrim value means re-running that check.
- `--photo-*` values live in **three** places that must agree: `src/design.css` (palettes + styles), `styles/theme.css` + `.theme-sand-solid` in `src/index.css` (per-quote fallbacks), and `src/design/photoPresets.js` (JS mirror for the canvas bake).
- Do **not** re-declare `--photo-*` on `.app-container` — that shadows the inherited time-of-day values and pins every surface to the dark set.
- Export bakes the backdrop on a canvas first (`photoBake.js`); a remote `<image href>` will not load in the blob-URL SVG rasterizer. A failed bake resolves to `null` and the card falls back to its gradient — SAVE never hard-errors offline.
- `cardColors.js` exists because the export read quote-theme text while the scrim came from the palette (`paper` + `text: #ffffff` = unreadable). Keep `effectiveCardColors` in step with the CSS specificity contract.

## Curation (`npm run curate:photos`)
`scripts/curate-photos.mjs` is the **only** consumer of the Unsplash API key. It queries one cell per (style × palette) — 35 requests, inside the 50/hour demo cap — and rewrites `SEED_POOL` in `src/design/photoPresets.js` with `ixid`-tagged, photographer-credited picks.

- Key lives in `.env` (gitignored) as `UNSPLASH_ACCESS_KEY`. **Never the secret key.** It is read by that script only and is never bundled — the shipped app hotlinks the CDN and makes **zero** API calls.
- Until curation runs, `SEED_POOL` holds temporary placeholders with `credit: null` and `CURATED = false`; the panel says so. Placeholder photos are arbitrary, so some (style, palette) pairs read too dark — that is seed data, not the design system.
- Re-running is free: raw responses are cached in `.unsplash-curation-cache.json` (gitignored) and the skip test is key *presence*, not length, so a query that legitimately returns zero results does not re-burn quota. `--force` ignores the cache.
- Cells whose queries come back thin (<2 photos, after a relaxed retry that drops `content_filter=high` and the portrait constraint) are topped up from their style's `base` pool.
- `scripts/check-photos.mjs` guards the generated file — run it after any curation. It exits non-zero so it can gate a commit.
- Hotlinking must keep Unsplash's `ixid` parameter (it attributes the view to the photographer) and every shipped photo must carry its credit in the UI and in the exported PNG.
- Backdrop images are runtime-cached via workbox `runtimeCaching` for `images.unsplash.com`, so the app keeps its backdrop offline.

## Modal surfaces
`src/components/Sheet.jsx` is the single primitive behind every overlay (`DesignPanel`, `OptionsSheet`, `ShareSheet`, `ConfirmDialog`). It owns Escape-to-dismiss, focus move/restore, a Tab loop, `role="dialog"` + `aria-modal`, and `overscroll-behavior: contain`. Do **not** hand-roll another overlay — pass `variant` (`bottom` | `rail` | `center`) instead. The scrim is a non-interactive `div`; keyboard users get Escape.

## Design presets (`data-style` + `data-palette`)
Two orthogonal axes set on `.app-container` in `App.jsx`:
- **`data-style`** — typography + shape language. 5 presets: `brutalism`, `gothic`, `mid-century`, `bohemian`, `ethereal` (default). Swaps `--font-*`, type scale/weight/tracking, `--rounded-*`, hairlines and shadows.
- **`data-palette`** — color. `per-quote` (default, passes through to the quote's `.theme-*`), plus `midnight-cobalt`, `rose-noir`, `orchid`, `citrus`, `moss`, `paper`.

Specificity contract: `.app-container[data-palette='x']` is `(0,2,0)` and beats `.theme-*` at `(0,1,0)`, so a palette wins while `per-quote` falls through untouched.

**Two places must stay in sync when adding a preset:**
1. `src/design.css` — the token values (source of truth for the running app).
2. `src/design/presets.js` — `STYLES[*].export` + `exportFonts` (the SVG renderer cannot read custom properties), and `STYLE_IDS` / `PALETTES`.

Adding a style also requires its `@font-face` in `src/fonts.css` **and** an entry in `FONT_FILES` (`src/utils/cardExport/fontEmbed.js`), or exports silently fall back.

## Persistence (`localStorage` keys)
- `tathya_wisdom_quotes` — JSON array of quote objects `{ id, text, author, source, theme, tags, favorite }`
- `tathya_design` — `{ style, palette, photoMode, photoId }` design preferences (see `src/design/presets.js`); invalid values fall back to `DEFAULT_DESIGN`
- Seed data: `DEFAULT_QUOTES` in `App.jsx` populates only when storage is empty.

## Theming (three independent systems)
1. **Time-of-day** — `useTimeTheme` sets `data-theme` on `<html>` (`dawn` 5–9, `day` 9–17, `dusk` 17–20, `night` otherwise). Re-evaluated every 5 min. CSS lives in `styles/theme.css` (imported at top of `src/index.css`).
2. **Design style + palette** — `useDesign` writes `data-style` / `data-palette` on `.app-container`; CSS in `src/design.css`.
3. **Per-quote** — `App.jsx` derives a class like `theme-${theme.toLowerCase().replace(/\s+/g, '-')}` from `activeQuote.theme`. Defined classes in `src/index.css` lines ~115–165: `midnight-cobalt`, `ethereal-dawn`, `forest-green`, `sunset-orange`, `sand-solid`, `charcoal-solid`. **Adding a new quote theme requires (1) an entry in `src/design/quoteThemes.js`, (2) the matching `.theme-*` class in `src/index.css`, and (3) a matching key in `src/utils/cardExport/themeTokens.js`**, otherwise the quote falls back to `theme-charcoal-solid`.

## PWA assets
- Manifest: `public/manifest.json` (also referenced from `index.html`)
- Icons: `public/icons/icon-192.png`, `public/icons/icon-512.png` — required, referenced by `vite.config.js` and the manifest
- Favicon is inline-SVG in `index.html`; do not assume a separate `favicon.svg` is referenced.

## Conventions / gotchas
- Lint config expects React fast-refresh friendly exports; the `only-export-components` rule allows constant exports.
- Heavy inline styles remain in a few view files (e.g. `FeedView`'s floating controls) — intentional, not a bug to "fix". Shared primitives live in `src/design.css` (`.icon-btn`, `.chrome-row`, `.chrome-primary`, `.chip`, `.underline-field`).
- Add a `--on-accent` token whenever you add a theme/palette: it is the only thing that keeps text legible on the accent fill.
- Never write `var(--x)` inside the block that declares `--x` — a self-referential custom property is invalid at computed-value time and silently poisons every consumer.
- Story auto-advance suspends on `document.hidden` and is disabled under `prefers-reduced-motion`; the arrow-key + Space equivalents live in `FeedView`'s `handleKeyDown`.
- `dist/`, `node_modules/`, `.vercel/` are gitignored.
- README has unfilled `<!-- ... -->` placeholders for backend, hosting, and license — don't treat those sections as authoritative.
