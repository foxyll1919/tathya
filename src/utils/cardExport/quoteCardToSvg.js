/**
 * Render a quote card as a self-contained SVG string.
 *
 * Inputs:
 *   cardState: { text, author, source, theme, tags }
 *   options:   { width, ratio (W/H), fontFamily (default: 'Syne'),
 *                includeTags, includeSource, decorativeQuote }
 *
 * The SVG is independent of the DOM — it can be serialized, downloaded
 * directly, or handed to a rasterizer. The font is resolved at
 * rasterization time from the @font-face declarations in src/fonts.css;
 * we do not embed font data into the SVG itself (same-origin browser
 * rasterization handles this).
 *
 * Text is word-wrapped using the same font the SVG will be rasterized
 * with, so line breaks match what the live editor would have chosen.
 *
 * The function is synchronous, but the caller is responsible for
 * `await document.fonts.ready` before calling — wrapText measures
 * with a real DOM <span> and needs the font loaded.
 */

import { getThemeTokens } from './themeTokens';
import { backgroundToPaint } from './gradientToSvg';
import { wrapText } from './wrapText';

const FONT_FAMILY_QUOTE = "'Syne', sans-serif";
const FONT_FAMILY_ATTRIBUTION = "'Manrope', sans-serif";

/**
 * Resolve a width/height pair from a long-edge width and an aspect
 * ratio expressed as "W/H".
 */
export function dimensionsFor(width, ratio) {
  const [rw, rh] = String(ratio).split('/').map((n) => parseFloat(n));
  if (!rw || !rh) {
    return { width, height: width };
  }
  return { width, height: Math.round((width * rh) / rw) };
}

/**
 * Quote font size, in SVG user units, matching the live preview's
 * percent-of-card-width approach. Long and short text get the same
 * shrink/bump the editor's getQuoteFontSizeClass gives.
 */
function quoteFontSize({ width, ratio, text }) {
  // Base ratio is the per-card-size base used by ShareSheet.
  const basePct =
    ratio === '9/16' ? 13 / 180 : ratio === '16/9' ? 11 / 300 : 14 / 220;
  let size = width * basePct;
  const len = (text || '').length;
  if (len < 60) size *= 1.27; // quote-display
  else if (len > 150) size *= 0.73; // quote-md
  return size;
}

function attributionFontSize(width) {
  // Editor uses .attribution = 14px at mobile (default 220-ish card).
  return Math.max(width * 0.055, 12);
}

