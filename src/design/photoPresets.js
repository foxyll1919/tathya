/**
 * Curated photo backdrops.
 *
 * Two independent inputs:
 *   - STYLE  -> how the photo is treated (filter, opacity, grain, crop scale)
 *   - PALETTE-> what colour it is tinted toward (multiply/screen + scrim)
 *
 * The pair selects a pool from `PHOTO_POOL`. The pool is *authored*, not
 * searched at runtime: `npm run curate:photos` queries Unsplash once per
 * (style x palette) cell and rewrites `SEED_POOL` below with real,
 * ixid-tagged, credited picks. The shipped app then makes ZERO API calls —
 * it hotlinks Unsplash's CDN directly.
 *
 * Both this file AND the `--photo-*` block in src/design.css must stay in
 * sync; the canvas export bake cannot read CSS custom properties.
 */

/**
 * Per-style treatment. Mirrored by [data-style] blocks in src/design.css.
 * `scale` is the cover-crop zoom (1 = native cover, >1 crops tighter).
 */
export const PHOTO_TREATMENTS = {
  brutalism: {
    opacity: 0.92,
    blur: 0,
    saturate: 0.12,
    contrast: 1.45,
    brightness: 0.85,
    grain: 0.07,
    scale: 1.04,
    focal: 'center',
  },
  gothic: {
    opacity: 0.74,
    blur: 0,
    saturate: 0.55,
    contrast: 1.2,
    brightness: 0.98,
    grain: 0.05,
    scale: 1.06,
    focal: 'center',
  },
  'mid-century': {
    opacity: 0.78,
    blur: 0,
    saturate: 1.15,
    contrast: 1.12,
    brightness: 0.92,
    grain: 0,
    scale: 1.02,
    focal: 'center',
  },
  bohemian: {
    opacity: 0.66,
    blur: 0.4,
    saturate: 0.92,
    contrast: 1.02,
    brightness: 0.86,
    grain: 0.11,
    scale: 1.03,
    focal: 'center',
  },
  ethereal: {
    opacity: 0.46,
    blur: 2,
    saturate: 0.85,
    contrast: 0.96,
    brightness: 1.02,
    grain: 0.04,
    scale: 1.08,
    focal: 'center',
  },
};

/**
 * Per-palette tint + scrim. `tintBlend` picks how the palette color is
 * composited over the photo; the scrim gradient is what guarantees the
 * 4.5:1 text contrast on top of it.
 *
 * Mirrors, in src/design.css:
 *   - the [data-palette='…'] photo blocks
 *   - the [data-theme='…'] blocks in styles/theme.css (light/dark)
 *   - the .theme-sand-solid block in src/index.css
 *
 *   { tint, tintBlend, scrimFrom, scrimTo }
 */
export const PHOTO_TINTS = {
  // Named palettes.
  'midnight-cobalt': {
    tint: '#0b1024',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(6, 9, 20, 0.44)',
    scrimTo: 'rgba(4, 6, 14, 0.78)',
  },
  'rose-noir': {
    tint: '#150609',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(16, 6, 9, 0.44)',
    scrimTo: 'rgba(6, 2, 3, 0.78)',
  },
  orchid: {
    tint: '#1a0b2c',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(16, 8, 28, 0.44)',
    scrimTo: 'rgba(8, 5, 18, 0.78)',
  },
  citrus: {
    tint: '#0a2118',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(8, 24, 18, 0.44)',
    scrimTo: 'rgba(4, 11, 8, 0.78)',
  },
  moss: {
    tint: '#121a08',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(14, 20, 8, 0.44)',
    scrimTo: 'rgba(6, 8, 5, 0.78)',
  },
  paper: {
    tint: '#efe7d6',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(250, 247, 240, 0.45)',
    scrimTo: 'rgba(243, 238, 226, 0.82)',
  },

  // Fallbacks used when the palette is 'per-quote' and the surface tone
  // has to be resolved from the quote theme / time of day instead.
  dark: {
    tint: '#080b18',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(8, 11, 24, 0.42)',
    scrimTo: 'rgba(4, 6, 14, 0.78)',
  },
  light: {
    tint: '#f2ecdd',
    tintBlend: 'multiply',
    scrimFrom: 'rgba(253, 251, 245, 0.45)',
    scrimTo: 'rgba(245, 240, 228, 0.82)',
  },
};

/** Quote themes whose card surface is light. */
export const LIGHT_SURFACE_THEMES = ['sand-solid'];

/** Time-of-day themes whose surface is light. */
export const LIGHT_TIME_THEMES = ['dawn', 'day'];

/**
 * Resolve whether the effective card surface is light or dark.
 *
 * The CSS cascade does this implicitly; the canvas export bake cannot
 * read custom properties, so the same decision is mirrored here. Keep in
 * step with the [data-palette] / [data-theme] / .theme-* blocks.
 *
 * @param {object} opts
 * @param {string} opts.palette     active palette id
 * @param {string} opts.quoteTheme  slug of the active quote theme
 * @param {string} opts.timeTheme   dawn | day | dusk | night
 * @returns {'light'|'dark'}
 */
export function surfaceTone({ palette, quoteTheme, timeTheme }) {
  if (palette === 'paper') return 'light';
  if (palette !== 'per-quote') return 'dark';
  if (LIGHT_SURFACE_THEMES.includes(quoteTheme)) return 'light';
  if (LIGHT_TIME_THEMES.includes(timeTheme)) return 'light';
  return 'dark';
}

/**
 * A single backdrop.
 *
 * @typedef {object} BackdropPhoto
 * @property {string}  idStable      stable slug, e.g. 'forest-rays'
 * @property {string}  url           full-size CDN url (must retain ixid)
 * @property {string}  thumbUrl      small CDN url for pickers
 * @property {string}  dominant      representative hex, used as the
 *                                   placeholder before decode
 * @property {string}  alt           decorative alt text
 * @property {{name:string, username:string, profileUrl:string,
 *            photoUrl:string}} credit  required by the Unsplash guidelines
 *                                   and always populated in a curated pool.
 */

/**
 * Curated pool — generated by `npm run curate:photos`. DO NOT HAND-EDIT:
 * the script regex-replaces this block wholesale, and everything below
 * this point depends on its exact shape.
 *
 * Before curation runs this block holds temporary placeholders and
 * `CURATED` is false.
 */
