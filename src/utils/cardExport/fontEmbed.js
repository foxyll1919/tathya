/**
 * Embedded-font CSS for standalone SVG documents.
 *
 * An SVG rasterized via an <img> element runs in an isolated context:
 * the parent page's @font-face rules do NOT apply, and relative URLs
 * cannot resolve because blob: URLs are not hierarchical. The only
 * reliable way to get correct fonts in the exported PNG is to embed
 * the WOFF2 payloads as base64 data URIs inside the SVG itself.
 *
 * Only the faces the active design style actually needs are embedded —
 * pulling every family would add ~150 KB of base64 to every export.
 *
 * Payloads are cached per family for the session; a style change fetches
 * only the newly-required files.
 */

/** family -> [{ weight, url }] — mirrors src/fonts.css. */
export const FONT_FILES = {
  Syne: [{ weight: '700 800', url: '/fonts/Syne-700.woff2' }],
  Manrope: [{ weight: '500 600', url: '/fonts/Manrope-500.woff2' }],
  'Space Grotesk': [{ weight: '500 700', url: '/fonts/SpaceGrotesk-500.woff2' }],
  'Space Mono': [
    { weight: '400', url: '/fonts/SpaceMono-400.woff2' },
    { weight: '700', url: '/fonts/SpaceMono-700.woff2' },
  ],
  UnifrakturMaguntia: [{ weight: '400', url: '/fonts/UnifrakturMaguntia-400.woff2' }],
  Cinzel: [
    { weight: '400', url: '/fonts/Cinzel-400.woff2' },
    { weight: '600', url: '/fonts/Cinzel-600.woff2' },
  ],
  Jost: [
    { weight: '400', url: '/fonts/Jost-400.woff2' },
    { weight: '600', url: '/fonts/Jost-600.woff2' },
  ],
  Marcellus: [{ weight: '400', url: '/fonts/Marcellus-400.woff2' }],
  Caveat: [
    { weight: '400', url: '/fonts/Caveat-400.woff2' },
    { weight: '600', url: '/fonts/Caveat-600.woff2' },
  ],
  'Cormorant Garamond': [
    { weight: '300', url: '/fonts/CormorantGaramond-300.woff2' },
    { weight: '500', url: '/fonts/CormorantGaramond-500.woff2' },
    { weight: '600', url: '/fonts/CormorantGaramond-600.woff2' },
  ],
};

const faceCache = new Map();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadFace(font) {
  const cached = faceCache.get(font.url);
  if (cached) return cached;

  const promise = (async () => {
    let res;
    try {
      res = await fetch(font.url, { cache: 'force-cache' });
    } catch (err) {
      throw new Error(`Font asset unreachable: ${font.url}`, { cause: err });
    }
    if (!res.ok) {
      throw new Error(`Font asset failed to load (${res.status}): ${font.url}`);
    }
    const b64 = arrayBufferToBase64(await res.arrayBuffer());
    return `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${font.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  })();

  faceCache.set(font.url, promise);
  try {
    return await promise;
  } catch (err) {
    faceCache.delete(font.url);
    throw err;
  }
}

/**
 * Resolve the concrete faces for a list of `{ family, weight }` requests,
 * matching each against FONT_FILES. Unknown families are skipped rather
 * than throwing — the SVG still renders with a fallback face.
 *
 * @returns {string} CSS string with one @font-face rule per matched file.
 * @throws if a matched font file fails to load — callers should surface
 *         that error rather than exporting a wrong-font image.
 */
export async function getEmbeddedFontCss(requests = []) {
  const seen = new Set();
  const faces = [];

  for (const request of requests) {
    const candidates = FONT_FILES[request.family];
    if (!candidates) continue;
    for (const font of candidates) {
      if (seen.has(font.url)) continue;
      seen.add(font.url);
      faces.push(loadFace({ ...font, family: request.family }));
    }
  }

  if (faces.length === 0) return '';
  return (await Promise.all(faces)).join('');
}