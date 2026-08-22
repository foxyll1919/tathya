/**
 * Rasterize an SVG string to a PNG blob at a target output resolution.
 *
 * Flow:
 *   SVG string
 *     -> Blob (image/svg+xml)
 *     -> ObjectURL
 *     -> HTMLImageElement (decoded by the browser, fonts resolved
 *        against the SVG's inline <style>)
 *     -> Canvas at the requested pixel size
 *     -> canvas.toBlob('image/png')
 *
 * The SVG's viewBox is the logical card dimensions; the canvas pixel
 * size is the requested output size. They are independent: callers can
 * render a 1080x1080 logical card at 2160x2160 pixels (2x) without
 * upscaling an already-rasterized image.
 */

export async function svgStringToPng(svg, options = {}) {
  const { width, height, backgroundColor } = options;
  if (typeof document === 'undefined') {
    throw new Error('svgToPng: browser DOM required');
  }

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const intrinsic = pickOutputSize(img, width, height);

    const canvas = document.createElement('canvas');
    canvas.width = intrinsic.width;
    canvas.height = intrinsic.height;

    if (backgroundColor) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, intrinsic.width, intrinsic.height);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('svgToPng: 2D canvas context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, intrinsic.width, intrinsic.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('svgToPng: canvas.toBlob returned null'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`svgToPng: failed to load ${src}`));
    img.src = src;
  });
}

function pickOutputSize(img, requestedW, requestedH) {
  // If caller specified a target size, honor it. Otherwise fall back
  // to the SVG's intrinsic size (which we set from viewBox / width /
  // height in the renderer).
  if (requestedW && requestedH) {
    return { width: Math.round(requestedW), height: Math.round(requestedH) };
  }
  if (requestedW) {
    const ratio = img.naturalHeight / img.naturalWidth;
    return { width: Math.round(requestedW), height: Math.round(requestedW * ratio) };
  }
  if (requestedH) {
    const ratio = img.naturalWidth / img.naturalHeight;
    return { width: Math.round(requestedH * ratio), height: Math.round(requestedH) };
  }
  return { width: img.naturalWidth || 1080, height: img.naturalHeight || 1080 };
}
