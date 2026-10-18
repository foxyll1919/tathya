/**
 * Render a quote card as a self-contained SVG string.
 *
 * Inputs:
 *   cardState: { text, author, source, theme, tags }
 *   options:   { width, ratio (W/H), style (design style id),
 *                photo: { dataUri } | null,
 *                includeTags, includeSource, decorativeQuote, fontCss }
 *
 * The SVG is independent of the DOM — it can be serialized, downloaded
 * directly, or handed to a rasterizer. Typography comes from the design
 * style preset (src/design/presets.js) rather than from CSS, because
 * custom properties don't survive into the isolated SVG context.
 *
 * Text is word-wrapped using the same font the SVG will be rasterized
 * with, so line breaks match what the live preview chose.
 *
 * The function is synchronous, but the caller is responsible for
 * `await ensureExportFontsReady()` before calling — wrapText measures
 * with a real DOM <span> and needs the font loaded.
 */

import { getThemeTokens } from './themeTokens';
import { backgroundToPaint } from './gradientToSvg';
import { wrapText } from './wrapText';
import { getStyle } from '../../design/presets';

const FALLBACK_QUOTE_FONT = "'Syne', sans-serif";
const FALLBACK_ATTRIBUTION_FONT = "'Manrope', sans-serif";

function fontStack(family, fallback) {
  return family ? `'${family}', sans-serif` : fallback;
}

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
 * shrink/bump the preview's getQuoteFontSizeClass gives.
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
  // Preview uses a ~14px attribution on a ~220px card.
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
  // Preview uses a 40px quote-mark on a 180-220px card → ~18-22% of width.
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
    style = 'ethereal',
    photo = null,
    photoCredit = null,
    colors = null,
    fontCss = '',
  } = options;

  const { width: W, height: H } = dimensionsFor(width, ratio);
  const themePaint = getThemeTokens(theme);
  // `colors` is the resolved palette cascade (see cardColors.js). Without
  // it the card would paint quote-theme text on a palette-tinted surface.
  const tokens = colors
    ? { ...themePaint, text: colors.text, subtext: colors.subtext, accent: colors.accent }
    : themePaint;
  const paint = backgroundToPaint(tokens.background);
  const preset = getStyle(style);
  const type = preset.export;

  const quoteFont = fontStack(preset.quoteFamily, FALLBACK_QUOTE_FONT);
  const attributionFont = fontStack(preset.attributionFamily, FALLBACK_ATTRIBUTION_FONT);

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
  const qLh = qSize * type.quoteLeading;
  const aLh = aSize * 1.3;
  const sLh = sSize * 1.3;

  // ---- Wrap quote text -------------------------------------------------
  const quoteStyle = {
    fontFamily: quoteFont,
    fontWeight: text.length < 60 ? type.quoteWeightShort : text.length > 150 ? type.quoteWeightLong : type.quoteWeightShort,
    fontSize: `${qSize}px`,
    letterSpacing: type.quoteTracking,
  };
  const quoteLines = wrapText(text, quoteStyle, innerWidth);

  // ---- Vertical layout -------------------------------------------------
  // Anchor the block vertically centred as the preview does, with a
  // slight upward bias to leave room for the decoration at the top.
  const totalQuoteHeight = quoteLines.length * qLh;
  const dividerGap = qSize * 0.45;
  const authorGap = aSize * 0.35;
  const authorBlockHeight = aLh + (includeSource && source ? sLh + 4 : 0);
  const blockTop = innerTop + (innerBottom - innerTop - totalQuoteHeight - dividerGap - authorBlockHeight) / 2;

  // ---- Decorative quote mark -------------------------------------------
  const qmSize = quoteMarkSize(W);
  const qmTop = Math.max(innerTop - qmSize * 0.2, 0);
  const qmLeft = Math.max(innerLeft - qmSize * 0.1, 0);

  // ---- Build SVG -------------------------------------------------------
  const defParts = paint.def ? [paint.def] : [];
  const defs = () => (defParts.length ? `<defs>${defParts.join('')}</defs>` : '');

  const bgRect = `<rect x="0" y="0" width="${W}" height="${H}" fill="${paint.fill}"/>`;

  // Border + radius: 1rem @ 220 ≈ 9.7px in the preview → ~4.4% of width.
  const radius = Math.round(W * 0.04);
  // The export fills the whole canvas; the "card" is the canvas.
  // A subtle 1px hairline border at low alpha (matches the preview's
  // 1px solid rgba(255,255,255,0.12)).
  const borderStroke = tokens.text === '#1e201e' || tokens.text === '#1b1a16'
    ? 'rgba(30,32,30,0.18)'
    : 'rgba(255,255,255,0.12)';
  const border = `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${radius}" ry="${radius}" fill="none" stroke="${borderStroke}" stroke-width="1"/>`;

  // ---- Baked backdrop ---------------------------------------------------
  // Already tinted + scrimmed by photoBake.js, so this is a plain <image>
  // clipped to the card radius. Omitted entirely when the bake failed —
  // the gradient background then shows through, which is a valid card.
  let photoClipId = '';
  let photoEl = '';
  if (photo?.dataUri) {
    photoClipId = `tathya-photo-clip-${Math.round(W)}x${Math.round(H)}`;
    defParts.push(
      `<clipPath id="${photoClipId}"><rect x="0" y="0" width="${W}" height="${H}" rx="${radius}" ry="${radius}"/></clipPath>`
    );
    photoEl = `<image href="${escapeXml(photo.dataUri)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${photoClipId})"/>`;
  }

  // ---- Photo credit ------------------------------------------------------
  // Required by the Unsplash API guidelines: name the photographer and
  // link to the photo. Rendered small and quiet, above the tags.
  let creditEl = '';
  if (photoCredit) {
    const cSize = Math.max(W * 0.016, 11);
    const cY = innerBottom - cSize * 0.4;
    const cText = `${photoCredit.text} · Unsplash`;
    creditEl = `<text x="${innerRight}" y="${cY}" text-anchor="end" font-family="${attributionFont}" font-size="${cSize.toFixed(2)}" font-weight="500" fill="${tokens.subtext}" fill-opacity="0.72">${escapeXml(cText)}</text>`;
  }

  const decoration = decorativeQuote
    ? `<text x="${qmLeft}" y="${qmTop + qmSize * 0.75}" font-family="${quoteFont}" font-size="${qmSize}" font-weight="${type.quoteWeightShort}" fill="${tokens.text}" fill-opacity="0.12" style="line-height:1">&#x201C;</text>`
    : '';

  // Quote text — one <text> with multiple <tspan>s, positioned absolutely.
  // `dy` advances each line by qLh.
  const quoteTspans = quoteLines
    .map((line, i) => {
      const dy = i === 0 ? 0 : qLh;
      return `<tspan x="${innerLeft}" dy="${dy.toFixed(2)}">${escapeXml(line)}</tspan>`;
    })
    .join('');
  const quoteText = `<text x="${innerLeft}" y="${blockTop.toFixed(2)}" font-family="${quoteFont}" font-size="${qSize.toFixed(2)}" font-weight="${quoteStyle.fontWeight}" fill="${tokens.text}" letter-spacing="${emToPx(qSize, type.quoteTracking)}">${quoteTspans}</text>`;

  // Author block — the preview uppercases via CSS text-transform, which is
  // unreliable in isolated SVG rendering contexts, so we do it in JS.
  const transform = (value) =>
    type.attributionTransform === 'uppercase' ? String(value).toUpperCase() : String(value);
  const authorTracking = emToPx(aSize, type.attributionTracking);

  // Author names are arbitrary user input — fit them to the card instead
  // of letting them run off the right edge.
  const fittedAuthor = fitSingleLine(
    transform(author || 'Anonymous'),
    {
      fontFamily: attributionFont,
      fontSize: aSize,
      fontWeight: type.attributionWeight,
      letterSpacing: `${authorTracking}px`,
    },
    innerWidth,
    aSize * 0.62
  );

  const dividerY = (blockTop + totalQuoteHeight + dividerGap).toFixed(2);
  const authorY = (parseFloat(dividerY) + authorGap).toFixed(2);
  const authorEl = `<text x="${innerLeft}" y="${authorY}" font-family="${attributionFont}" font-size="${fittedAuthor.size.toFixed(2)}" font-weight="${type.attributionWeight}" fill="${tokens.text}" fill-opacity="0.9" letter-spacing="${authorTracking}">${escapeXml(fittedAuthor.text)}</text>`;

  let sourceEl = '';
  if (includeSource && source) {
    const sourceY = (parseFloat(authorY) + aLh).toFixed(2);
    const fittedSource = fitSingleLine(
      transform(source),
      {
        fontFamily: attributionFont,
        fontSize: sSize,
        fontWeight: type.attributionWeight,
        letterSpacing: `${emToPx(sSize, type.attributionTracking)}px`,
      },
      innerWidth,
      sSize * 0.62
    );
    sourceEl = `<text x="${innerLeft}" y="${sourceY}" font-family="${attributionFont}" font-size="${fittedSource.size.toFixed(2)}" font-weight="${type.attributionWeight}" fill="${tokens.subtext}" letter-spacing="${emToPx(sSize, type.attributionTracking)}">${escapeXml(fittedSource.text)}</text>`;
  }

  // Tags rendered along the bottom edge, label-caps style.
  let tagsEl = '';
  if (includeTags && Array.isArray(cardState.tags) && cardState.tags.length > 0) {
    const tagFontSize = Math.max(W * 0.022, 14);
    const tagPadX = tagFontSize * 0.7;
    const tagPadY = tagFontSize * 0.32;
    const tagGap = tagFontSize * 0.5;
    // Lift the tag row clear of the photo credit line when one is present.
    const creditSpace = photoCredit ? Math.max(W * 0.016, 11) * 2.2 : 0;
    const tagY = (innerBottom - tagFontSize - tagPadY - creditSpace).toFixed(2);
    let cursorX = innerLeft;
    const tagParts = [];
    for (const tag of cardState.tags) {
      const label = `#${String(tag).toUpperCase()}`;
      // Measure tag width using the live DOM probe so it lines up with
      // the rasterized text.
      const w = measureTagWidth(label, tagFontSize, attributionFont);
      if (cursorX + w + tagPadX * 2 > innerRight) break;
      tagParts.push(
        `<g><rect x="${cursorX.toFixed(2)}" y="${tagY}" width="${(w + tagPadX * 2).toFixed(2)}" height="${(tagFontSize + tagPadY * 2).toFixed(2)}" rx="${(tagFontSize * 0.6).toFixed(2)}" fill="${tokens.chipBackground}" stroke="${tokens.subtext}" stroke-opacity="0.4"/>` +
          `<text x="${(cursorX + tagPadX).toFixed(2)}" y="${(parseFloat(tagY) + tagFontSize + tagPadY * 0.6).toFixed(2)}" font-family="${attributionFont}" font-size="${tagFontSize.toFixed(2)}" font-weight="700" fill="${tokens.text}" fill-opacity="0.85" letter-spacing="${emToPx(tagFontSize, '0.05em')}">${escapeXml(label)}</text></g>`
      );
      cursorX += w + tagPadX * 2 + tagGap;
    }
    tagsEl = tagParts.join('');
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    fontCss ? `<style><![CDATA[${fontCss}]]></style>` : '',
    defs(),
    bgRect,
    photoEl,
    border,
    decoration,
    quoteText,
    authorEl,
    sourceEl,
    tagsEl,
    creditEl,
    `</svg>`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** CSS `em` tracking → absolute user units for an SVG `letter-spacing`. */
function emToPx(fontSize, emValue) {
  const em = parseFloat(emValue);
  if (!Number.isFinite(em)) return 0;
  return (em * fontSize).toFixed(3);
}

function measureTagWidth(text, fontSize, fontFamily) {
  return measureTextWidth(text, {
    fontFamily,
    fontSize,
    fontWeight: '700',
    letterSpacing: '0.05em',
  });
}

/**
 * DOM-measured text width. Used to lay out tags and to keep the author /
 * source lines inside the card. Requires the font to already be loaded
 * (the caller awaits ensureExportFontsReady first).
 */
function measureTextWidth(text, { fontFamily, fontSize, fontWeight, letterSpacing }) {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.whiteSpace = 'nowrap';
  probe.style.fontFamily = fontFamily;
  probe.style.fontSize = `${fontSize}px`;
  probe.style.fontWeight = fontWeight;
  probe.style.letterSpacing = letterSpacing;
  probe.textContent = text;
  document.body.appendChild(probe);
  const w = probe.getBoundingClientRect().width;
  document.body.removeChild(probe);
  return w;
}

/**
 * Fit a single-line string into `maxWidth` by shrinking it toward
 * `minSize`, then truncating with an ellipsis if shrinking is not
 * enough. Author names are user input and will overflow the card
 * otherwise ("ANTOINE DE SAINT-EXUPÉRY" at 1rem tracking).
 */
function fitSingleLine(text, { fontFamily, fontSize, fontWeight, letterSpacing }, maxWidth, minSize) {
  let size = fontSize;
  let out = text;
  let width = measureTextWidth(out, { fontFamily, fontSize: size, fontWeight, letterSpacing });
  while (width > maxWidth && size > minSize) {
    size = Math.max(minSize, size * 0.94);
    width = measureTextWidth(out, { fontFamily, fontSize: size, fontWeight, letterSpacing });
  }
  if (width > maxWidth && out.length > 4) {
    while (out.length > 4) {
      out = out.slice(0, -1);
      if (measureTextWidth(`${out}…`, { fontFamily, fontSize: size, fontWeight, letterSpacing }) <= maxWidth) {
        out = `${out}…`;
        break;
      }
    }
  }
  return { text: out, size };
}