function sourceFontSize(width) {
  return Math.max(width * 0.04, 9);
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function quoteMarkSize(width) {
  // Preview uses 40px quote-mark @ 180-220px card → ~18-22% of card width.
  return Math.round(width * 0.21);
}

function padding(width) {
  return Math.round(width * 0.08);
}

export function quoteCardToSvg(cardState, options = {}) {
  const {
    text = '',
    author = '',
    source = '',
    theme = 'charcoal-solid',
  } = cardState || {};
  const {
    width = 1080,
    ratio = '1/1',
    includeTags = true,
    includeSource = true,
    decorativeQuote = true,
    fontCss = '',
  } = options;

  const { width: W, height: H } = dimensionsFor(width, ratio);
  const tokens = getThemeTokens(theme);
  const paint = backgroundToPaint(tokens.background);

  const pad = padding(W);
  const innerLeft = pad;
  const innerRight = W - pad;
  const innerWidth = innerRight - innerLeft;
  const innerTop = pad;
  const innerBottom = H - pad;

  // ---- Type metrics ----------------------------------------------------
  const qSize = quoteFontSize({ width: W, ratio, text });
  const aSize = attributionFontSize(W);
  const sSize = sourceFontSize(W);
  const qLh = qSize * 1.18; // line-height 1.18 mirrors the editor's 1.2
  const aLh = aSize * 1.3;
  const sLh = sSize * 1.3;

  // ---- Wrap quote text -------------------------------------------------
  const quoteStyle = {
    fontFamily: FONT_FAMILY_QUOTE,
    fontWeight: text.length < 60 ? 800 : text.length > 150 ? 600 : 700,
    fontSize: `${qSize}px`,
    letterSpacing: '-0.02em',
  };
  const quoteLines = wrapText(text, quoteStyle, innerWidth);

  // ---- Vertical layout -------------------------------------------------
  // Anchor the block vertically centered as the preview does, but with a
  // slight upward bias to leave room for the decoration at the top.
  const totalQuoteHeight = quoteLines.length * qLh;
  const dividerGap = qSize * 0.45;
  const dividerH = Math.max(2, Math.round(W * 0.006));
  const authorGap = aSize * 0.35;
  const authorBlockHeight = aLh + (includeSource && source ? sLh + 4 : 0);
  const blockTop = innerTop + (innerBottom - innerTop - totalQuoteHeight - dividerGap - dividerH - authorBlockHeight) / 2;

  // ---- Decorative quote mark -------------------------------------------
  const qmSize = quoteMarkSize(W);
  const qmTop = Math.max(innerTop - qmSize * 0.2, 0);
  const qmLeft = Math.max(innerLeft - qmSize * 0.1, 0);

  // ---- Build SVG -------------------------------------------------------
  const defs = paint.def
    ? `<defs>${paint.def}</defs>`
    : '';

  const bgRect = `<rect x="0" y="0" width="${W}" height="${H}" fill="${paint.fill}"/>`;

  // Border + radius: 1rem @ 220 ≈ 9.7px in editor → ~4.4% of card width.
  const radius = Math.round(W * 0.04);
  // The export fills the whole canvas; the "card" is the canvas.
  // A subtle 1px hairline border at low alpha (matches the editor's
  // 1px solid rgba(255,255,255,0.12) on the share-sheet preview).
  const borderStroke = tokens.text === '#1e201e'
    ? 'rgba(30,32,30,0.18)'
    : 'rgba(255,255,255,0.12)';
  const border = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${radius}" ry="${radius}" fill="none" stroke="${borderStroke}" stroke-width="1"/>`;

  const decoration = decorativeQuote
    ? `<text x="${qmLeft}" y="${qmTop + qmSize * 0.75}" font-family="${FONT_FAMILY_QUOTE}" font-size="${qmSize}" font-weight="800" fill="${tokens.text}" fill-opacity="0.08" style="line-height:1">&#x201C;</text>`
    : '';

  // Quote text — one <text> with multiple <tspan>s, positioned absolutely.
  // We use `dominant-baseline="hanging"` so y is the top of the line, then
  // advance each tspan by qLh via dy.
  const quoteTspans = quoteLines
    .map((line, i) => {
      const dy = i === 0 ? 0 : qLh;
      return `<tspan x="${innerLeft}" dy="${dy.toFixed(2)}">${escapeXml(line)}</tspan>`;
    })
    .join('');
  const quoteText = `<text x="${innerLeft}" y="${blockTop.toFixed(2)}" font-family="${FONT_FAMILY_QUOTE}" font-size="${qSize.toFixed(2)}" font-weight="${quoteStyle.fontWeight}" fill="${tokens.text}" style="white-space:pre">${quoteTspans}</text>`;

  // Author block — uppercase applied in JS (matches .attribution's
  // text-transform:uppercase; CSS transforms are unreliable in
  // isolated SVG rendering contexts).
  const dividerY = (blockTop + totalQuoteHeight + dividerGap).toFixed(2);
  const authorY = (parseFloat(dividerY) + dividerH + authorGap).toFixed(2);
  const authorEl = `<text x="${innerLeft}" y="${authorY}" font-family="${FONT_FAMILY_ATTRIBUTION}" font-size="${aSize.toFixed(2)}" font-weight="500" fill="${tokens.text}" fill-opacity="0.9" letter-spacing="${(aSize * 0.05).toFixed(2)}">${escapeXml(String(author || 'Anonymous').toUpperCase())}</text>`;

  // Accent dash — inline with the author, hanging in the left gutter.
  // All geometry derives from the author layout (baseline authorY at
  // x = innerLeft), so it scales with every aspect ratio and resolution.
  const capHeight = aSize * 0.72;
  const dashGap = authorGap;
  const dashW = Math.round(aSize * 0.9);
  const dashX = (innerLeft - dashGap - dashW).toFixed(2);
  const dashY = (parseFloat(authorY) - capHeight / 2 - dividerH / 2).toFixed(2);
  const divider = `<rect x="${dashX}" y="${dashY}" width="${dashW}" height="${dividerH}" fill="${tokens.accent}" fill-opacity="0.8"/>`;

  let sourceEl = '';
  if (includeSource && source) {
    const sourceY = (parseFloat(authorY) + aLh).toFixed(2);
    sourceEl = `<text x="${innerLeft}" y="${sourceY}" font-family="${FONT_FAMILY_ATTRIBUTION}" font-size="${sSize.toFixed(2)}" font-weight="500" fill="${tokens.subtext}" letter-spacing="${(sSize * 0.05).toFixed(2)}">${escapeXml(String(source).toUpperCase())}</text>`;
  }

  // Tags rendered along the bottom edge, label-caps style.
  let tagsEl = '';
  if (includeTags && Array.isArray(cardState.tags) && cardState.tags.length > 0) {
    const tagFontSize = Math.max(W * 0.022, 14);
    const tagPadX = tagFontSize * 0.7;
    const tagPadY = tagFontSize * 0.32;
    const tagGap = tagFontSize * 0.5;
    const tagY = (innerBottom - tagFontSize - tagPadY).toFixed(2);
    let cursorX = innerLeft;
    const tagParts = [];
    for (const tag of cardState.tags) {
      const label = `#${String(tag).toUpperCase()}`;
      // Measure tag width using the live DOM probe so it lines up with
      // the rasterized text.
      const w = measureTagWidth(label, tagFontSize);
      if (cursorX + w + tagPadX * 2 > innerRight) break;
      tagParts.push(
        `<g><rect x="${cursorX.toFixed(2)}" y="${tagY}" width="${(w + tagPadX * 2).toFixed(2)}" height="${(tagFontSize + tagPadY * 2).toFixed(2)}" rx="${(tagFontSize * 0.6).toFixed(2)}" fill="${tokens.chipBackground}" stroke="${tokens.subtext}" stroke-opacity="0.4"/>` +
          `<text x="${(cursorX + tagPadX).toFixed(2)}" y="${(parseFloat(tagY) + tagFontSize + tagPadY * 0.6).toFixed(2)}" font-family="${FONT_FAMILY_ATTRIBUTION}" font-size="${tagFontSize.toFixed(2)}" font-weight="700" fill="${tokens.text}" fill-opacity="0.85" letter-spacing="0.05em">${escapeXml(label)}</text></g>`
      );
      cursorX += w + tagPadX * 2 + tagGap;
    }
    tagsEl = tagParts.join('');
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    fontCss ? `<style><![CDATA[${fontCss}]]></style>` : '',
    defs,
    bgRect,
    border,
    decoration,
    quoteText,
    divider,
    authorEl,
    sourceEl,
    tagsEl,
    `</svg>`,
  ]
    .filter(Boolean)
    .join('\n');
}

function measureTagWidth(text, fontSize) {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.whiteSpace = 'nowrap';
  probe.style.fontFamily = FONT_FAMILY_ATTRIBUTION;
  probe.style.fontSize = `${fontSize}px`;
  probe.style.fontWeight = '700';
  probe.style.letterSpacing = '0.05em';
  probe.textContent = text;
  document.body.appendChild(probe);
  const w = probe.getBoundingClientRect().width;
  document.body.removeChild(probe);
  return w;
}
