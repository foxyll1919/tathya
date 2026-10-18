/**
 * Per-quote color themes.
 *
 * Each entry needs three things kept in sync:
 *   1. this list (picker UI in the add flow),
 *   2. the `.theme-<slug>` block in src/index.css (live preview),
 *   3. the matching key in src/utils/cardExport/themeTokens.js (SVG export).
 *
 * `preview` is a compact stand-in for the swatch — the real gradient lives
 * in CSS, and CSS can't be read from JS at render time here.
 */

export const QUOTE_THEMES = [
  {
    name: 'Midnight Cobalt',
    class: 'theme-midnight-cobalt',
    preview: 'linear-gradient(135deg, #10162f 0%, #04050a 100%)',
    foreground: '#ffffff',
  },
  {
    name: 'Ethereal Dawn',
    class: 'theme-ethereal-dawn',
    preview: 'linear-gradient(135deg, #2b1e42 0%, #0d0c15 100%)',
    foreground: '#ffffff',
  },
  {
    name: 'Forest Green',
    class: 'theme-forest-green',
    preview: 'linear-gradient(135deg, #0b2518 0%, #030805 100%)',
    foreground: '#ffffff',
  },
  {
    name: 'Sunset Orange',
    class: 'theme-sunset-orange',
    preview: 'linear-gradient(135deg, #380e14 0%, #0c0204 100%)',
    foreground: '#ffffff',
  },
  {
    name: 'Sand Solid',
    class: 'theme-sand-solid',
    preview: '#f5f2eb',
    foreground: '#1e201e',
  },
  {
    name: 'Charcoal Solid',
    class: 'theme-charcoal-solid',
    preview: '#121412',
    foreground: '#e2e3df',
  },
];

export const DEFAULT_QUOTE_THEME = QUOTE_THEMES[0];

export const PRESET_TAGS = ['philosophy', 'mindfulness', 'wisdom', 'life', 'science', 'art'];

export function themeSlug(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, '-');
}

export function themeClassFor(name) {
  return `theme-${themeSlug(name)}`;
}