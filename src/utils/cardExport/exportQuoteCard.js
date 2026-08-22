/**
 * Public export API.
 *
 * Replaces the previous html-to-image based implementation. Same shape
 * as the legacy `exportCard.js` so callers (ShareSheet) can swap
 * imports with a one-line change.
 *
 * Pipeline:
 *   card state (the same object the live editor receives)
 *     -> quoteCardToSvg (uses themeTokens + gradientToSvg + wrapText)
 *     -> svgStringToPng (Image + Canvas, browser-native)
 *     -> Blob / download
 *
 * No screenshot of the live DOM. No external font request during export
 * (the SVG carries inline @font-face rules that reference the same
 * /fonts/*.woff2 files the editor already loaded).
 */

import { quoteCardToSvg, dimensionsFor } from './quoteCardToSvg';
import { svgStringToPng } from './svgToPng';
import { getEmbeddedFontCss } from './fontEmbed';

const DEFAULT_RATIO = '1/1';
const DEFAULT_LONG_EDGE = 1080;
const REQUIRED_FONTS = [
  { family: 'Syne', weight: '700' },
  { family: 'Manrope', weight: '500' },
  { family: 'Space Grotesk', weight: '500' },
];

/**
 * Wait for the fonts the export will need. Safe to call repeatedly —
 * resolves immediately once all fonts are already loaded.
 */
export async function ensureExportFontsReady() {
  if (typeof document === 'undefined' || !document.fonts) return;
  await document.fonts.ready;
  // Defensive: document.fonts.ready resolves when *any* load settles,
  // not necessarily the ones we care about. Explicitly await each
  // font we depend on so a race in font load order can't produce a
  // wrong-font PNG.
  await Promise.all(
    REQUIRED_FONTS.map((f) =>
      document.fonts.load(`${f.weight} 32px "${f.family}"`).catch(() => null)
    )
  );
}

/**
 * Generate a PNG blob of the given quote at the requested dimensions.
 *
 * @param {object} card - { text, author, source, theme, tags, ... }
 * @param {object} options - { ratio, width, height, includeTags, includeSource, decorativeQuote }
 * @returns {Promise<Blob>} PNG blob
 */
export async function renderQuoteCardPng(card, options = {}) {
  const ratio = options.ratio || DEFAULT_RATIO;
  const longEdge = options.width || options.height || DEFAULT_LONG_EDGE;

  // Fonts must be loaded in the live document before wrapText measures,
  // and the embedded @font-face data must be fetched for the SVG itself.
  await ensureExportFontsReady();
  const fontCss = await getEmbeddedFontCss();

  const logical = dimensionsFor(longEdge, ratio);
  const svg = quoteCardToSvg(card, {
    width: logical.width,
    ratio,
    includeTags: options.includeTags,
    includeSource: options.includeSource,
    decorativeQuote: options.decorativeQuote,
    fontCss,
  });

  // Honor explicit pixel overrides. If both width and height are
  // supplied, use them; otherwise default to the logical viewBox size
  // (which is already high resolution for typical exports).
  const pixelTarget = {};
  if (options.width && options.height) {
    pixelTarget.width = options.width;
    pixelTarget.height = options.height;
  } else if (options.width) {
    pixelTarget.width = options.width;
  } else if (options.height) {
    pixelTarget.height = options.height;
  }

  return svgStringToPng(svg, pixelTarget);
}

/** Generate the raw SVG string for the card. */
export function renderQuoteCardSvg(card, options = {}) {
  const ratio = options.ratio || DEFAULT_RATIO;
  const longEdge = options.width || options.height || DEFAULT_LONG_EDGE;
  const logical = dimensionsFor(longEdge, ratio);
  return quoteCardToSvg(card, {
    width: logical.width,
    ratio,
    includeTags: options.includeTags,
    includeSource: options.includeSource,
    decorativeQuote: options.decorativeQuote,
  });
}

/** Download the rendered card as a PNG file. */
export async function downloadCardPng(card, fileName = 'tathya-quote.png', options = {}) {
  if (!card) throw new Error('downloadCardPng: card is required');
  const blob = await renderQuoteCardPng(card, options);
  triggerDownload(blob, fileName);
  return blob;
}

/** Return a File object suitable for navigator.share / canShare. */
export async function getCardFile(card, fileName = 'tathya-quote.png', options = {}) {
  if (!card) throw new Error('getCardFile: card is required');
  const blob = await renderQuoteCardPng(card, options);
  return new File([blob], fileName, { type: 'image/png' });
}

/** Download the rendered card as a standalone .svg file. */
export function downloadCardSvg(card, fileName = 'tathya-quote.svg', options = {}) {
  if (!card) throw new Error('downloadCardSvg: card is required');
  const svg = renderQuoteCardSvg(card, options);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, fileName);
  return svg;
}

function triggerDownload(blob, fileName) {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
