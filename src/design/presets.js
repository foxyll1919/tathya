/**
 * Design presets — the single registry behind the Design panel.
 *
 * Two independent axes:
 *
 *   1. STYLE   (typography + shape language). Applied to the app root as
 *              `data-style`, resolved in src/design.css. Changing it swaps
 *              fonts, type scale, radii, borders and shadows app-wide.
 *   2. PALETTE (color). Applied to the app root as `data-palette`, also
 *              resolved in src/design.css. `per-quote` is a pass-through:
 *              the color then comes from the quote's own `.theme-*` class
 *              (see src/index.css) or the time-of-day theme.
 *
 * `src/design.css` is the source of truth for the token *values*; this
 * module owns the *metadata* (labels, font family names, swatches) plus
 * everything the SVG export needs, which cannot read CSS custom
 * properties. The two must stay in sync — see DESIGN NOTES in the repo.
 */

/** @typedef {'brutalism'|'gothic'|'mid-century'|'bohemian'|'ethereal'} StyleId */
/** @typedef {string} PaletteId */

export const STYLE_IDS = [
  'brutalism',
  'gothic',
  'mid-century',
  'bohemian',
  'ethereal',
];

export const STYLES = {
  brutalism: {
    id: 'brutalism',
    name: 'Brutalism',
    tagline: 'Raw, stark, honest. Hard edges and monospaced type.',
    hint: 'Square everything. Uppercase labels. No blur.',
    specimen: 'Aa',
    // Family names are used for the live preview and for the SVG export.
    quoteFamily: 'Space Mono',
    attributionFamily: 'Space Mono',
    labelFamily: 'Space Mono',
    scriptFamily: null,
    // Faces the SVG renderer must embed + pre-load.
    exportFonts: [
      { family: 'Space Mono', weight: '400' },
      { family: 'Space Mono', weight: '700' },
    ],
    export: {
      quoteWeightShort: 700,
      quoteWeightLong: 400,
      quoteTracking: '-0.03em',
      quoteLeading: 1.32,
      attributionWeight: 700,
      attributionTracking: '0.18em',
      attributionTransform: 'uppercase',
    },
  },
  gothic: {
    id: 'gothic',
    name: 'Gothic',
    tagline: 'Medieval romance. Blackletter display, engraved small caps.',
    hint: 'Deep violets. Thin rules. Let the ornament lead.',
    specimen: 'Aa',
    quoteFamily: 'UnifrakturMaguntia',
    attributionFamily: 'Cinzel',
    labelFamily: 'Cinzel',
    scriptFamily: null,
    exportFonts: [
      { family: 'UnifrakturMaguntia', weight: '400' },
      { family: 'Cinzel', weight: '400' },
      { family: 'Cinzel', weight: '600' },
    ],
    export: {
      quoteWeightShort: 400,
      quoteWeightLong: 400,
      quoteTracking: '0.01em',
      quoteLeading: 1.4,
      attributionWeight: 600,
      attributionTracking: '0.2em',
      attributionTransform: 'uppercase',
    },
  },
  'mid-century': {
    id: 'mid-century',
    name: 'Mid-Century',
    tagline: 'Optimistic modernism. Geometric sans, wide-tracked labels.',
    hint: 'Warm mid-century color. Pill buttons, flat blocks.',
    specimen: 'Aa',
    quoteFamily: 'Jost',
    attributionFamily: 'Jost',
    labelFamily: 'Space Grotesk',
    scriptFamily: null,
    exportFonts: [
      { family: 'Jost', weight: '400' },
      { family: 'Jost', weight: '600' },
    ],
    export: {
      quoteWeightShort: 600,
      quoteWeightLong: 400,
      quoteTracking: '-0.01em',
      quoteLeading: 1.28,
      attributionWeight: 500,
      attributionTracking: '0.22em',
      attributionTransform: 'uppercase',
    },
  },
  bohemian: {
    id: 'bohemian',
    name: 'Bohemian',
    tagline: 'Handmade and layered. Organic shapes, script asides.',
    hint: 'Jewelled tones. Asymmetric radii, generous leading.',
    specimen: 'Aa',
    quoteFamily: 'Marcellus',
    attributionFamily: 'Manrope',
    labelFamily: 'Manrope',
    scriptFamily: 'Caveat',
    exportFonts: [
      { family: 'Marcellus', weight: '400' },
      { family: 'Manrope', weight: '500' },
      { family: 'Caveat', weight: '600' },
    ],
    export: {
      quoteWeightShort: 400,
      quoteWeightLong: 400,
      quoteTracking: '0.005em',
      quoteLeading: 1.42,
      attributionWeight: 500,
      attributionTracking: '0.06em',
      attributionTransform: 'none',
    },
  },
  ethereal: {
    id: 'ethereal',
    name: 'Ethereal',
    tagline: 'Weightless and mist-lit. Minimal serif, feathered shadow.',
    hint: 'Pastel air. Sentence case. Very large radii.',
    specimen: 'Aa',
    quoteFamily: 'Cormorant Garamond',
    attributionFamily: 'Manrope',
    labelFamily: 'Space Grotesk',
    scriptFamily: null,
    exportFonts: [
      { family: 'Cormorant Garamond', weight: '300' },
      { family: 'Cormorant Garamond', weight: '500' },
      { family: 'Manrope', weight: '500' },
    ],
    export: {
      quoteWeightShort: 500,
      quoteWeightLong: 400,
      quoteTracking: '0.004em',
      quoteLeading: 1.34,
      attributionWeight: 600,
      attributionTracking: '0.08em',
      attributionTransform: 'none',
    },
  },
};

