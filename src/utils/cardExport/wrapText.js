/**
 * Word-wrap a string into lines whose rendered width does not exceed
 * `maxWidth`, measured using the actual font the export will use.
 *
 * We measure with a real DOM <span> rather than estimating glyph widths.
 * This guarantees the wrap points the editor's CSS-based wrap would have
 * chosen for the same container, because the browser is doing the
 * measurement with the same font the SVG rasterizer will use.
 *
 * Caller must have awaited `document.fonts.ready` first.
 */

let probe = null;

function getProbe() {
  if (probe) return probe;
  if (typeof document === 'undefined') {
    throw new Error('wrapText: requires a DOM (browser only)');
  }
  const el = document.createElement('span');
  el.setAttribute('aria-hidden', 'true');
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style.whiteSpace = 'nowrap';
  el.style.left = '-9999px';
  el.style.top = '0';
  document.body.appendChild(el);
  probe = el;
  return probe;
}

function measureWidth(text, style) {
  const el = getProbe();
  el.style.fontFamily = style.fontFamily;
  el.style.fontWeight = style.fontWeight;
  el.style.fontSize = style.fontSize;
  el.style.letterSpacing = style.letterSpacing || 'normal';
  el.textContent = text;
  return el.getBoundingClientRect().width;
}

/**
 * @param {string} text
 * @param {object} style - { fontFamily, fontWeight, fontSize, letterSpacing }
 * @param {number} maxWidth - pixels in the SVG's logical units
 * @returns {string[]} lines, each line is the original substring (whitespace preserved)
 */
export function wrapText(text, style, maxWidth) {
  if (!text) return [''];
  if (maxWidth <= 0) return [text];

  // Split on whitespace but preserve the separators so we can rejoin
  // without collapsing runs of spaces. Use a non-greedy split that
  // captures both the word and the gap.
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const lines = [];
  let current = '';

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      current += word;
      continue;
    }
    const tentative = current + word;
    if (measureWidth(tentative, style) <= maxWidth || current === '') {
      current = tentative;
    } else {
      lines.push(current.replace(/\s+$/, ''));
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