export const SEED_POOL = {
  "brutalism": {
    "per-quote": [
      {
        idStable: "nnncv-bwfga",
        url: "https://images.unsplash.com/photo-1584184200374-73d7f6c6a175?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1584184200374-73d7f6c6a175?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#737373",
        alt: "gray and brown concrete wall",
        credit: {
          name: "Valentin Salja",
          username: "valentinsalja",
          profileUrl: "https://unsplash.com/@valentinsalja",
          photoUrl: "https://unsplash.com/photos/gray-and-brown-concrete-wall-nNNcV_BwFGA",
        },
      },
      {
        idStable: "qd2vhkftvjs",
        url: "https://images.unsplash.com/photo-1717851425482-bdb309381a84?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1717851425482-bdb309381a84?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "A weathered grey concrete wall with patches of lighter plaster texture",
        credit: {
          name: "Mike Hindle",
          username: "mikehindle",
          profileUrl: "https://unsplash.com/@mikehindle",
          photoUrl: "https://unsplash.com/photos/weathered-grey-concrete-wall-texture-qD2VHKftvjs",
        },
      },
      {
        idStable: "ol2tyvcapi4",
        url: "https://images.unsplash.com/photo-1708894462826-ba3fa93b41b7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1708894462826-ba3fa93b41b7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "A smooth grey concrete wall with subtle trowel marks and natural texture",
        credit: {
          name: "Hydra 4x",
          username: "hydra4x",
          profileUrl: "https://unsplash.com/@hydra4x",
          photoUrl: "https://unsplash.com/photos/grey-concrete-wall-with-texture-OL2tYVcApI4",
        },
      },
    ],
    "midnight-cobalt": [
      {
        idStable: "tzsd-ukziq4",
        url: "https://images.unsplash.com/photo-1559965317-a430324b6780?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjB3YWxsJTIwbmlnaHQlMjBibHVlJTIwbGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU0N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1559965317-a430324b6780?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjB3YWxsJTIwbmlnaHQlMjBibHVlJTIwbGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU0N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#404040",
        alt: "white painted room with light",
        credit: {
          name: "H&CO",
          username: "hngstrm",
          profileUrl: "https://unsplash.com/@hngstrm",
          photoUrl: "https://unsplash.com/photos/white-painted-room-with-light-TZSD-ukZiQ4",
        },
      },
      {
        idStable: "osi3nk-lzp0",
        url: "https://images.unsplash.com/photo-1765970948881-39b75581ce6b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y29uY3JldGUlMjB3YWxsJTIwbmlnaHQlMjBibHVlJTIwbGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU0N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1765970948881-39b75581ce6b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y29uY3JldGUlMjB3YWxsJTIwbmlnaHQlMjBibHVlJTIwbGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU0N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "A single light illuminates a dark, foggy night",
        credit: {
          name: "Maksim Samuilionak",
          username: "maksim_taawy",
          profileUrl: "https://unsplash.com/@maksim_taawy",
          photoUrl: "https://unsplash.com/photos/a-single-light-illuminates-a-dark-foggy-night-Osi3NK-lZP0",
        },
      },
      {
        idStable: "8gz1nwdnqxc",
        url: "https://images.unsplash.com/photo-1767081125218-4f71da1a3213?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y29uY3JldGUlMjB3YWxsJTIwbmlnaHQlMjBibHVlJTIwbGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU0N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1767081125218-4f71da1a3213?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y29uY3JldGUlMjB3YWxsJTIwbmlnaHQlMjBibHVlJTIwbGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU0N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "Brick building with ladder against modern city buildings",
        credit: {
          name: "Juan Pablo",
          username: "who0ne",
          profileUrl: "https://unsplash.com/@who0ne",
          photoUrl: "https://unsplash.com/photos/brick-building-with-ladder-against-modern-city-buildings-8Gz1NWDNqXc",
        },
      },
    ],
    "rose-noir": [
      {
        idStable: "-dedvayl7zm",
        url: "https://images.unsplash.com/photo-1644082279615-c6da078be0dc?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cmF3JTIwcGxhc3RlciUyMGRhcmslMjByZWQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1644082279615-c6da078be0dc?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cmF3JTIwcGxhc3RlciUyMGRhcmslMjByZWQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "a black and white photo of a red light",
        credit: {
          name: "Klara Kulikova",
          username: "kkalerry",
          profileUrl: "https://unsplash.com/@kkalerry",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-photo-of-a-red-light-_dEDVAYL7zM",
        },
      },
      {
        idStable: "5mgxnaxviqw",
        url: "https://images.unsplash.com/photo-1658713981148-8b2fe5e49c6d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cmF3JTIwcGxhc3RlciUyMGRhcmslMjByZWQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1658713981148-8b2fe5e49c6d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cmF3JTIwcGxhc3RlciUyMGRhcmslMjByZWQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "a red light in a dark room",
        credit: {
          name: "Krzysztof Hepner",
          username: "nsx_2000",
          profileUrl: "https://unsplash.com/@nsx_2000",
          photoUrl: "https://unsplash.com/photos/a-red-light-in-a-dark-room-5mGXNaxVIQw",
        },
      },
      {
        idStable: "qiqkzyhklpa",
        url: "https://images.unsplash.com/photo-1618865065914-517fb653e53f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cmF3JTIwcGxhc3RlciUyMGRhcmslMjByZWQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1618865065914-517fb653e53f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cmF3JTIwcGxhc3RlciUyMGRhcmslMjByZWQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "brown and black abstract painting",
        credit: {
          name: "Mourad Saadi",
          username: "mougrapher",
          profileUrl: "https://unsplash.com/@mougrapher",
          photoUrl: "https://unsplash.com/photos/brown-and-black-abstract-painting-qiQKzYHkLpA",
        },
      },
    ],
    "orchid": [
      {
        idStable: "nr1fzvr2jqy",
        url: "https://images.unsplash.com/photo-1526420684095-2c3224b6114e?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjB2aW9sZXQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1526420684095-2c3224b6114e?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjB2aW9sZXQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#404040",
        alt: "purple street lamp on black wall bricks",
        credit: {
          name: "Serhat Beyazkaya",
          username: "serhatbeyazkaya",
          profileUrl: "https://unsplash.com/@serhatbeyazkaya",
          photoUrl: "https://unsplash.com/photos/purple-street-lamp-on-black-wall-bricks-nR1fzVR2JqY",
        },
      },
      {
        idStable: "c5lwdem2fqa",
        url: "https://images.unsplash.com/photo-1636648083947-517b157050ab?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y29uY3JldGUlMjB2aW9sZXQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1636648083947-517b157050ab?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y29uY3JldGUlMjB2aW9sZXQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c8c8c",
        alt: "a gray background with a black and white design",
        credit: {
          name: "Tim Mossholder",
          username: "timmossholder",
          profileUrl: "https://unsplash.com/@timmossholder",
          photoUrl: "https://unsplash.com/photos/a-gray-background-with-a-black-and-white-design-C5lWDEm2fQA",
        },
      },
      {
        idStable: "i3ybkhyjrlc",
        url: "https://images.unsplash.com/photo-1661254454741-94b4f0e6ebbb?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y29uY3JldGUlMjB2aW9sZXQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1661254454741-94b4f0e6ebbb?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y29uY3JldGUlMjB2aW9sZXQlMjBsaWdodHxlbnwxfDF8fHwxNzkyMzI2NTQ4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c59a6",
        alt: "a lit up candle",
        credit: {
          name: "Soren H",
          username: "hosoren",
          profileUrl: "https://unsplash.com/@hosoren",
          photoUrl: "https://unsplash.com/photos/a-lit-up-candle-i3YbkHyJRLc",
        },
      },
    ],
    "citrus": [
      {
        idStable: "vh-cbdrz1bk",
        url: "https://images.unsplash.com/photo-1776520928160-121433319c50?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjBhbWJlcnxlbnwwfHx8fDE3OTIzMjc4MDV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1776520928160-121433319c50?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjBhbWJlcnxlbnwwfHx8fDE3OTIzMjc4MDV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#735926",
        alt: "Cafe tables and chairs by the window",
        credit: {
          name: "Kyle Yen",
          username: "yenkyle",
          profileUrl: "https://unsplash.com/@yenkyle",
          photoUrl: "https://unsplash.com/photos/cafe-tables-and-chairs-by-the-window-vh_cBdRZ1Bk",
        },
      },
      {
        idStable: "nnncv-bwfga",
        url: "https://images.unsplash.com/photo-1584184200374-73d7f6c6a175?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1584184200374-73d7f6c6a175?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#737373",
        alt: "gray and brown concrete wall",
        credit: {
          name: "Valentin Salja",
          username: "valentinsalja",
          profileUrl: "https://unsplash.com/@valentinsalja",
          photoUrl: "https://unsplash.com/photos/gray-and-brown-concrete-wall-nNNcV_BwFGA",
        },
      },
      {
        idStable: "qd2vhkftvjs",
        url: "https://images.unsplash.com/photo-1717851425482-bdb309381a84?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1717851425482-bdb309381a84?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cmF3JTIwY29uY3JldGUlMjB3YWxsJTIwdGV4dHVyZXxlbnwxfDF8fHwxNzkyMzI2MTgxfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "A weathered grey concrete wall with patches of lighter plaster texture",
        credit: {
          name: "Mike Hindle",
          username: "mikehindle",
          profileUrl: "https://unsplash.com/@mikehindle",
          photoUrl: "https://unsplash.com/photos/weathered-grey-concrete-wall-texture-qD2VHKftvjs",
        },
      },
    ],
    "moss": [
      {
        idStable: "a7wmjtxtazk",
        url: "https://images.unsplash.com/photo-1756027572587-41063bd35364?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjBtb3NzJTIwZ3JlZW58ZW58MXwxfHx8MTc5MjMyNjU0OXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1756027572587-41063bd35364?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y29uY3JldGUlMjBtb3NzJTIwZ3JlZW58ZW58MXwxfHx8MTc5MjMyNjU0OXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c8c8c",
        alt: "Close-up of weathered concrete blocks with moss",
        credit: {
          name: "Oleg Saprykin",
          username: "ol0820",
          profileUrl: "https://unsplash.com/@ol0820",
          photoUrl: "https://unsplash.com/photos/close-up-of-weathered-concrete-blocks-with-moss-a7WmjTxTAZk",
        },
      },
      {
        idStable: "cjznjmsxct8",
        url: "https://images.unsplash.com/photo-1742037140902-307324956306?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y29uY3JldGUlMjBtb3NzJTIwZ3JlZW58ZW58MXwxfHx8MTc5MjMyNjU0OXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1742037140902-307324956306?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y29uY3JldGUlMjBtb3NzJTIwZ3JlZW58ZW58MXwxfHx8MTc5MjMyNjU0OXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c8c8c",
        alt: "Cracks in concrete are overgrown with moss",
        credit: {
          name: "Zoshua Colah",
          username: "zoshuacolah",
          profileUrl: "https://unsplash.com/@zoshuacolah",
          photoUrl: "https://unsplash.com/photos/cracks-in-concrete-are-overgrown-with-moss-CjZnjMsXCT8",
        },
      },
      {
        idStable: "zxkjgmhi1um",
        url: "https://images.unsplash.com/photo-1777803111880-d479ff844716?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y29uY3JldGUlMjBtb3NzJTIwZ3JlZW58ZW58MXwxfHx8MTc5MjMyNjU0OXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1777803111880-d479ff844716?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y29uY3JldGUlMjBtb3NzJTIwZ3JlZW58ZW58MXwxfHx8MTc5MjMyNjU0OXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a68c8c",
        alt: "Small blue flowers grow on a textured concrete wall",
        credit: {
          name: "Sergej *****",
          username: "skstrannik",
          profileUrl: "https://unsplash.com/@skstrannik",
          photoUrl: "https://unsplash.com/photos/small-blue-flowers-grow-on-a-textured-concrete-wall-ZXKjGmhI1uM",
        },
      },
    ],
    "paper": [
      {
        idStable: "kcskww77ovw",
        url: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cGxhc3RlciUyMHRleHR1cmUlMjBwYWxlfGVufDF8MXx8fDE3OTIzMjY1NTB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cGxhc3RlciUyMHRleHR1cmUlMjBwYWxlfGVufDF8MXx8fDE3OTIzMjY1NTB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "white textured plaster wall surface",
        credit: {
          name: "NordWood Themes",
          username: "nordwood",
          profileUrl: "https://unsplash.com/@nordwood",
          photoUrl: "https://unsplash.com/photos/white-textured-plaster-wall-surface-KcsKWw77Ovw",
        },
      },
      {
        idStable: "ol2tyvcapi4",
        url: "https://images.unsplash.com/photo-1708894462826-ba3fa93b41b7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cGxhc3RlciUyMHRleHR1cmUlMjBwYWxlfGVufDF8MXx8fDE3OTIzMjY1NTB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1708894462826-ba3fa93b41b7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cGxhc3RlciUyMHRleHR1cmUlMjBwYWxlfGVufDF8MXx8fDE3OTIzMjY1NTB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "A smooth grey concrete wall with subtle trowel marks and natural texture",
        credit: {
          name: "Hydra 4x",
          username: "hydra4x",
          profileUrl: "https://unsplash.com/@hydra4x",
          photoUrl: "https://unsplash.com/photos/grey-concrete-wall-with-texture-OL2tYVcApI4",
        },
      },
      {
        idStable: "ccmcuaox1jk",
        url: "https://images.unsplash.com/photo-1604233193955-0785a88e4d9c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cGxhc3RlciUyMHRleHR1cmUlMjBwYWxlfGVufDF8MXx8fDE3OTIzMjY1NTB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1604233193955-0785a88e4d9c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cGxhc3RlciUyMHRleHR1cmUlMjBwYWxlfGVufDF8MXx8fDE3OTIzMjY1NTB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a6a6c0",
        alt: "A textured surface with mottled grey and white plaster finish",
        credit: {
          name: "Josep Martins",
          username: "josepmartins",
          profileUrl: "https://unsplash.com/@josepmartins",
          photoUrl: "https://unsplash.com/photos/mottled-grey-and-white-plaster-texture-CcMcuaOX1Jk",
        },
      },
    ],
  },
  "gothic": {
    "per-quote": [
      {
        idStable: "wluwevkjn70",
        url: "https://images.unsplash.com/photo-1619904253375-23310eaf449b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Z290aGljJTIwY2F0aGVkcmFsJTIwaW50ZXJpb3J8ZW58MXwxfHx8MTc5MjMyNjU1MHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1619904253375-23310eaf449b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Z290aGljJTIwY2F0aGVkcmFsJTIwaW50ZXJpb3J8ZW58MXwxfHx8MTc5MjMyNjU1MHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "people walking inside a building",
        credit: {
          name: "Jonas Jaeken",
          username: "jonasjaekenmedia",
          profileUrl: "https://unsplash.com/@jonasjaekenmedia",
          photoUrl: "https://unsplash.com/photos/people-walking-inside-a-building-wLuWEvkjN70",
        },
      },
      {
        idStable: "ihk7s6xll30",
        url: "https://images.unsplash.com/photo-1619904252549-88d890e7455b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Z290aGljJTIwY2F0aGVkcmFsJTIwaW50ZXJpb3J8ZW58MXwxfHx8MTc5MjMyNjU1MHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1619904252549-88d890e7455b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Z290aGljJTIwY2F0aGVkcmFsJTIwaW50ZXJpb3J8ZW58MXwxfHx8MTc5MjMyNjU1MHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "grayscale photo of concrete building",
        credit: {
          name: "Jonas Jaeken",
          username: "jonasjaekenmedia",
          profileUrl: "https://unsplash.com/@jonasjaekenmedia",
          photoUrl: "https://unsplash.com/photos/grayscale-photo-of-concrete-building-Ihk7s6xlL30",
        },
      },
      {
        idStable: "r6kf-v2i4ve",
        url: "https://images.unsplash.com/photo-1691865171610-592928762395?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Z290aGljJTIwY2F0aGVkcmFsJTIwaW50ZXJpb3J8ZW58MXwxfHx8MTc5MjMyNjU1MHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1691865171610-592928762395?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Z290aGljJTIwY2F0aGVkcmFsJTIwaW50ZXJpb3J8ZW58MXwxfHx8MTc5MjMyNjU1MHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a black and white photo of a cathedral",
        credit: {
          name: "Mark Rolfe",
          username: "zorki4",
          profileUrl: "https://unsplash.com/@zorki4",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-photo-of-a-cathedral-r6kF-v2i4VE",
        },
      },
    ],
    "midnight-cobalt": [
      {
        idStable: "6rxe1gt8mwu",
        url: "https://images.unsplash.com/photo-1578276445422-adc473a1cd82?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y2F0aGVkcmFsJTIwbmlnaHQlMjBibHVlfGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1578276445422-adc473a1cd82?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y2F0aGVkcmFsJTIwbmlnaHQlMjBibHVlfGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a large cathedral with stained glass windows and a clock",
        credit: {
          name: "Brian Erickson",
          username: "itsbrianerickson",
          profileUrl: "https://unsplash.com/@itsbrianerickson",
          photoUrl: "https://unsplash.com/photos/a-large-cathedral-with-stained-glass-windows-and-a-clock-6RXe1Gt8mwU",
        },
      },
      {
        idStable: "sq5b1nuoytg",
        url: "https://images.unsplash.com/photo-1520401473734-95130495f5ff?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y2F0aGVkcmFsJTIwbmlnaHQlMjBibHVlfGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1520401473734-95130495f5ff?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y2F0aGVkcmFsJTIwbmlnaHQlMjBibHVlfGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#0c2640",
        alt: "brown concrete church at nighttime",
        credit: {
          name: "matthew Feeney",
          username: "matt__feeney",
          profileUrl: "https://unsplash.com/@matt__feeney",
          photoUrl: "https://unsplash.com/photos/brown-concrete-church-at-nighttime-Sq5B1nUoytg",
        },
      },
      {
        idStable: "fjoylwerj4w",
        url: "https://images.unsplash.com/photo-1775766272686-c4c05ed003b8?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y2F0aGVkcmFsJTIwbmlnaHQlMjBibHVlfGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1775766272686-c4c05ed003b8?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y2F0aGVkcmFsJTIwbmlnaHQlMjBibHVlfGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "St. paul's cathedral illuminated at night with moody lighting",
        credit: {
          name: "Ahmet Kahveci",
          username: "kahveci",
          profileUrl: "https://unsplash.com/@kahveci",
          photoUrl: "https://unsplash.com/photos/st-pauls-cathedral-illuminated-at-night-with-moody-lighting-fJoYlWeRJ4w",
        },
      },
    ],
    "rose-noir": [
      {
        idStable: "6rxe1gt8mwu",
        url: "https://images.unsplash.com/photo-1578276445422-adc473a1cd82?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y2F0aGVkcmFsJTIwY3JpbXNvbiUyMGxpZ2h0fGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1578276445422-adc473a1cd82?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y2F0aGVkcmFsJTIwY3JpbXNvbiUyMGxpZ2h0fGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a large cathedral with stained glass windows and a clock",
        credit: {
          name: "Brian Erickson",
          username: "itsbrianerickson",
          profileUrl: "https://unsplash.com/@itsbrianerickson",
          photoUrl: "https://unsplash.com/photos/a-large-cathedral-with-stained-glass-windows-and-a-clock-6RXe1Gt8mwU",
        },
      },
      {
        idStable: "xthzn4miik8",
        url: "https://images.unsplash.com/photo-1699191808371-b271aeadf785?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y2F0aGVkcmFsJTIwY3JpbXNvbiUyMGxpZ2h0fGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1699191808371-b271aeadf785?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y2F0aGVkcmFsJTIwY3JpbXNvbiUyMGxpZ2h0fGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "the sunlight is shining through the stained glass windows",
        credit: {
          name: "Maddy Meng",
          username: "the_maddy",
          profileUrl: "https://unsplash.com/@the_maddy",
          photoUrl: "https://unsplash.com/photos/the-sunlight-is-shining-through-the-stained-glass-windows-xthZn4mIik8",
        },
      },
      {
        idStable: "ps1oo8tn7pm",
        url: "https://images.unsplash.com/photo-1765132872405-45af880d08af?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y2F0aGVkcmFsJTIwY3JpbXNvbiUyMGxpZ2h0fGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1765132872405-45af880d08af?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y2F0aGVkcmFsJTIwY3JpbXNvbiUyMGxpZ2h0fGVufDF8MXx8fDE3OTIzMjY1NTF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#404040",
        alt: "Gothic cathedral illuminated with orange light at night",
        credit: {
          name: "Alexandr Popadin",
          username: "irrabagon",
          profileUrl: "https://unsplash.com/@irrabagon",
          photoUrl: "https://unsplash.com/photos/gothic-cathedral-illuminated-with-orange-light-at-night-pS1Oo8tN7pM",
        },
      },
    ],
    "orchid": [
      {
        idStable: "-xuj1y3obf4",
        url: "https://images.unsplash.com/photo-1700760815621-7039fd0ebaeb?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8c3RhaW5lZCUyMGdsYXNzJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY1NTJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1700760815621-7039fd0ebaeb?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8c3RhaW5lZCUyMGdsYXNzJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY1NTJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "a stained glass window in a church",
        credit: {
          name: "Lina",
          username: "linakhaled",
          profileUrl: "https://unsplash.com/@linakhaled",
          photoUrl: "https://unsplash.com/photos/a-stained-glass-window-in-a-church-_Xuj1Y3OBF4",
        },
      },
      {
        idStable: "xah4f2hvwji",
        url: "https://images.unsplash.com/photo-1742079945096-6f948bac30a0?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8c3RhaW5lZCUyMGdsYXNzJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY1NTJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1742079945096-6f948bac30a0?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8c3RhaW5lZCUyMGdsYXNzJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY1NTJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "Stained-glass window with colorful geometric shapes",
        credit: {
          name: "mandylin",
          username: "mandylinc",
          profileUrl: "https://unsplash.com/@mandylinc",
          photoUrl: "https://unsplash.com/photos/stained-glass-window-with-colorful-geometric-shapes-XaH4F2HvwjI",
        },
      },
      {
        idStable: "onqwcwcxp-a",
        url: "https://images.unsplash.com/photo-1755643236492-7631f9abb250?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8c3RhaW5lZCUyMGdsYXNzJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY1NTJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1755643236492-7631f9abb250?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8c3RhaW5lZCUyMGdsYXNzJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY1NTJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c8c73",
        alt: "Ornate stained glass window with central religious figure",
        credit: {
          name: "Gianna B",
          username: "gia123x",
          profileUrl: "https://unsplash.com/@gia123x",
          photoUrl: "https://unsplash.com/photos/ornate-stained-glass-window-with-central-religious-figure-onqwcwcxp-A",
        },
      },
    ],
    "citrus": [
      {
        idStable: "y0-k60uv7gi",
        url: "https://images.unsplash.com/photo-1780783526784-c1f70e504fee?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Z290aGljJTIwYXJjaCUyMGdvbGRlbiUyMGhvdXJ8ZW58MXwxfHx8MTc5MjMyNjU1Mnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1780783526784-c1f70e504fee?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Z290aGljJTIwYXJjaCUyMGdvbGRlbiUyMGhvdXJ8ZW58MXwxfHx8MTc5MjMyNjU1Mnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0d9f3",
        alt: "Two ornate gothic towers against a clear blue sky",
        credit: {
          name: "David Fucsku",
          username: "davidfucsku",
          profileUrl: "https://unsplash.com/@davidfucsku",
          photoUrl: "https://unsplash.com/photos/two-ornate-gothic-towers-against-a-clear-blue-sky-Y0_K60UV7GI",
        },
      },
      {
        idStable: "qcux9la3p4o",
        url: "https://images.unsplash.com/photo-1777886442034-fde9bf8c6161?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Z290aGljJTIwYXJjaCUyMGdvbGRlbiUyMGhvdXJ8ZW58MXwxfHx8MTc5MjMyNjU1Mnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1777886442034-fde9bf8c6161?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Z290aGljJTIwYXJjaCUyMGdvbGRlbiUyMGhvdXJ8ZW58MXwxfHx8MTc5MjMyNjU1Mnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#4073a6",
        alt: "Stone church tower against a clear blue sky",
        credit: {
          name: "Sebastien Devocelle",
          username: "lecelle",
          profileUrl: "https://unsplash.com/@lecelle",
          photoUrl: "https://unsplash.com/photos/stone-church-tower-against-a-clear-blue-sky-qCUX9lA3P4o",
        },
      },
      {
        idStable: "65fkyph2tke",
        url: "https://images.unsplash.com/photo-1763887647159-dacbc180e1ba?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Z290aGljJTIwYXJjaCUyMGdvbGRlbiUyMGhvdXJ8ZW58MXwxfHx8MTc5MjMyNjU1Mnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1763887647159-dacbc180e1ba?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Z290aGljJTIwYXJjaCUyMGdvbGRlbiUyMGhvdXJ8ZW58MXwxfHx8MTc5MjMyNjU1Mnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262640",
        alt: "Gothic window reflects golden light on stone wall",
        credit: {
          name: "Austin",
          username: "austin_7792",
          profileUrl: "https://unsplash.com/@austin_7792",
          photoUrl: "https://unsplash.com/photos/gothic-window-reflects-golden-light-on-stone-wall-65FkyPH2tKE",
        },
      },
    ],
    "moss": [
      {
        idStable: "qiwawwhehto",
        url: "https://images.unsplash.com/photo-1708022772151-26030f4a4ba4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8c3RvbmUlMjBjYXRoZWRyYWwlMjBncmVlbiUyMG1vc3N8ZW58MXwxfHx8MTc5MjMyNjU1M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1708022772151-26030f4a4ba4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8c3RvbmUlMjBjYXRoZWRyYWwlMjBncmVlbiUyMG1vc3N8ZW58MXwxfHx8MTc5MjMyNjU1M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "Vibrant green moss growing in thick textured clumps on a dark surface",
        credit: {
          name: "Nicholas Bullett",
          username: "munkstt",
          profileUrl: "https://unsplash.com/@munkstt",
          photoUrl: "https://unsplash.com/photos/vibrant-green-moss-texture-qiWaWWhehTo",
        },
      },
      {
        idStable: "mmxr5dyyieq",
        url: "https://images.unsplash.com/photo-1728403339740-53320a23cca6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8c3RvbmUlMjBjYXRoZWRyYWwlMjBncmVlbiUyMG1vc3N8ZW58MXwxfHx8MTc5MjMyNjU1M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1728403339740-53320a23cca6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8c3RvbmUlMjBjYXRoZWRyYWwlMjBncmVlbiUyMG1vc3N8ZW58MXwxfHx8MTc5MjMyNjU1M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "A man standing on top of a cliff next to a forest",
        credit: {
          name: "Francesco Ungaro",
          username: "francesco_ungaro",
          profileUrl: "https://unsplash.com/@francesco_ungaro",
          photoUrl: "https://unsplash.com/photos/a-man-standing-on-top-of-a-cliff-next-to-a-forest-mMXR5dyyIeQ",
        },
      },
      {
        idStable: "pf-favrjyxc",
        url: "https://images.unsplash.com/photo-1778657006928-c1b3a33d4f14?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8c3RvbmUlMjBjYXRoZWRyYWwlMjBncmVlbiUyMG1vc3N8ZW58MXwxfHx8MTc5MjMyNjU1M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1778657006928-c1b3a33d4f14?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8c3RvbmUlMjBjYXRoZWRyYWwlMjBncmVlbiUyMG1vc3N8ZW58MXwxfHx8MTc5MjMyNjU1M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "Ancient moss-covered stone well with spiral staircase",
        credit: {
          name: "Bernd 📷 Dittrich",
          username: "hdbernd",
          profileUrl: "https://unsplash.com/@hdbernd",
          photoUrl: "https://unsplash.com/photos/ancient-moss-covered-stone-well-with-spiral-staircase-pf_fAVrJYXc",
        },
      },
    ],
    "paper": [
      {
        idStable: "gwggymglljc",
        url: "https://images.unsplash.com/photo-1734969195452-70db13a1b0f7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y2F0aGVkcmFsJTIwc2tldGNoJTIwZW5ncmF2aW5nfGVufDF8MXx8fDE3OTIzMjY1NTV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1734969195452-70db13a1b0f7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Y2F0aGVkcmFsJTIwc2tldGNoJTIwZW5ncmF2aW5nfGVufDF8MXx8fDE3OTIzMjY1NTV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3d9d9",
        alt: "Gothic cathedral facade with ornate architectural details",
        credit: {
          name: "The Cleveland Museum of Art",
          username: "clevelandart",
          profileUrl: "https://unsplash.com/@clevelandart",
          photoUrl: "https://unsplash.com/photos/gothic-cathedral-facade-with-ornate-architectural-details-gwggyMgLLjc",
        },
      },
      {
        idStable: "vxa-kxciol8",
        url: "https://images.unsplash.com/photo-1746969750658-72858835c41c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y2F0aGVkcmFsJTIwc2tldGNoJTIwZW5ncmF2aW5nfGVufDF8MXx8fDE3OTIzMjY1NTV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1746969750658-72858835c41c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Y2F0aGVkcmFsJTIwc2tldGNoJTIwZW5ncmF2aW5nfGVufDF8MXx8fDE3OTIzMjY1NTV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3d9c0",
        alt: "Elaborate gothic cathedral facade with small figures in square",
        credit: {
          name: "The Cleveland Museum of Art",
          username: "clevelandart",
          profileUrl: "https://unsplash.com/@clevelandart",
          photoUrl: "https://unsplash.com/photos/elaborate-gothic-cathedral-facade-with-small-figures-in-square-vXA_KXcIol8",
        },
      },
      {
        idStable: "wzv2yqhsg-e",
        url: "https://images.unsplash.com/photo-1683222044336-f3bab424285e?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y2F0aGVkcmFsJTIwc2tldGNoJTIwZW5ncmF2aW5nfGVufDF8MXx8fDE3OTIzMjY1NTV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1683222044336-f3bab424285e?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Y2F0aGVkcmFsJTIwc2tldGNoJTIwZW5ncmF2aW5nfGVufDF8MXx8fDE3OTIzMjY1NTV8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0a6",
        alt: "A grand gothic cathedral with intricate spires and facade",
        credit: {
          name: "Museum of New Zealand Te Papa Tongarewa",
          username: "tepapa",
          profileUrl: "https://unsplash.com/@tepapa",
          photoUrl: "https://unsplash.com/photos/a-grand-gothic-cathedral-with-intricate-spires-and-facade-wzV2YQhsg_E",
        },
      },
    ],
  },
  "mid-century": {
    "per-quote": [
      {
        idStable: "rbbzn-m5fgu",
        url: "https://images.unsplash.com/photo-1648475236583-2e25a6cbf3bd?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMG1vZGVybiUyMGludGVyaW9yfGVufDF8MXx8fDE3OTIzMjY1NTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1648475236583-2e25a6cbf3bd?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMG1vZGVybiUyMGludGVyaW9yfGVufDF8MXx8fDE3OTIzMjY1NTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "a living room filled with furniture and a kitchen",
        credit: {
          name: "Bailey Alexander",
          username: "baileyal3xander",
          profileUrl: "https://unsplash.com/@baileyal3xander",
          photoUrl: "https://unsplash.com/photos/a-living-room-filled-with-furniture-and-a-kitchen-RbbZn_M5fgU",
        },
      },
      {
        idStable: "oknrjq6ywgg",
        url: "https://images.unsplash.com/photo-1648147870253-c45f6f430528?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMG1vZGVybiUyMGludGVyaW9yfGVufDF8MXx8fDE3OTIzMjY1NTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1648147870253-c45f6f430528?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMG1vZGVybiUyMGludGVyaW9yfGVufDF8MXx8fDE3OTIzMjY1NTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "a living room filled with furniture and a potted plant",
        credit: {
          name: "Jenn Buxton",
          username: "jennbuxton",
          profileUrl: "https://unsplash.com/@jennbuxton",
          photoUrl: "https://unsplash.com/photos/a-living-room-filled-with-furniture-and-a-potted-plant-okNrJQ6Ywgg",
        },
      },
      {
        idStable: "huotixgshqi",
        url: "https://images.unsplash.com/photo-1688728981543-df24d24d0116?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMG1vZGVybiUyMGludGVyaW9yfGVufDF8MXx8fDE3OTIzMjY1NTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1688728981543-df24d24d0116?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMG1vZGVybiUyMGludGVyaW9yfGVufDF8MXx8fDE3OTIzMjY1NTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "a room with a wooden cabinet and a picture on the wall",
        credit: {
          name: "Fredrik Posse",
          username: "fredrikposse",
          profileUrl: "https://unsplash.com/@fredrikposse",
          photoUrl: "https://unsplash.com/photos/a-room-with-a-wooden-cabinet-and-a-picture-on-the-wall-hUOTixGshqI",
        },
      },
    ],
    "midnight-cobalt": [
      {
        idStable: "d-6rzmdpebq",
        url: "https://images.unsplash.com/photo-1587023705100-8094f8d47e86?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwbmlnaHR8ZW58MXwxfHx8MTc5MjMyNjU1N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1587023705100-8094f8d47e86?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwbmlnaHR8ZW58MXwxfHx8MTc5MjMyNjU1N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "white bed linen near white window blinds",
        credit: {
          name: "Susan Q Yin",
          username: "syinq",
          profileUrl: "https://unsplash.com/@syinq",
          photoUrl: "https://unsplash.com/photos/white-bed-linen-near-white-window-blinds-D_6rzmdpebQ",
        },
      },
      {
        idStable: "41czsjzdkrq",
        url: "https://images.unsplash.com/photo-1698864551605-fab9fed03af5?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwbmlnaHR8ZW58MXwxfHx8MTc5MjMyNjU1N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1698864551605-fab9fed03af5?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwbmlnaHR8ZW58MXwxfHx8MTc5MjMyNjU1N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "a black and white photo of a chair in a dark room",
        credit: {
          name: "Anton Sobotyak",
          username: "a_sobotyak",
          profileUrl: "https://unsplash.com/@a_sobotyak",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-photo-of-a-chair-in-a-dark-room-41CzsjzdkRQ",
        },
      },
      {
        idStable: "dix-vbx7aaa",
        url: "https://images.unsplash.com/photo-1634201580620-110223756709?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwbmlnaHR8ZW58MXwxfHx8MTc5MjMyNjU1N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1634201580620-110223756709?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwbmlnaHR8ZW58MXwxfHx8MTc5MjMyNjU1N3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a dimly lit room with a table and chairs",
        credit: {
          name: "Javier Haro",
          username: "capturedbyjavi",
          profileUrl: "https://unsplash.com/@capturedbyjavi",
          photoUrl: "https://unsplash.com/photos/a-dimly-lit-room-with-a-table-and-chairs-dIx_Vbx7AaA",
        },
      },
    ],
    "rose-noir": [
      {
        idStable: "b37mdypzdjm",
        url: "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwdGVycmFjb3R0YXxlbnwxfDF8fHwxNzkyMzI2NTU4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1505576391880-b3f9d713dc4f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwdGVycmFjb3R0YXxlbnwxfDF8fHwxNzkyMzI2NTU4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9c0c0",
        alt: "planters with plant near area rug inside room",
        credit: {
          name: "Maria Orlova",
          username: "orlovamaria",
          profileUrl: "https://unsplash.com/@orlovamaria",
          photoUrl: "https://unsplash.com/photos/planters-with-plant-near-area-rug-inside-room-b37mDyPzdJM",
        },
      },
      {
        idStable: "tskyvxf1d4m",
        url: "https://images.unsplash.com/photo-1762755647813-017e128a4ba0?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwdGVycmFjb3R0YXxlbnwxfDF8fHwxNzkyMzI2NTU4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1762755647813-017e128a4ba0?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwdGVycmFjb3R0YXxlbnwxfDF8fHwxNzkyMzI2NTU4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d97340",
        alt: "Monstera plant in a terracotta pot against orange wall",
        credit: {
          name: "Febri Adiawarja",
          username: "adiawarja",
          profileUrl: "https://unsplash.com/@adiawarja",
          photoUrl: "https://unsplash.com/photos/monstera-plant-in-a-terracotta-pot-against-orange-wall-TSKYvXf1d4M",
        },
      },
      {
        idStable: "esbkvubllw4",
        url: "https://images.unsplash.com/photo-1689884129180-34ac0dc22488?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwdGVycmFjb3R0YXxlbnwxfDF8fHwxNzkyMzI2NTU4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1689884129180-34ac0dc22488?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwdGVycmFjb3R0YXxlbnwxfDF8fHwxNzkyMzI2NTU4fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "a vase and a candle holder on a shelf",
        credit: {
          name: "Adrian Handschu",
          username: "adrianhsc",
          profileUrl: "https://unsplash.com/@adrianhsc",
          photoUrl: "https://unsplash.com/photos/a-vase-and-a-candle-holder-on-a-shelf-EsBkvuBlLW4",
        },
      },
    ],
    "orchid": [
      {
        idStable: "qbpzpbvojzw",
        url: "https://images.unsplash.com/photo-1536437155202-feece465c323?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwcHVycGxlfGVufDF8MXx8fDE3OTIzMjY1NTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1536437155202-feece465c323?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwcHVycGxlfGVufDF8MXx8fDE3OTIzMjY1NTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c738c",
        alt: "brown gramophone near wall",
        credit: {
          name: "Lina Castaneda",
          username: "linacastaneda",
          profileUrl: "https://unsplash.com/@linacastaneda",
          photoUrl: "https://unsplash.com/photos/brown-gramophone-near-wall-qbpZpbVoJZw",
        },
      },
      {
        idStable: "qcskw0mr2g0",
        url: "https://images.unsplash.com/photo-1775494117665-5e728dd2c818?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwcHVycGxlfGVufDF8MXx8fDE3OTIzMjY1NTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1775494117665-5e728dd2c818?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwcHVycGxlfGVufDF8MXx8fDE3OTIzMjY1NTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c8c73",
        alt: "Green chair and retro cabinet with colorful wall art",
        credit: {
          name: "Fujiphilm",
          username: "fujiphilm",
          profileUrl: "https://unsplash.com/@fujiphilm",
          photoUrl: "https://unsplash.com/photos/green-chair-and-retro-cabinet-with-colorful-wall-art-qCSkw0MR2g0",
        },
      },
      {
        idStable: "80-tcbvlqqa",
        url: "https://images.unsplash.com/photo-1765734482970-da3c114d06c7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwcHVycGxlfGVufDF8MXx8fDE3OTIzMjY1NTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1765734482970-da3c114d06c7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwcHVycGxlfGVufDF8MXx8fDE3OTIzMjY1NTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "Vintage room with checkered floor and old television",
        credit: {
          name: "Rita Daisy",
          username: "da_daisy",
          profileUrl: "https://unsplash.com/@da_daisy",
          photoUrl: "https://unsplash.com/photos/vintage-room-with-checkered-floor-and-old-television-80_tCbvlqqA",
        },
      },
    ],
    "citrus": [
      {
        idStable: "ssmi-q3vpha",
        url: "https://images.unsplash.com/photo-1636212644134-5867a3807ef9?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMG11c3RhcmQlMjBjaGFpcnxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1636212644134-5867a3807ef9?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMG11c3RhcmQlMjBjaGFpcnxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a yellow chair sitting on top of a carpeted floor",
        credit: {
          name: "David Underland",
          username: "david_underland",
          profileUrl: "https://unsplash.com/@david_underland",
          photoUrl: "https://unsplash.com/photos/a-yellow-chair-sitting-on-top-of-a-carpeted-floor-SSMI-q3VPhA",
        },
      },
      {
        idStable: "9xnnepx6haa",
        url: "https://images.unsplash.com/photo-1620003039413-b519b3c12e4d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMG11c3RhcmQlMjBjaGFpcnxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1620003039413-b519b3c12e4d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMG11c3RhcmQlMjBjaGFpcnxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#264040",
        alt: "orange and black chair on brown wooden floor",
        credit: {
          name: "Jake Nackos",
          username: "jakenackos",
          profileUrl: "https://unsplash.com/@jakenackos",
          photoUrl: "https://unsplash.com/photos/orange-and-black-chair-on-brown-wooden-floor-9xnnEpX6HAA",
        },
      },
      {
        idStable: "8rz-riyp5fm",
        url: "https://images.unsplash.com/photo-1579656592043-a20e25a4aa4b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMG11c3RhcmQlMjBjaGFpcnxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1579656592043-a20e25a4aa4b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMG11c3RhcmQlMjBjaGFpcnxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "white throw pillow on green sofa chair",
        credit: {
          name: "khloe arledge",
          username: "khloephoto",
          profileUrl: "https://unsplash.com/@khloephoto",
          photoUrl: "https://unsplash.com/photos/white-throw-pillow-on-green-sofa-chair-8Rz_RIyp5FM",
        },
      },
    ],
    "moss": [
      {
        idStable: "bldr6id9ico",
        url: "https://images.unsplash.com/photo-1647629317743-5b16c8848762?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGdyZWVuJTIwd2FsbHxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1647629317743-5b16c8848762?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGdyZWVuJTIwd2FsbHxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#264026",
        alt: "a close up of a green wall with plants",
        credit: {
          name: "Jonny Gios",
          username: "supergios",
          profileUrl: "https://unsplash.com/@supergios",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-green-wall-with-plants-BlDr6Id9ICo",
        },
      },
      {
        idStable: "wnxqgdudjba",
        url: "https://images.unsplash.com/photo-1509767237982-070742f77b60?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGdyZWVuJTIwd2FsbHxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1509767237982-070742f77b60?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGdyZWVuJTIwd2FsbHxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "green leaf plant",
        credit: {
          name: "Alyona Yankovska",
          username: "alyonayankovska",
          profileUrl: "https://unsplash.com/@alyonayankovska",
          photoUrl: "https://unsplash.com/photos/green-leaf-plant-wNxqGDUdjbA",
        },
      },
      {
        idStable: "66ydmrxw-b8",
        url: "https://images.unsplash.com/photo-1687873803593-8dbd3bb5e94d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGdyZWVuJTIwd2FsbHxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1687873803593-8dbd3bb5e94d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGdyZWVuJTIwd2FsbHxlbnwxfDF8fHwxNzkyMzI2NTYwfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a6a673",
        alt: "a green wall with a plant in front of it",
        credit: {
          name: "Danielle Suijkerbuijk",
          username: "vandaantje",
          profileUrl: "https://unsplash.com/@vandaantje",
          photoUrl: "https://unsplash.com/photos/a-green-wall-with-a-plant-in-front-of-it-66ydMRXW-b8",
        },
      },
    ],
    "paper": [
      {
        idStable: "a14nxetfmxe",
        url: "https://images.unsplash.com/photo-1714888522647-8acaa7772095?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwZGF5bGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU2MXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1714888522647-8acaa7772095?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwZGF5bGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU2MXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a large room with a glass ceiling and a white chair",
        credit: {
          name: "Naomi August",
          username: "naomi_august",
          profileUrl: "https://unsplash.com/@naomi_august",
          photoUrl: "https://unsplash.com/photos/a-large-room-with-a-glass-ceiling-and-a-white-chair-a14NxeTfMXE",
        },
      },
      {
        idStable: "h-84ahplswq",
        url: "https://images.unsplash.com/photo-1715795907522-d80b4ea49f6f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwZGF5bGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU2MXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1715795907522-d80b4ea49f6f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwZGF5bGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU2MXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9c0c0",
        alt: "a dining room with a table and chairs",
        credit: {
          name: "Martha Monjaras",
          username: "marthamonjaras",
          profileUrl: "https://unsplash.com/@marthamonjaras",
          photoUrl: "https://unsplash.com/photos/a-dining-room-with-a-table-and-chairs-H_84aHPLsWQ",
        },
      },
      {
        idStable: "be1nbpm-cnk",
        url: "https://images.unsplash.com/photo-1778034506255-ad33053cbbdd?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwZGF5bGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU2MXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1778034506255-ad33053cbbdd?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlkJTIwY2VudHVyeSUyMGludGVyaW9yJTIwZGF5bGlnaHR8ZW58MXwxfHx8MTc5MjMyNjU2MXww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "Sunlight streaming through large grid windows onto wooden floor",
        credit: {
          name: "Declan Sun",
          username: "declansun",
          profileUrl: "https://unsplash.com/@declansun",
          photoUrl: "https://unsplash.com/photos/sunlight-streaming-through-large-grid-windows-onto-wooden-floor-bE1NBPm_cNk",
        },
      },
    ],
  },
  "bohemian": {
    "per-quote": [
      {
        idStable: "5tp0gk4mqmo",
        url: "https://images.unsplash.com/photo-1655149238677-9b5cb1a0afc6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1655149238677-9b5cb1a0afc6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "a group of ties",
        credit: {
          name: "Conny Schneider",
          username: "choys_",
          profileUrl: "https://unsplash.com/@choys_",
          photoUrl: "https://unsplash.com/photos/a-group-of-ties-5tp0Gk4MQmo",
        },
      },
      {
        idStable: "tugncffiene",
        url: "https://images.unsplash.com/photo-1673387752683-465ba7e1bcf3?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1673387752683-465ba7e1bcf3?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a black and white photo of a woven material",
        credit: {
          name: "Dom Labo",
          username: "dmnk1991",
          profileUrl: "https://unsplash.com/@dmnk1991",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-photo-of-a-woven-material-tuGNCfFIeNE",
        },
      },
      {
        idStable: "mgzlbuy0vcq",
        url: "https://images.unsplash.com/photo-1781450952108-a6f511e71b05?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1781450952108-a6f511e71b05?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "Colorful patterned woven textiles hanging vertically with intricate designs",
        credit: {
          name: "Hongjin Wang",
          username: "wu_hua_jiang",
          profileUrl: "https://unsplash.com/@wu_hua_jiang",
          photoUrl: "https://unsplash.com/photos/colorful-patterned-woven-textiles-hanging-vertically-with-intricate-designs-mGzLBuy0VcQ",
        },
      },
    ],
    "midnight-cobalt": [
      {
        idStable: "7jiyuflv9tc",
        url: "https://images.unsplash.com/photo-1701964621015-057c5bc5815f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8aW5kaWdvJTIwdGV4dGlsZSUyMHBhdHRlcm58ZW58MXwxfHx8MTc5MjMyNjU2M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1701964621015-057c5bc5815f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8aW5kaWdvJTIwdGV4dGlsZSUyMHBhdHRlcm58ZW58MXwxfHx8MTc5MjMyNjU2M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0a68c",
        alt: "a black and white rug with a design on it",
        credit: {
          name: "The Cleveland Museum of Art",
          username: "clevelandart",
          profileUrl: "https://unsplash.com/@clevelandart",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-rug-with-a-design-on-it-7JIYUfLv9Tc",
        },
      },
      {
        idStable: "j4dez8ihihs",
        url: "https://images.unsplash.com/photo-1577084381419-8141b7840a08?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8aW5kaWdvJTIwdGV4dGlsZSUyMHBhdHRlcm58ZW58MXwxfHx8MTc5MjMyNjU2M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1577084381419-8141b7840a08?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8aW5kaWdvJTIwdGV4dGlsZSUyMHBhdHRlcm58ZW58MXwxfHx8MTc5MjMyNjU2M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0a6a6",
        alt: "blue and white abstract painting",
        credit: {
          name: "Birmingham Museums Trust",
          username: "birminghammuseumstrust",
          profileUrl: "https://unsplash.com/@birminghammuseumstrust",
          photoUrl: "https://unsplash.com/photos/blue-and-white-abstract-painting-j4dEz8IHIhs",
        },
      },
      {
        idStable: "lfbtgs0dwue",
        url: "https://images.unsplash.com/photo-1702628909111-86464af7de5d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8aW5kaWdvJTIwdGV4dGlsZSUyMHBhdHRlcm58ZW58MXwxfHx8MTc5MjMyNjU2M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1702628909111-86464af7de5d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8aW5kaWdvJTIwdGV4dGlsZSUyMHBhdHRlcm58ZW58MXwxfHx8MTc5MjMyNjU2M3ww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#737373",
        alt: "a blue and white wallpaper with a pattern of leaves",
        credit: {
          name: "Art Institute of Chicago",
          username: "artchicago",
          profileUrl: "https://unsplash.com/@artchicago",
          photoUrl: "https://unsplash.com/photos/a-blue-and-white-wallpaper-with-a-pattern-of-leaves-LfBtGs0DWUE",
        },
      },
    ],
    "rose-noir": [
      {
        idStable: "5tp0gk4mqmo",
        url: "https://images.unsplash.com/photo-1655149238677-9b5cb1a0afc6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1655149238677-9b5cb1a0afc6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "a group of ties",
        credit: {
          name: "Conny Schneider",
          username: "choys_",
          profileUrl: "https://unsplash.com/@choys_",
          photoUrl: "https://unsplash.com/photos/a-group-of-ties-5tp0Gk4MQmo",
        },
      },
      {
        idStable: "tugncffiene",
        url: "https://images.unsplash.com/photo-1673387752683-465ba7e1bcf3?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1673387752683-465ba7e1bcf3?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#262626",
        alt: "a black and white photo of a woven material",
        credit: {
          name: "Dom Labo",
          username: "dmnk1991",
          profileUrl: "https://unsplash.com/@dmnk1991",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-photo-of-a-woven-material-tuGNCfFIeNE",
        },
      },
      {
        idStable: "mgzlbuy0vcq",
        url: "https://images.unsplash.com/photo-1781450952108-a6f511e71b05?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1781450952108-a6f511e71b05?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8d292ZW4lMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2NTYyfDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c0c",
        alt: "Colorful patterned woven textiles hanging vertically with intricate designs",
        credit: {
          name: "Hongjin Wang",
          username: "wu_hua_jiang",
          profileUrl: "https://unsplash.com/@wu_hua_jiang",
          photoUrl: "https://unsplash.com/photos/colorful-patterned-woven-textiles-hanging-vertically-with-intricate-designs-mGzLBuy0VcQ",
        },
      },
    ],
    "orchid": [
      {
        idStable: "ovslv05pldm",
        url: "https://images.unsplash.com/photo-1679395283817-39f56e249ea6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8YW1ldGh5c3QlMjB0ZXh0aWxlfGVufDF8MXx8fDE3OTIzMjY3OTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1679395283817-39f56e249ea6?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8YW1ldGh5c3QlMjB0ZXh0aWxlfGVufDF8MXx8fDE3OTIzMjY3OTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c26",
        alt: "a close up of a rock with purple crystals",
        credit: {
          name: "Leigh Miles",
          username: "thelensandleigh",
          profileUrl: "https://unsplash.com/@thelensandleigh",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-rock-with-purple-crystals-OVsLV05pLDM",
        },
      },
      {
        idStable: "on0jlgkd8r0",
        url: "https://images.unsplash.com/photo-1632980205460-e490e885e848?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8YW1ldGh5c3QlMjB0ZXh0aWxlfGVufDF8MXx8fDE3OTIzMjY3OTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1632980205460-e490e885e848?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8YW1ldGh5c3QlMjB0ZXh0aWxlfGVufDF8MXx8fDE3OTIzMjY3OTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#260c26",
        alt: "a bunch of purple crystals sitting on top of a table",
        credit: {
          name: "Daniel Olah",
          username: "danesduet",
          profileUrl: "https://unsplash.com/@danesduet",
          photoUrl: "https://unsplash.com/photos/a-bunch-of-purple-crystals-sitting-on-top-of-a-table-ON0jlgkd8R0",
        },
      },
      {
        idStable: "t5ctglm-q44",
        url: "https://images.unsplash.com/photo-1669562022300-9cc129fb5c5b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8YW1ldGh5c3QlMjB0ZXh0aWxlfGVufDF8MXx8fDE3OTIzMjY3OTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1669562022300-9cc129fb5c5b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8YW1ldGh5c3QlMjB0ZXh0aWxlfGVufDF8MXx8fDE3OTIzMjY3OTZ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#734073",
        alt: "A pile of purple crystals sitting on top of a table",
        credit: {
          name: "Noë Baeten",
          username: "noebaeten",
          profileUrl: "https://unsplash.com/@noebaeten",
          photoUrl: "https://unsplash.com/photos/a-pile-of-purple-crystals-sitting-on-top-of-a-table-T5CtgLm-q44",
        },
      },
    ],
    "citrus": [
      {
        idStable: "w3cbc1szb5y",
        url: "https://images.unsplash.com/photo-1699764681875-dd04ce36b1c3?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWFyaWdvbGQlMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2Nzk3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1699764681875-dd04ce36b1c3?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWFyaWdvbGQlMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2Nzk3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0400c",
        alt: "a close up of a bunch of orange flowers",
        credit: {
          name: "Himanshu Soni",
          username: "himanshusoni",
          profileUrl: "https://unsplash.com/@himanshusoni",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-bunch-of-orange-flowers-W3CBC1SZB5Y",
        },
      },
      {
        idStable: "jm3i-xplzme",
        url: "https://images.unsplash.com/photo-1702590447351-28395dfef0a1?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWFyaWdvbGQlMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2Nzk3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1702590447351-28395dfef0a1?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWFyaWdvbGQlMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2Nzk3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#735940",
        alt: "a close up of a pattern on a wall",
        credit: {
          name: "Art Institute of Chicago",
          username: "artchicago",
          profileUrl: "https://unsplash.com/@artchicago",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-pattern-on-a-wall-JM3i-xPlZmE",
        },
      },
      {
        idStable: "yzixwfunqks",
        url: "https://images.unsplash.com/photo-1660684693847-411b66227f92?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWFyaWdvbGQlMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2Nzk3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1660684693847-411b66227f92?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWFyaWdvbGQlMjB0ZXh0aWxlJTIwcGF0dGVybnxlbnwxfDF8fHwxNzkyMzI2Nzk3fDA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#0c2626",
        alt: "a close up of a flower",
        credit: {
          name: "Filza H",
          username: "filzah",
          profileUrl: "https://unsplash.com/@filzah",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-flower-yZiXWFuNQks",
        },
      },
    ],
    "moss": [
      {
        idStable: "gakbuu10g8a",
        url: "https://images.unsplash.com/photo-1658819543328-59b114859eaf?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bW9zcyUyMGR5ZWQlMjB3b29sfGVufDF8MXx8fDE3OTIzMjY3OTh8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1658819543328-59b114859eaf?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bW9zcyUyMGR5ZWQlMjB3b29sfGVufDF8MXx8fDE3OTIzMjY3OTh8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#404026",
        alt: "a close up of some moss",
        credit: {
          name: "Isuru Ranasinha",
          username: "isuru18",
          profileUrl: "https://unsplash.com/@isuru18",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-some-moss-GaKbUU10G8A",
        },
      },
      {
        idStable: "bin1umw8zi0",
        url: "https://images.unsplash.com/photo-1604951830505-6d6c354e23a1?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bW9zcyUyMGR5ZWQlMjB3b29sfGVufDF8MXx8fDE3OTIzMjY3OTh8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1604951830505-6d6c354e23a1?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bW9zcyUyMGR5ZWQlMjB3b29sfGVufDF8MXx8fDE3OTIzMjY3OTh8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#737359",
        alt: "brown and white plant stem",
        credit: {
          name: "pure julia",
          username: "purejulia",
          profileUrl: "https://unsplash.com/@purejulia",
          photoUrl: "https://unsplash.com/photos/brown-and-white-plant-stem-BIn1uMw8ZI0",
        },
      },
      {
        idStable: "ougtey9yyta",
        url: "https://images.unsplash.com/photo-1659042037636-452d635465a9?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bW9zcyUyMGR5ZWQlMjB3b29sfGVufDF8MXx8fDE3OTIzMjY3OTh8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1659042037636-452d635465a9?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bW9zcyUyMGR5ZWQlMjB3b29sfGVufDF8MXx8fDE3OTIzMjY3OTh8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#594040",
        alt: "a close up of a plant",
        credit: {
          name: "Jack Hughes",
          username: "jack_hughes21",
          profileUrl: "https://unsplash.com/@jack_hughes21",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-plant-OUgTEY9YytA",
        },
      },
    ],
    "paper": [
      {
        idStable: "qfq6vsou7xa",
        url: "https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bGluZW4lMjB3ZWF2ZSUyMG5hdHVyYWx8ZW58MXwxfHx8MTc5MjMyNjc5OHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bGluZW4lMjB3ZWF2ZSUyMG5hdHVyYWx8ZW58MXwxfHx8MTc5MjMyNjc5OHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9c0a6",
        alt: "a close up of a beige fabric textured background",
        credit: {
          name: "Safwan Thottoli",
          username: "safwan_thottoli",
          profileUrl: "https://unsplash.com/@safwan_thottoli",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-beige-fabric-textured-background-QFQ6vsou7XA",
        },
      },
      {
        idStable: "2ndtpnilcd0",
        url: "https://images.unsplash.com/photo-1634665810235-011d663754e7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bGluZW4lMjB3ZWF2ZSUyMG5hdHVyYWx8ZW58MXwxfHx8MTc5MjMyNjc5OHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1634665810235-011d663754e7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bGluZW4lMjB3ZWF2ZSUyMG5hdHVyYWx8ZW58MXwxfHx8MTc5MjMyNjc5OHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0a6",
        alt: "a close up of a bed with a white sheet",
        credit: {
          name: "Kateryna Hliznitsova",
          username: "kate_gliz",
          profileUrl: "https://unsplash.com/@kate_gliz",
          photoUrl: "https://unsplash.com/photos/a-close-up-of-a-bed-with-a-white-sheet-2NDtPNiLcD0",
        },
      },
      {
        idStable: "kqyu8uglttc",
        url: "https://images.unsplash.com/photo-1759185301751-2a8fa1314d7b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bGluZW4lMjB3ZWF2ZSUyMG5hdHVyYWx8ZW58MXwxfHx8MTc5MjMyNjc5OHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1759185301751-2a8fa1314d7b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bGluZW4lMjB3ZWF2ZSUyMG5hdHVyYWx8ZW58MXwxfHx8MTc5MjMyNjc5OHww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "Subtle textured background with fine horizontal and vertical lines",
        credit: {
          name: "Logan Voss",
          username: "loganvoss",
          profileUrl: "https://unsplash.com/@loganvoss",
          photoUrl: "https://unsplash.com/photos/subtle-textured-background-with-fine-horizontal-and-vertical-lines-KQyU8Uglttc",
        },
      },
    ],
  },
  "ethereal": {
    "per-quote": [
      {
        idStable: "trdquopy2xc",
        url: "https://images.unsplash.com/photo-1624896569272-2fdd8944fa24?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlzdHklMjBtb3VudGFpbiUyMHJpZGdlfGVufDF8MXx8fDE3OTIzMjY3OTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1624896569272-2fdd8944fa24?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlzdHklMjBtb3VudGFpbiUyMHJpZGdlfGVufDF8MXx8fDE3OTIzMjY3OTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "green trees on mountain under white clouds during daytime",
        credit: {
          name: "Oleg Kryzhanovskyi",
          username: "bullettrainnnnn",
          profileUrl: "https://unsplash.com/@bullettrainnnnn",
          photoUrl: "https://unsplash.com/photos/green-trees-on-mountain-under-white-clouds-during-daytime-TrdqUOPY2xc",
        },
      },
      {
        idStable: "79u3hkw7-di",
        url: "https://images.unsplash.com/photo-1689590514898-99404f4d188d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlzdHklMjBtb3VudGFpbiUyMHJpZGdlfGVufDF8MXx8fDE3OTIzMjY3OTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1689590514898-99404f4d188d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlzdHklMjBtb3VudGFpbiUyMHJpZGdlfGVufDF8MXx8fDE3OTIzMjY3OTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#c0c0c0",
        alt: "an aerial view of a mountain side with clouds and trees",
        credit: {
          name: "Alen Smola",
          username: "alen_smola",
          profileUrl: "https://unsplash.com/@alen_smola",
          photoUrl: "https://unsplash.com/photos/an-aerial-view-of-a-mountain-side-with-clouds-and-trees-79u3hkw7-DI",
        },
      },
      {
        idStable: "thblc-2vjtk",
        url: "https://images.unsplash.com/photo-1634625797338-f7effe84db3d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlzdHklMjBtb3VudGFpbiUyMHJpZGdlfGVufDF8MXx8fDE3OTIzMjY3OTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1634625797338-f7effe84db3d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlzdHklMjBtb3VudGFpbiUyMHJpZGdlfGVufDF8MXx8fDE3OTIzMjY3OTl8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a6a6a6",
        alt: "a man standing on top of a rocky cliff",
        credit: {
          name: "Patrik László",
          username: "patriklaszlo",
          profileUrl: "https://unsplash.com/@patriklaszlo",
          photoUrl: "https://unsplash.com/photos/a-man-standing-on-top-of-a-rocky-cliff-ThBlC-2vJtk",
        },
      },
    ],
    "midnight-cobalt": [
      {
        idStable: "elxbhhzvfo0",
        url: "https://images.unsplash.com/photo-1562814830-8286a3397045?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Ymx1ZSUyMGhvdXIlMjBtaXN0fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1562814830-8286a3397045?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Ymx1ZSUyMGhvdXIlMjBtaXN0fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a6d9f3",
        alt: "blue ocean photography",
        credit: {
          name: "Dave Hoefler",
          username: "iamthedave",
          profileUrl: "https://unsplash.com/@iamthedave",
          photoUrl: "https://unsplash.com/photos/blue-ocean-photography-ELXbHhzVFO0",
        },
      },
      {
        idStable: "cfkc0uozhjo",
        url: "https://images.unsplash.com/photo-1530569673472-307dc017a82d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Ymx1ZSUyMGhvdXIlMjBtaXN0fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1530569673472-307dc017a82d?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Ymx1ZSUyMGhvdXIlMjBtaXN0fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "mountains",
        credit: {
          name: "Alessio Soggetti",
          username: "asoggetti",
          profileUrl: "https://unsplash.com/@asoggetti",
          photoUrl: "https://unsplash.com/photos/mountains-cfKC0UOZHJo",
        },
      },
      {
        idStable: "wtgfn5grr3m",
        url: "https://images.unsplash.com/photo-1581713872605-b9dfbc84eaa4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Ymx1ZSUyMGhvdXIlMjBtaXN0fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1581713872605-b9dfbc84eaa4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Ymx1ZSUyMGhvdXIlMjBtaXN0fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "white clouds over the lake",
        credit: {
          name: "Sami Matias Breilin",
          username: "samimatias",
          profileUrl: "https://unsplash.com/@samimatias",
          photoUrl: "https://unsplash.com/photos/white-clouds-over-the-lake-Wtgfn5grR3M",
        },
      },
    ],
    "rose-noir": [
      {
        idStable: "0bvko0t6oce",
        url: "https://images.unsplash.com/photo-1588025632102-aa7acd130f5f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8ZGF3biUyMG1pc3QlMjBwaW5rJTIwc2t5fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1588025632102-aa7acd130f5f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8ZGF3biUyMG1pc3QlMjBwaW5rJTIwc2t5fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9f3",
        alt: "white and pink sky over the sea",
        credit: {
          name: "Ian Keefe",
          username: "iankeefe",
          profileUrl: "https://unsplash.com/@iankeefe",
          photoUrl: "https://unsplash.com/photos/white-and-pink-sky-over-the-sea-0BVkO0t6oCE",
        },
      },
      {
        idStable: "wtgfn5grr3m",
        url: "https://images.unsplash.com/photo-1581713872605-b9dfbc84eaa4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8ZGF3biUyMG1pc3QlMjBwaW5rJTIwc2t5fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1581713872605-b9dfbc84eaa4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8ZGF3biUyMG1pc3QlMjBwaW5rJTIwc2t5fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "white clouds over the lake",
        credit: {
          name: "Sami Matias Breilin",
          username: "samimatias",
          profileUrl: "https://unsplash.com/@samimatias",
          photoUrl: "https://unsplash.com/photos/white-clouds-over-the-lake-Wtgfn5grR3M",
        },
      },
      {
        idStable: "9hjz-h1gwro",
        url: "https://images.unsplash.com/photo-1663247168780-3fafc8c10c64?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8ZGF3biUyMG1pc3QlMjBwaW5rJTIwc2t5fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1663247168780-3fafc8c10c64?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8ZGF3biUyMG1pc3QlMjBwaW5rJTIwc2t5fGVufDF8MXx8fDE3OTIzMjY4MDB8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a68ca6",
        alt: "a pink and blue sky",
        credit: {
          name: "Hans",
          username: "hansphoto",
          profileUrl: "https://unsplash.com/@hansphoto",
          photoUrl: "https://unsplash.com/photos/a-pink-and-blue-sky-9hjz_h1GWRo",
        },
      },
    ],
    "orchid": [
      {
        idStable: "mqqk44sa8-w",
        url: "https://images.unsplash.com/photo-1784231882354-fdfb84057fb7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlzdHklMjBkYXduJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY4MDF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1784231882354-fdfb84057fb7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlzdHklMjBkYXduJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY4MDF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3d9",
        alt: "Misty morning over a green field with golden light",
        credit: {
          name: "Kristaps Ungurs",
          username: "kristapsungurs",
          profileUrl: "https://unsplash.com/@kristapsungurs",
          photoUrl: "https://unsplash.com/photos/misty-morning-over-a-green-field-with-golden-light-mQqK44sa8_w",
        },
      },
      {
        idStable: "jkotwpg88yc",
        url: "https://images.unsplash.com/photo-1790175482181-531fc2a2302c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlzdHklMjBkYXduJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY4MDF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1790175482181-531fc2a2302c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlzdHklMjBkYXduJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY4MDF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#8c8c8c",
        alt: "Low sun over a misty valley with distant mountain peaks under a soft sky",
        credit: {
          name: "Laura Chouette",
          username: "laurachouette",
          profileUrl: "https://unsplash.com/@laurachouette",
          photoUrl: "https://unsplash.com/photos/low-sun-over-misty-mountain-valley-jkOTWpg88yc",
        },
      },
      {
        idStable: "jmmkgg0-6po",
        url: "https://images.unsplash.com/photo-1775485483480-ac74e74435e4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlzdHklMjBkYXduJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY4MDF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1775485483480-ac74e74435e4?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlzdHklMjBkYXduJTIwdmlvbGV0fGVufDF8MXx8fDE3OTIzMjY4MDF8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#737373",
        alt: "Misty mountains at sunrise with soft pastel sky",
        credit: {
          name: "Monody Le",
          username: "monodyle",
          profileUrl: "https://unsplash.com/@monodyle",
          photoUrl: "https://unsplash.com/photos/misty-mountains-at-sunrise-with-soft-pastel-sky-JMMKGG0_6po",
        },
      },
    ],
    "citrus": [
      {
        idStable: "biwihjjgsdm",
        url: "https://images.unsplash.com/photo-1694517112518-3a355d01cc80?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Z29sZGVuJTIwbW9ybmluZyUyMG1pc3R8ZW58MXwxfHx8MTc5MjMyNjgwMnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1694517112518-3a355d01cc80?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8Z29sZGVuJTIwbW9ybmluZyUyMG1pc3R8ZW58MXwxfHx8MTc5MjMyNjgwMnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9c0",
        alt: "a foggy field with a lone tree in the distance",
        credit: {
          name: "Artem Balashevsky",
          username: "abalashevsky",
          profileUrl: "https://unsplash.com/@abalashevsky",
          photoUrl: "https://unsplash.com/photos/a-foggy-field-with-a-lone-tree-in-the-distance-biWIhjjgSDM",
        },
      },
      {
        idStable: "6dgtnvk8ozk",
        url: "https://images.unsplash.com/photo-1599657074544-27a171fb4d3c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Z29sZGVuJTIwbW9ybmluZyUyMG1pc3R8ZW58MXwxfHx8MTc5MjMyNjgwMnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1599657074544-27a171fb4d3c?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8Z29sZGVuJTIwbW9ybmluZyUyMG1pc3R8ZW58MXwxfHx8MTc5MjMyNjgwMnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "green trees and mountains during sunset",
        credit: {
          name: "Frames For Your Heart",
          username: "framesforyourheart",
          profileUrl: "https://unsplash.com/@framesforyourheart",
          photoUrl: "https://unsplash.com/photos/green-trees-and-mountains-during-sunset-6DgtNvK8Ozk",
        },
      },
      {
        idStable: "nzlmckfh7ng",
        url: "https://images.unsplash.com/photo-1636861903715-f30a283fb068?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Z29sZGVuJTIwbW9ybmluZyUyMG1pc3R8ZW58MXwxfHx8MTc5MjMyNjgwMnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1636861903715-f30a283fb068?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8Z29sZGVuJTIwbW9ybmluZyUyMG1pc3R8ZW58MXwxfHx8MTc5MjMyNjgwMnww&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#26260c",
        alt: "the sun is shining through the trees in the park",
        credit: {
          name: "Stephanie Klepacki",
          username: "sklepacki",
          profileUrl: "https://unsplash.com/@sklepacki",
          photoUrl: "https://unsplash.com/photos/the-sun-is-shining-through-the-trees-in-the-park-NZlMckfh7Ng",
        },
      },
    ],
    "moss": [
      {
        idStable: "qswg0kjpqry",
        url: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlzdHklMjBmb3Jlc3QlMjBzYWdlfGVufDF8MXx8fDE3OTIzMjY4MDJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8bWlzdHklMjBmb3Jlc3QlMjBzYWdlfGVufDF8MXx8fDE3OTIzMjY4MDJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3d9f3",
        alt: "aerial photography of forest",
        credit: {
          name: "Filip Zrnzević",
          username: "filipz",
          profileUrl: "https://unsplash.com/@filipz",
          photoUrl: "https://unsplash.com/photos/aerial-photography-of-forest-QsWG0kjPQRY",
        },
      },
      {
        idStable: "y1qot82fd8k",
        url: "https://images.unsplash.com/photo-1444724334165-e7050f2229a1?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlzdHklMjBmb3Jlc3QlMjBzYWdlfGVufDF8MXx8fDE3OTIzMjY4MDJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1444724334165-e7050f2229a1?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8bWlzdHklMjBmb3Jlc3QlMjBzYWdlfGVufDF8MXx8fDE3OTIzMjY4MDJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#d9d9d9",
        alt: "forest covered with fogs",
        credit: {
          name: "Staffan Kjellvestad",
          username: "staffank",
          profileUrl: "https://unsplash.com/@staffank",
          photoUrl: "https://unsplash.com/photos/forest-covered-with-fogs-y1qOT82fd8k",
        },
      },
      {
        idStable: "igx2deud9lc",
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlzdHklMjBmb3Jlc3QlMjBzYWdlfGVufDF8MXx8fDE3OTIzMjY4MDJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8bWlzdHklMjBmb3Jlc3QlMjBzYWdlfGVufDF8MXx8fDE3OTIzMjY4MDJ8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "photo of pine trees",
        credit: {
          name: "Clément M.",
          username: "cmreflections",
          profileUrl: "https://unsplash.com/@cmreflections",
          photoUrl: "https://unsplash.com/photos/photo-of-pine-trees-igX2deuD9lc",
        },
      },
    ],
    "paper": [
      {
        idStable: "6ymzwamgzcg",
        url: "https://images.unsplash.com/photo-1519120944692-1a8d8cfc107f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cGFsZSUyMG1vcm5pbmclMjBmb2clMjBtaW5pbWFsfGVufDF8MXx8fDE3OTIzMjY4MDN8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1519120944692-1a8d8cfc107f?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8MXx8cGFsZSUyMG1vcm5pbmclMjBmb2clMjBtaW5pbWFsfGVufDF8MXx8fDE3OTIzMjY4MDN8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "a foggy landscape with trees in the distance",
        credit: {
          name: "Mads Schmidt Rasmussen",
          username: "mvds",
          profileUrl: "https://unsplash.com/@mvds",
          photoUrl: "https://unsplash.com/photos/a-foggy-landscape-with-trees-in-the-distance-6YmzwamGzCg",
        },
      },
      {
        idStable: "73nechmta6s",
        url: "https://images.unsplash.com/photo-1623100989250-27155460738b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cGFsZSUyMG1vcm5pbmclMjBmb2clMjBtaW5pbWFsfGVufDF8MXx8fDE3OTIzMjY4MDN8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1623100989250-27155460738b?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8Mnx8cGFsZSUyMG1vcm5pbmclMjBmb2clMjBtaW5pbWFsfGVufDF8MXx8fDE3OTIzMjY4MDN8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#a6c0c0",
        alt: "a black and white photo of rocks in the water",
        credit: {
          name: "Sasha Matic",
          username: "sashamatic",
          profileUrl: "https://unsplash.com/@sashamatic",
          photoUrl: "https://unsplash.com/photos/a-black-and-white-photo-of-rocks-in-the-water-73NEchmtA6s",
        },
      },
      {
        idStable: "ock-dlqf4zo",
        url: "https://images.unsplash.com/photo-1627678434579-3b4102d6d3a7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cGFsZSUyMG1vcm5pbmclMjBmb2clMjBtaW5pbWFsfGVufDF8MXx8fDE3OTIzMjY4MDN8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1080&q=72",
        thumbUrl: "https://images.unsplash.com/photo-1627678434579-3b4102d6d3a7?ixid=M3wxMTA1NjI2fDB8MXxzZWFyY2h8M3x8cGFsZSUyMG1vcm5pbmclMjBmb2clMjBtaW5pbWFsfGVufDF8MXx8fDE3OTIzMjY4MDN8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=320&q=60",
        dominant: "#f3f3f3",
        alt: "calm sea water during daytime",
        credit: {
          name: "Angela Leshchinskiy",
          username: "angelaleshch",
          profileUrl: "https://unsplash.com/@angelaleshch",
          photoUrl: "https://unsplash.com/photos/calm-sea-water-during-daytime-ocK-dlQf4Zo",
        },
      },
    ],
  },
};

