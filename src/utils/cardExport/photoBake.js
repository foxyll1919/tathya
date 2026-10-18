/**
 * Backdrop bake — turns a remote photo into a self-contained, tinted,
 * scrimmed JPEG data URI that can be embedded in the exported SVG.
 *
 * Why this exists: `quoteCardToSvg` is rasterized through a blob: URL in
 * an isolated context, where a remote `<image href>` will not load. The
 * only reliable route is to fetch the bytes here and inline them.
 *
 * The treatment (tint blend, scrim gradient, filter, grain) is applied on
 * a canvas rather than via SVG `mix-blend-mode`, because blend support
 * inside an <img>-rendered SVG is not dependable across engines. Baking
 * here means the export is byte-identical to what the live preview shows,
 * and deterministic.
 *
 * Mirrors PHOTO_TREATMENTS / PHOTO_TINTS in src/design/photoPresets.js.
 */

import { treatmentFor } from '../../design/photoPresets';

const BAKE_QUALITY = 0.82;
/** Cached bakes, keyed by photo + style + palette + output size. */
const bakeCache = new Map();

let noisePatternCache = null;

function supportsCanvasFilter() {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.filter !== 'string') return false;
  ctx.filter = 'blur(1px)';
  return ctx.filter === 'blur(1px)';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // images.unsplash.com serves Access-Control-Allow-Origin: *, so this
    // does not taint the canvas — toDataURL stays legal.
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`photoBake: failed to load ${src}`));
    img.src = src;
  });
}

/** Parse `rgba(r, g, b, a)` / `#rgb` / `#rrggbb` into canvas-friendly parts. */
function parseColor(value, fallback = { r: 0, g: 0, b: 0, a: 1 }) {
  if (!value) return fallback;
  const text = String(value).trim();

  if (text.startsWith('#')) {
    let hex = text.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length >= 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    }
    return fallback;
  }

  const m = text.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    }
  }
  return fallback;
}

/** Build a 128px fractal-noise tile once; reused as a canvas pattern. */
function getNoisePattern(ctx) {
  if (noisePatternCache) return noisePatternCache;
  const size = 128;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  const image = tctx.createImageData(size, size);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  tctx.putImageData(image, 0, 0);
  noisePatternCache = ctx.createPattern(tile, 'repeat');
  return noisePatternCache;
}

/**
 * Bake the backdrop into a data URI.
 *
 * @param {object}  opts
 * @param {object}  opts.photo    entry from photoPresets (idStable, url)
 * @param {string}  opts.style    design style id
 * @param {object}  opts.tint     resolved tint from photoPresets.tintFor()
 * @param {number}  opts.width    output width in px
 * @param {number}  opts.height   output height in px
 * @returns {Promise<{dataUri:string,width:number,height:number}|null>}
 *          null when there is nothing to bake, or the browser lacks a
 *          2D canvas. Never throws for a network failure — callers treat
 *          a null result as "render the gradient background instead".
 */
export async function bakeBackdrop({ photo, style, tint, width, height }) {
  if (!photo?.url || typeof document === 'undefined' || !width || !height) return null;

  const key = `${photo.idStable}|${style}|${tint?.tint}|${width}x${height}|${BAKE_QUALITY}`;
  const cached = bakeCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const treatment = treatmentFor(style);
  if (!tint) return null;

  let img;
  try {
    img = await loadImage(photo.url);
  } catch {
    // Offline / blocked / 404 — degrade to the gradient rather than
    // failing the whole export.
    bakeCache.set(key, null);
    return null;
  }

  // --- Cover crop ---------------------------------------------------------
  // Expand past the frame so the CSS blur (and any rounding) cannot pull
  // transparent edges into the corners.
  const zoom = Math.max(treatment.scale, 1.02);
  const targetAspect = canvas.width / canvas.height;
  const srcAspect = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (srcAspect > targetAspect) {
    sw = img.naturalHeight * targetAspect;
  } else {
    sh = img.naturalWidth / targetAspect;
  }
  sw /= zoom;
  sh /= zoom;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Filter -------------------------------------------------------------
  if (supportsCanvasFilter()) {
    ctx.filter = [
      `saturate(${treatment.saturate})`,
      `contrast(${treatment.contrast})`,
      `brightness(${treatment.brightness})`,
      treatment.blur ? `blur(${treatment.blur}px)` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';

  // --- Palette tint -------------------------------------------------------
  const tintColor = parseColor(tint.tint);
  ctx.globalAlpha = 0.28;
  ctx.globalCompositeOperation = tint.tintBlend === 'screen' ? 'screen' : 'multiply';
  ctx.fillStyle = `rgb(${tintColor.r}, ${tintColor.g}, ${tintColor.b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // --- Scrim --------------------------------------------------------------
  // Mirrors the CSS gradient exactly: --photo-scrim-from held to 14%,
  // ramping to --photo-scrim-to by 42%, held to the bottom edge. The
  // hard ramp is what guarantees text contrast over an arbitrary photo.
  const from = parseColor(tint.scrimFrom, { r: 0, g: 0, b: 0, a: 0.42 });
  const to = parseColor(tint.scrimTo, { r: 0, g: 0, b: 0, a: 0.93 });
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, `rgba(${from.r}, ${from.g}, ${from.b}, ${from.a})`);
  grad.addColorStop(0.14, `rgba(${from.r}, ${from.g}, ${from.b}, ${from.a})`);
  grad.addColorStop(0.42, `rgba(${to.r}, ${to.g}, ${to.b}, ${to.a})`);
  grad.addColorStop(1, `rgba(${to.r}, ${to.g}, ${to.b}, ${to.a})`);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- Grain --------------------------------------------------------------
  if (treatment.grain > 0) {
    const pattern = getNoisePattern(ctx);
    if (pattern) {
      ctx.globalAlpha = treatment.grain;
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  let dataUri;
  try {
    dataUri = canvas.toDataURL('image/jpeg', BAKE_QUALITY);
  } catch {
    return null;
  }

  const result = { dataUri, width: canvas.width, height: canvas.height };
  // Bound the cache: bakes are ~200-500KB each as base64.
  if (bakeCache.size > 12) bakeCache.delete(bakeCache.keys().next().value);
  bakeCache.set(key, result);
  return result;
}

/** Test seam — clears memoized bakes and the noise tile. */
export function clearBakeCache() {
  bakeCache.clear();
  noisePatternCache = null;
}