/**
 * `per-quote` intentionally has no CSS token block: it defers to the
 * quote's own theme (`.theme-*`) or the time-of-day theme.
 */
export const PALETTES = {
  'per-quote': {
    id: 'per-quote',
    name: 'Per Quote',
    tagline: 'Let each card pick its own color.',
    swatches: ['#10162f', '#0b2518', '#f5f2eb'],
    live: true,
  },
  'midnight-cobalt': {
    accent: '#6f9bff',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.74)',
    id: 'midnight-cobalt',
    name: 'Midnight Cobalt',
    tagline: 'Deep indigo, electric blue accent.',
    swatches: ['#04050a', '#10162f', '#7aa2ff'],
  },
  'rose-noir': {
    accent: '#ff5d73',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.74)',
    id: 'rose-noir',
    name: 'Rose Noir',
    tagline: 'Ink black with a crimson pulse.',
    swatches: ['#050203', '#1a0b10', '#ff5d73'],
  },
  orchid: {
    accent: '#c9a6ff',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.74)',
    id: 'orchid',
    name: 'Orchid',
    tagline: 'Violet dusk, lilac highlight.',
    swatches: ['#080512', '#241542', '#c9a6ff'],
  },
  citrus: {
    accent: '#ffc247',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.74)',
    id: 'citrus',
    name: 'Citrus',
    tagline: 'Deep pine with warm amber.',
    swatches: ['#040b08', '#123024', '#ffc247'],
  },
  moss: {
    accent: '#b6e36a',
    text: '#ffffff',
    subtext: 'rgba(255,255,255,0.74)',
    id: 'moss',
    name: 'Moss',
    tagline: 'Olive shade, acid-green light.',
    swatches: ['#060805', '#1a2113', '#b6e36a'],
  },
  paper: {
    accent: '#8a3324',
    text: '#1b1a16',
    subtext: 'rgba(27,26,22,0.78)',
    id: 'paper',
    name: 'Paper',
    tagline: 'Warm parchment with terracotta ink.',
    swatches: ['#f7f4ec', '#efe9dc', '#8a3324'],
    light: true,
  },
};

export const PALETTE_IDS = Object.keys(PALETTES);

export const DEFAULT_DESIGN = {
  style: 'ethereal',
  palette: 'per-quote',
  photoMode: 'off',
  photoId: null,
};

export const STORAGE_KEY = 'tathya_design';

export function isStyleId(value) {
  return Object.prototype.hasOwnProperty.call(STYLES, value);
}

export function isPaletteId(value) {
  return Object.prototype.hasOwnProperty.call(PALETTES, value);
}

export function getStyle(id) {
  return STYLES[isStyleId(id) ? id : DEFAULT_DESIGN.style];
}

export function getPalette(id) {
  return PALETTES[isPaletteId(id) ? id : DEFAULT_DESIGN.palette];
}

export function normalizeDesign(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    style: isStyleId(source.style) ? source.style : DEFAULT_DESIGN.style,
    palette: isPaletteId(source.palette) ? source.palette : DEFAULT_DESIGN.palette,
    photoMode: source.photoMode === 'on' ? 'on' : 'off',
    photoId: typeof source.photoId === 'string' && source.photoId ? source.photoId : null,
  };
}