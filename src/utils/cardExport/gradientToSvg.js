/**
 * Parse a CSS linear-gradient() value into an SVG <linearGradient> def.
 *
 * Handles the shape used by the Tathya theme tokens:
 *   linear-gradient(185deg, #aaa 0%, #bbb 50%, #ccc 100%)
 *
 * Returns:
 *   { id, def: '<linearGradient>...</linearGradient>', fill: 'url(#id)' }
 *
 * Or, if the value is a solid color, returns:
 *   { id: null, def: '', fill: '#xxxxxx' }
 *
 * The conversion respects CSS angle semantics: 0deg points up, angles
 * increase clockwise. SVG x1/y1/x2/y2 are mapped in objectBoundingBox
 * space so the rendered result matches what the browser would draw.
 */

const LINEAR_RE = /^linear-gradient\(\s*([^,]+),\s*(.+)\)$/i;
const STOP_RE = /(#[0-9a-f]{3,8}|rgba?\([^)]+\)|[a-z]+)\s*(\d+(?:\.\d+)?%?)?/gi;

function parseAngle(input) {
  const s = String(input).trim().toLowerCase();
  if (s.endsWith('deg')) return parseFloat(s);
  if (s === 'to top') return 0;
  if (s === 'to right') return 90;
  if (s === 'to bottom') return 180;
  if (s === 'to left') return 270;
  return 180;
}

function parseStops(rest) {
  const stops = [];
  let match;
  STOP_RE.lastIndex = 0;
  while ((match = STOP_RE.exec(rest)) !== null) {
    const color = match[1];
    const raw = match[2];
    let offset = 0;
    if (raw !== undefined) {
      offset = parseFloat(raw);
      if (!raw.endsWith('%')) offset = (offset / 255) * 100; // treat 0..255 as percent
    } else if (stops.length === 0) {
      offset = 0;
    } else {
      offset = null; // evenly distribute below
    }
    stops.push({ color, offset });
  }

  // Fill in null offsets with even distribution between known points.
  let i = 0;
  while (i < stops.length) {
    if (stops[i].offset === null) {
      let j = i;
      while (j < stops.length && stops[j].offset === null) j++;
      const prev = i === 0 ? { offset: 0 } : stops[i - 1];
      const next = j === stops.length ? { offset: 100 } : stops[j];
      const span = next.offset - prev.offset;
      const slots = j - i + 1;
      for (let k = i; k < j; k++) {
        stops[k].offset = prev.offset + (span * (k - i + 1)) / slots;
      }
      i = j;
    } else {
      i++;
    }
  }
  return stops;
}

function angleToEndpoints(angleDeg) {
  // CSS: 0deg = up, increases clockwise.
  // SVG: x1/y1/x2/y2 in objectBoundingBox units (0..1).
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  // CSS gradient line spans the gradient box; SVG default spans the
  // entire object bounding box. Using (0.5 ± 0.5*dx, 0.5 ± 0.5*dy)
  // gives a line that starts at one box edge and ends at the opposite.
  return {
    x1: 0.5 - 0.5 * dx,
    y1: 0.5 - 0.5 * dy,
    x2: 0.5 + 0.5 * dx,
    y2: 0.5 + 0.5 * dy,
  };
}

let gradientCounter = 0;
function nextId() {
  gradientCounter += 1;
  return `tathya-grad-${gradientCounter}`;
}

export function backgroundToPaint(value, opts = {}) {
  if (!value) return { id: null, def: '', fill: '#121412' };
  const trimmed = String(value).trim();

  if (!trimmed.startsWith('linear-gradient')) {
    // Treat as solid color. Caller is responsible for any value validation.
    return { id: null, def: '', fill: trimmed };
  }

  const m = trimmed.match(LINEAR_RE);
  if (!m) {
    return { id: null, def: '', fill: trimmed };
  }

  const angle = parseAngle(m[1]);
  const stops = parseStops(m[2]);
  const id = opts.id || nextId();
  const { x1, y1, x2, y2 } = angleToEndpoints(angle);

  const stopTags = stops
    .map(
      (s) =>
        `<stop offset="${(s.offset / 100).toFixed(4)}" stop-color="${s.color}" stop-opacity="1"/>`
    )
    .join('');

  const def = `<linearGradient id="${id}" gradientUnits="objectBoundingBox" x1="${x1.toFixed(
    4
  )}" y1="${y1.toFixed(4)}" x2="${x2.toFixed(4)}" y2="${y2.toFixed(4)}">${stopTags}</linearGradient>`;

  return { id, def, fill: `url(#${id})` };
}
