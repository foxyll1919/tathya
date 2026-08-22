/**
 * Embedded-font CSS for standalone SVG documents.
 *
 * An SVG rasterized via an <img> element runs in an isolated context:
 * the parent page's @font-face rules do NOT apply, and relative URLs
 * cannot resolve because blob: URLs are not hierarchical. The only
 * reliable way to get correct fonts in the exported PNG is to embed
 * the WOFF2 payloads as base64 data URIs inside the SVG itself.
 *
 * Files are fetched once and cached for the session — subsequent
 * exports reuse the same base64 strings.
 */

const FONT_FILES = [
  { family: 'Syne', weight: '700 800', url: '/fonts/Syne-700.woff2' },
  { family: 'Manrope', weight: '500 600', url: '/fonts/Manrope-500.woff2' },
  { family: 'Space Grotesk', weight: '500 700', url: '/fonts/SpaceGrotesk-500.woff2' },
];

let cachedCss = null;

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * @returns {Promise<string>} CSS string containing one @font-face rule
 * per family, with data-URI sources. Throws if any font file fails to
 * load — callers should surface that error rather than exporting a
 * wrong-font image.
 */
export async function getEmbeddedFontCss() {
  if (cachedCss) return cachedCss;

  const faces = await Promise.all(
    FONT_FILES.map(async (font) => {
      let res;
      try {
        res = await fetch(font.url, { cache: 'force-cache' });
      } catch (err) {
        throw new Error(`Font asset unreachable: ${font.url}`, { cause: err });
      }
      if (!res.ok) {
        throw new Error(`Font asset failed to load (${res.status}): ${font.url}`);
      }
      const buf = await res.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      return `@font-face{font-family:'${font.family}';font-style:normal;font-weight:${font.weight};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
    })
  );

  cachedCss = faces.join('');
  return cachedCss;
}
