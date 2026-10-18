#!/usr/bin/env node
/**
 * curate:photos — authoring-time Unsplash curation.
 *
 * Queries the Unsplash API once per (style x palette) cell and rewrites the
 * SEED_POOL map in src/design/photoPresets.js with real, ixid-tagged,
 * photographer-credited picks.
 *
 * This script is the ONLY thing that ever needs the API key. The shipped
 * app makes zero Unsplash API calls; it hotlinks the CDN directly.
 *
 *   UNSPLASH_ACCESS_KEY=... npm run curate:photos
 *
 * Demo-tier keys are capped at 50 requests/hour. The default run needs
 * about 35 (one search per cell) — use --cells to narrow the scope while
 * iterating, and --force to ignore the cached results file.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src', 'design', 'photoPresets.js');
const CACHE = path.join(ROOT, '.unsplash-curation-cache.json');

const API = 'https://api.unsplash.com';
const PER_CELL = 3;

/**
 * Search terms per (style x palette) cell — 35 cells, one API request
 * each, which fits inside the 50/hour demo-tier cap.
 *
 * Each style contributes a `base` query (its defining mood) plus one
 * palette-shifted query so the pools genuinely differ rather than being
 * the same photos re-tinted.
 */
const STYLE_QUERIES = {
  brutalism: {
    base: ['raw concrete wall texture', 'brutalist architecture facade'],
    'midnight-cobalt': ['concrete wall night blue light', 'steel structure dusk'],
    'rose-noir': ['raw plaster dark red light', 'brutalist shadow black'],
    orchid: ['concrete violet light', 'geometric form purple'],
    citrus: ['concrete amber sunlight', 'raw wall warm gold'],
    moss: ['concrete moss green', 'weathered stone olive'],
    paper: ['plaster texture pale', 'concrete wall daylight neutral'],
  },
  gothic: {
    base: ['gothic cathedral interior', 'cathedral stained glass window'],
    'midnight-cobalt': ['cathedral night blue', 'stained glass indigo'],
    'rose-noir': ['cathedral crimson light', 'gothic arch dark red'],
    orchid: ['stained glass violet', 'cathedral purple light'],
    citrus: ['gothic arch golden hour', 'cathedral candle warm'],
    moss: ['stone cathedral green moss', 'old abbey forest'],
    paper: ['cathedral sketch engraving', 'stone arch white daylight'],
  },
  'mid-century': {
    base: ['mid century modern interior', 'retro geometric architecture'],
    'midnight-cobalt': ['mid century interior night', 'retro lamp blue hour'],
    'rose-noir': ['mid century interior terracotta', 'retro chair red wall'],
    orchid: ['mid century interior purple', 'retro lamp violet'],
    citrus: ['mid century mustard chair', 'retro interior warm orange'],
    moss: ['mid century green wall', 'retro interior olive'],
    paper: ['mid century interior daylight', 'scandinavian living room neutral'],
  },
  bohemian: {
    base: ['woven textile pattern', 'dried botanicals flat lay'],
    'midnight-cobalt': ['indigo textile pattern', 'botanical dark blue light'],
    'rose-noir': ['madder dyed textile', 'dried flowers warm red'],
    orchid: ['amethyst textile', 'orchid flower flat lay'],
    citrus: ['marigold textile pattern', 'woven basket warm gold'],
    moss: ['moss dyed wool', 'fern and eucalyptus flat lay'],
    paper: ['linen weave natural', 'pressed botanicals on paper'],
  },
  ethereal: {
    base: ['misty mountain ridge', 'soft fog landscape minimal'],
    'midnight-cobalt': ['blue hour mist', 'foggy forest blue'],
    'rose-noir': ['dawn mist pink sky', 'haze rose'],
    orchid: ['misty dawn violet', 'soft lilac fog'],
    citrus: ['golden morning mist', 'soft haze warm light'],
    moss: ['misty forest sage', 'soft green fog'],
    paper: ['pale morning fog minimal', 'bright white haze'],
  },
};

const PALETTES = Object.keys(STYLE_QUERIES.brutalism).filter((k) => k !== 'base');
const STYLES = Object.keys(STYLE_QUERIES);

const args = process.argv.slice(2);
const force = args.includes('--force');
const cellFilter = (() => {
  const i = args.indexOf('--cells');
  return i >= 0 ? args[i + 1] : null;
})();

/**
 * Node does not load .env by default, so do it here. Real process env
 * always wins, which lets you override for one run with
 * `UNSPLASH_ACCESS_KEY=... npm run curate:photos`.
 */
function loadDotEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

const dotenv = loadDotEnv(path.join(ROOT, '.env'));
const KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_KEY || dotenv.UNSPLASH_ACCESS_KEY;

function fail(message) {
  console.error(`\n  curate:photos — ${message}\n`);
  process.exit(1);
}

