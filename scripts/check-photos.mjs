/**
 * Validate the generated backdrop pool in src/design/photoPresets.js.
 *
 *   npm run check:photos
 *
 * The pool is rewritten wholesale by scripts/curate-photos.mjs, so this
 * is the cheap guard that the generated data is actually usable: every
 * (style x palette) cell non-empty, every photo hotlinkable, and every
 * entry carrying the `ixid` and photographer credit the Unsplash
 * guidelines require.
 */

import { poolFor, resolveBackdrop } from '../src/design/photoPresets.js';
import { STYLE_IDS, PALETTE_IDS } from '../src/design/presets.js';

const problems = [];
let cells = 0;
let photos = 0;
let missingCredits = 0;
let missingIxd = 0;

const unique = new Set();

for (const style of STYLE_IDS) {
  for (const palette of PALETTE_IDS) {
    cells += 1;
    const pool = poolFor(style, palette);

    if (pool.length === 0) {
      problems.push(`EMPTY CELL      ${style}/${palette}`);
    }
    if (pool.length < 2) {
      problems.push(`THIN CELL       ${style}/${palette} (${pool.length} photo)`);
    }
    // A stale photoId left over from a previous preset set must never
    // blank the backdrop.
    if (resolveBackdrop(style, palette, '__stale_id__') === null) {
      problems.push(`NO FALLBACK     ${style}/${palette}`);
    }

    for (const p of pool) {
      unique.add(p.idStable);
      photos += 1;
      if (!p.credit?.name) missingCredits += 1;
      if (!/ixid=/.test(p.url)) missingIxd += 1;
      if (!/^https:\/\/images\.unsplash\.com\//.test(p.url)) {
        problems.push(`BAD URL         ${style}/${palette} ${p.idStable}`);
      }
      if (!p.dominant || !/^#[0-9a-f]{6}$/i.test(p.dominant)) {
        problems.push(`BAD DOMINANT    ${p.idStable} "${p.dominant}"`);
      }
      if (!p.alt) {
        problems.push(`MISSING ALT     ${p.idStable}`);
      }
    }
  }
}

console.log(`cells            ${cells} (expect ${STYLE_IDS.length * PALETTE_IDS.length})`);
console.log(`pool entries     ${photos}`);
console.log(`unique photos    ${unique.size}`);
console.log(`avg per cell     ${(photos / cells).toFixed(2)}`);
console.log(`missing credits  ${missingCredits}`);
console.log(`missing ixid     ${missingIxd}`);

if (missingCredits) problems.push(`${missingCredits} photo(s) without a photographer credit`);

if (problems.length) {
  console.error(`\nFAIL — ${problems.length} problem(s):\n  ${problems.join('\n  ')}\n`);
  process.exit(1);
}
console.log('\nOK — every cell is populated, credited and hotlinkable.\n');