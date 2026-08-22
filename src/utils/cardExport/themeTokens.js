/**
 * Theme tokens — JS mirror of the .theme-* classes in src/index.css.
 *
 * The CSS file remains the source of truth for the live preview; this
 * module is the source of truth for the SVG export renderer. They must
 * stay in sync — the SVG renderer cannot read CSS custom properties
 * from a constructed DOM fragment the way the live preview can.
 *
 * Each entry mirrors the corresponding `.theme-<slug>` block in
 * src/index.css. Adding a new quote theme requires (1) a CSS class and
 * (2) a matching entry here.
 */

export const THEMES = {
  'midnight-cobalt': {
    background: 'linear-gradient(185deg, #10162f 0%, #0b0d1a 50%, #04050a 100%)',
    accent: '#3b82f6',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.7)',
    chipBackground: 'rgba(59, 130, 246, 0.1)',
  },
  'ethereal-dawn': {
    background: 'linear-gradient(185deg, #2b1e42 0%, #1e1b30 50%, #0d0c15 100%)',
    accent: '#d8b4fe',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.7)',
    chipBackground: 'rgba(216, 180, 254, 0.1)',
  },
  'forest-green': {
    background: 'linear-gradient(185deg, #0b2518 0%, #07170f 50%, #030805 100%)',
    accent: '#34d399',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.7)',
    chipBackground: 'rgba(52, 211, 153, 0.1)',
  },
  'sunset-orange': {
    background: 'linear-gradient(185deg, #380e14 0%, #1d070a 50%, #0c0204 100%)',
    accent: '#fb923c',
    text: '#ffffff',
    subtext: 'rgba(255, 255, 255, 0.7)',
    chipBackground: 'rgba(251, 146, 60, 0.1)',
  },
  'sand-solid': {
    background: '#f5f2eb',
    accent: '#2f312e',
    text: '#1e201e',
    subtext: 'rgba(30, 32, 30, 0.7)',
    chipBackground: 'rgba(30, 32, 30, 0.05)',
  },
  'charcoal-solid': {
    background: '#121412',
    accent: '#ffffff',
    text: '#e2e3df',
    subtext: 'rgba(226, 227, 223, 0.7)',
    chipBackground: 'rgba(255, 255, 255, 0.05)',
  },
};

/** Slug used by App.jsx: `theme-${theme.toLowerCase().replace(/\s+/g, '-')}`. */
export function slugForTheme(themeName) {
  return String(themeName || '').toLowerCase().replace(/\s+/g, '-');
}

export function getThemeTokens(themeName) {
  const slug = slugForTheme(themeName);
  return THEMES[slug] || THEMES['charcoal-solid'];
}
