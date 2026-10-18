/**
 * Resolve the colours the exported card should actually paint with.
 *
 * In the live app this is the CSS cascade: the quote's `.theme-*` class
 * supplies text colours, and `.app-container[data-palette='x']` (higher
 * specificity) overrides them. The SVG renderer reads neither, so the
 * same decision is made explicitly here and passed down.
 *
 * Getting this wrong is not subtle: with the `paper` palette the scrim
 * goes light while a dark quote theme would still say `text: #ffffff`,
 * producing white text on a pale background.
 */

import { PALETTES, getPalette } from '../../design/presets';
import { getThemeTokens } from './themeTokens';

/** Text colour used whenever the effective surface is light. */
const LIGHT_TEXT = '#1e201e';
const LIGHT_SUBTEXT = 'rgba(30, 32, 30, 0.78)';
const LIGHT_ACCENT = '#8a3324';

/**
 * @param {object} opts
 * @param {string} opts.palette    active palette id
 * @param {string} opts.quoteTheme the quote's saved theme name
 * @param {'light'|'dark'} opts.tone  resolved surface tone (photoPresets.surfaceTone)
 * @returns {{text:string, subtext:string, accent:string, chipBackground:string}}
 */
export function effectiveCardColors({ palette, quoteTheme, tone }) {
  const base = getThemeTokens(quoteTheme);
  const override = getPalette(palette);

  // An explicit palette always wins — it already declares its own text.
  if (palette !== 'per-quote' && override.accent) {
    return {
      text: override.text || LIGHT_TEXT,
      subtext: override.subtext || LIGHT_SUBTEXT,
      accent: override.accent,
      chipBackground: base.chipBackground,
    };
  }

  // per-quote defers to the quote's theme, but a light surface (sand
  // card, or dawn/day time-of-day on the charcoal theme) needs dark text
  // even when the stored theme says otherwise.
  if (tone === 'light') {
    return {
      text: LIGHT_TEXT,
      subtext: LIGHT_SUBTEXT,
      accent: LIGHT_ACCENT,
      chipBackground: base.chipBackground,
    };
  }

  return {
    text: base.text,
    subtext: base.subtext,
    accent: override.accent || base.accent,
    chipBackground: base.chipBackground,
  };
}

/** True when the resolved text colour is dark (i.e. the surface is light). */
export function isDarkText(colors) {
  const hex = String(colors.text).replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

export { PALETTES };