if (!KEY) {
  fail(
    'Missing UNSPLASH_ACCESS_KEY.\n' +
      '  Add it to a .env file (gitignored) as:\n' +
      '      UNSPLASH_ACCESS_KEY=your_access_key\n' +
      '  or pass it inline for a single run:\n' +
      '      $env:UNSPLASH_ACCESS_KEY="..."; npm run curate:photos   # PowerShell\n' +
      '  The key is read by THIS SCRIPT ONLY and is never bundled into the app.\n\n' +
      '  Unsplash  ->  developers  ->  Your apps  ->  "New Application"\n' +
      '  Use the ACCESS key, never the secret key.'
  );
}

/**
 * Search one cell. `relaxed` widens the net: `content_filter=high` plus
 * a portrait-only constraint returns zero results for some very literal
 * queries ("concrete amber sunlight"), so those fall back to the default
 * filter and any orientation before giving up.
 */
async function search(query, perPage = PER_CELL, relaxed = false) {
  const url = new URL('/search/photos', API);
  url.searchParams.set('query', relaxed ? query.split(' ').slice(0, 2).join(' ') : query);
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('content_filter', relaxed ? 'low' : 'high');
  if (!relaxed) url.searchParams.set('orientation', 'portrait');
  url.searchParams.set('order_by', 'relevant');

  // Network blips and 5xx are transient; the demo quota is precious so
  // we retry rather than aborting a 35-cell run halfway through.
  const attempts = 4;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        headers: { Authorization: `Client-ID ${KEY}`, 'Accept-Version': 'v1' },
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      lastError = err;
      const wait = 400 * 2 ** (attempt - 1);
      console.warn(`    retry ${attempt}/${attempts} after network error: ${err.message}`);
      await sleep(wait);
      continue;
    }

    if (res.ok) {
      const remaining = res.headers.get('X-Ratelimit-Remaining');
      const limit = res.headers.get('X-Ratelimit-Limit');
      const suffix = relaxed ? ' [relaxed]' : '';
      console.log(`  · "${query}"${suffix}  (${remaining}/${limit} requests left)`);
      const json = await res.json();
      return (json.results || []).map(toEntry).filter(Boolean);
    }

    if (res.status === 403 || res.status === 429) {
      fail(
        `Rate limited (HTTP ${res.status}, ${res.headers.get('X-Ratelimit-Remaining') ?? '?'} requests left).\n` +
          '  Demo keys get 50 requests/hour. Wait an hour, then re-run — the\n' +
          '  cached cells are kept, so only the missing ones cost quota.\n' +
          '  To narrow the run:  npm run curate:photos -- --cells brutalism/per-quote'
      );
    }

    if (res.status >= 500) {
      lastError = new Error(`HTTP ${res.status}`);
      const wait = 500 * 2 ** (attempt - 1);
      console.warn(`    retry ${attempt}/${attempts} after HTTP ${res.status}`);
      await sleep(wait);
      continue;
    }

    fail(`Unsplash search failed for "${query}" (HTTP ${res.status}).`);
  }

  fail(
    `Gave up on "${query}" after ${attempts} attempts (${lastError?.message || 'unknown error'}).\n` +
      '  Re-run to resume — completed cells are cached and cost no quota.'
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strict search, then one relaxed retry if it returns nothing. */
async function searchWithFallback(query, perPage = PER_CELL) {
  const strict = await search(query, perPage, false);
  if (strict.length) return strict;
  const relaxed = await search(query, perPage, true);
  return relaxed.length ? relaxed : strict;
}

function toEntry(photo) {
  const raw = photo.urls?.raw;
  if (!raw) return null;
  // `ixid` must survive every transform — it is how Unsplash attributes
  // the view back to the photographer.
  return {
    idStable: slug(photo.id),
    url: withParams(raw, { auto: 'format', fit: 'crop', w: 1080, q: 72 }),
    thumbUrl: withParams(raw, { auto: 'format', fit: 'crop', w: 320, q: 60 }),
    dominant: photo.color || '#222222',
    alt: photo.alt_description || photo.description || '',
    credit: {
      name: photo.user?.name || 'Unknown',
      username: photo.user?.username || '',
      profileUrl: photo.user?.links?.html || 'https://unsplash.com',
      photoUrl: photo.links?.html || 'https://unsplash.com',
    },
  };
}

function withParams(rawUrl, params) {
  const u = new URL(rawUrl);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  return u.toString();
}

function slug(id) {
  return String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

async function loadCache() {
  if (force || !existsSync(CACHE)) return {};
  try {
    return JSON.parse(await readFile(CACHE, 'utf8'));
  } catch {
    return {};
  }
}

async function main() {
  const cache = await loadCache();

  // One (style, palette) cell per request; `base` results seed every
  // palette of that style so the vocabulary cost stays low.
  const cells = [];
  for (const style of STYLES) {
    const queries = STYLE_QUERIES[style];
    for (const [palette, terms] of Object.entries(queries)) {
      // --cells <style>/<palette> narrows the run while iterating.
      if (cellFilter && cellFilter !== `${style}/${palette}`) continue;
      cells.push({ style, palette, query: terms[0] });
    }
  }

  console.log(`\n  Curating ${cells.length} style × palette cells × ${PER_CELL} picks\n`);

  for (const { style, palette, query } of cells) {
    const key = `${style}::${palette}::${query}`;
    // Key *presence*, not length: a query that legitimately returns zero
    // results (even after the relaxed retry) is stored as an empty array,
    // and re-fetching it on every run would silently burn the 50/hour
    // demo quota. Use --force to retry those.
    if (Object.prototype.hasOwnProperty.call(cache, key)) continue;
    cache[key] = await searchWithFallback(query);
    await mkdir(path.dirname(CACHE), { recursive: true });
    await writeFile(CACHE, JSON.stringify(cache, null, 2), 'utf8');
  }

  const rebuilt = await renderPool(cache);
  await writeFile(TARGET, rebuilt, 'utf8');
  console.log(`\n  ✓ Rewrote ${path.relative(ROOT, TARGET)}`);
  console.log(`    Cached raw responses in ${path.relative(ROOT, CACHE)}\n`);
}

/**
 * Rebuild photoPresets.js, preserving every hand-written section and only
 * replacing SEED_POOL + the CURATED flag.
 */
async function renderPool(cache) {
  const source = await readFile(TARGET, 'utf8');

  const byStyle = {};
  for (const style of STYLES) {
    const queries = STYLE_QUERIES[style];
    const byPalette = {};

    for (const palette of ['per-quote', ...PALETTES]) {
      // 'per-quote' is not a key in STYLE_QUERIES — it is served by the
      // style's `base` queries, and its cache entries are keyed under
      // `base` too. Getting this wrong silently empties every
      // per-quote cell.
      const terms = palette === 'per-quote' ? queries.base : queries[palette] || queries.base;

      const merged = [];
      for (const query of terms) {
        const found =
          cache[`${style}::${palette}::${query}`] ||
          (palette === 'per-quote' ? null : cache[`${style}::base::${query}`]) ||
          [];
        for (const entry of found) {
          if (!merged.some((m) => m.idStable === entry.idStable)) merged.push(entry);
        }
      }

      // Last resort: some very literal queries return one or zero photos
      // even after the relaxed retry. Top the cell up from the style's
      // own base pool so every cell can offer a real choice — they are
      // the same subject matter, just less colour-specific.
      if (merged.length < 2) {
        for (const query of queries.base) {
          for (const entry of cache[`${style}::base::${query}`] || []) {
            if (merged.length >= PER_CELL) break;
            if (!merged.some((m) => m.idStable === entry.idStable)) merged.push(entry);
          }
          if (merged.length >= PER_CELL) break;
        }
      }

      if (merged.length) byPalette[palette] = merged;
    }

    if (Object.keys(byPalette).length) byStyle[style] = byPalette;
  }

  const poolSource = serializePool(byStyle);

  // Test the regex rather than comparing bytes: re-running on an
  // already-curated file is a no-op, so "unchanged" does not mean
  // "marker missing".
  const flagRe = /export const CURATED = (?:true|false);/;
  if (!flagRe.test(source)) {
    fail('Could not find the `CURATED` flag in photoPresets.js — refusing to guess.');
  }
  const withFlag = source.replace(flagRe, 'export const CURATED = true;');

  const poolRe = /export const SEED_POOL = \{[\s\S]*?\n\};/;
  if (!poolRe.test(withFlag)) {
    fail('Could not locate SEED_POOL in photoPresets.js — refusing to guess.');
  }
  return withFlag.replace(poolRe, `export const SEED_POOL = ${poolSource};`);
}

function serializePool(byStyle) {
  const lines = [];
  for (const [style, byPalette] of Object.entries(byStyle)) {
    lines.push(`  ${JSON.stringify(style)}: {`);
    for (const [palette, photos] of Object.entries(byPalette)) {
      lines.push(`    ${JSON.stringify(palette)}: [`);
      for (const p of photos) {
        lines.push('      {');
        lines.push(`        idStable: ${JSON.stringify(p.idStable)},`);
        lines.push(`        url: ${JSON.stringify(p.url)},`);
        lines.push(`        thumbUrl: ${JSON.stringify(p.thumbUrl)},`);
        lines.push(`        dominant: ${JSON.stringify(p.dominant)},`);
        lines.push(`        alt: ${JSON.stringify(p.alt)},`);
        lines.push('        credit: {');
        lines.push(`          name: ${JSON.stringify(p.credit.name)},`);
        lines.push(`          username: ${JSON.stringify(p.credit.username)},`);
        lines.push(`          profileUrl: ${JSON.stringify(p.credit.profileUrl)},`);
        lines.push(`          photoUrl: ${JSON.stringify(p.credit.photoUrl)},`);
        lines.push('        },');
        lines.push('      },');
      }
      lines.push('    ],');
    }
    lines.push('  },');
  }
  return `{\n${lines.join('\n')}\n}`;
}

main().catch((err) => fail(err.stack || String(err)));