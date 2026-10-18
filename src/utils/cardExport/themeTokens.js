/**
 * Theme tokens — JS mirror of the .theme-* classes in src/index.css.
 *
 * The CSS file remains the source of truth for the live preview; this
 * module is the source of truth for the SVG export renderer. They must
 * stay in sync — the SVG renderer cannot read CSS custom properties
 * from a constructed DOM fragment the way the live preview can.
 *
 * Each entry mirrors the corresponding `.theme-<slug>` block in
 * src/index.css. Adding a new quote theme requires (1) an entry in
 * src/design/quoteThemes.js, (2) a CSS class, and (3) a matching entry
 * here.
 */

import { themeSlug } from '../../design/quoteThemes';

export const THEMES = {
  'midnight-cobalt': {
    background: 'linear-gradient(185deg, #10162f 0%, #0b0d1a 50%, #04050a 100%)',
    accent: '#6f9bff',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.74)',
    chipBackground: 'rgba(111, 155, 255, 0.12)',
  },
  'ethereal-dawn': {
    background: 'linear-gradient(185deg, #2b1e42 0%, #1e1b30 50%, #0d0c15 100%)',
    accent: '#d8b4fe',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.74)',
    chipBackground: 'rgba(216, 180, 254, 0.12)',
  },
  'forest-green': {
    background: 'linear-gradient(185deg, #0b2518 0%, #07170f 50%, #030805 100%)',
    accent: '#34d399',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.74)',
    chipBackground: 'rgba(52, 211, 153, 0.12)',
  },
  'sunset-orange': {
    background: 'linear-gradient(185deg, #380e14 0%, #1d070a 50%, #0c0204 100%)',
    accent: '#fb923c',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.74)',
    chipBackground: 'rgba(251, 146, 60, 0.12)',
  },
  'sand-solid': {
    background: '#f5f2eb',
    accent: '#8a3324',
    text: '#1e201e',
    subtext: 'rgba(30, 32, 30, 0.76)',
    chipBackground: 'rgba(30, 32, 30, 0.06)',
  },
  'charcoal-solid': {
    background: '#121412',
    accent: '#ffffff',
    text: '#e2e3df',
    subtext: 'rgba(226, 227, 223, 0.74)',
    chipBackground: 'rgba(255, 255, 255, 0.05)',
  },
};

/** Slug used by the `.theme-<slug>` classes — see src/design/quoteThemes.js. */
export function slugForTheme(themeName) {
  return themeSlug(themeName);
}

export function getThemeTokens(themeName) {
  return THEMES[themeSlug(themeName)] || THEMES['charcoal-solid'];
}