/** Backdrops that have been through curation carry a photographer credit. */
export const CURATED = true;

export function poolFor(style, palette) {
  const byStyle = SEED_POOL[style];
  if (!byStyle) return [];
  return byStyle[palette] || byStyle['per-quote'] || [];
}

/**
 * Resolve the active backdrop for a (style, palette, photoId) triple.
 * Falls back to the first entry of the cell so a stale photoId left over
 * from a previous preset set can never blank the screen.
 */
export function resolveBackdrop(style, palette, photoId) {
  const pool = poolFor(style, palette);
  if (pool.length === 0) return null;
  if (photoId) {
    const hit = pool.find((p) => p.idStable === photoId);
    if (hit) return hit;
  }
  return pool[0];
}

export function treatmentFor(style) {
  return PHOTO_TREATMENTS[style] || PHOTO_TREATMENTS.ethereal;
}

/**
 * Resolve the tint to composite over the photo.
 *
 * @param {string} palette  active palette id
 * @param {'light'|'dark'} tone  resolved surface tone (see surfaceTone)
 */
export function tintFor(palette, tone) {
  if (tone === 'light') return PHOTO_TINTS.light;
  if (palette && palette !== 'per-quote' && PHOTO_TINTS[palette]) return PHOTO_TINTS[palette];
  return PHOTO_TINTS.dark;
}

/**
 * Coerce just the photo fields of a design object, preserving every other
 * key. Used when hydrating from localStorage and when applying a partial
 * update — it must NOT replace the object, or `style` / `palette` are
 * silently dropped and the app falls back to defaults.
 */
export function normalizePhotoPrefs(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...source,
    photoMode: source.photoMode === 'on' ? 'on' : 'off',
    photoId: typeof source.photoId === 'string' && source.photoId ? source.photoId : null,
  };
}
