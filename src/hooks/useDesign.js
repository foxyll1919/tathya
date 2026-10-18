import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_DESIGN, STORAGE_KEY, normalizeDesign } from '../design/presets';
import { normalizePhotoPrefs } from '../design/photoPresets';

function readStoredDesign() {
  if (typeof localStorage === 'undefined') return DEFAULT_DESIGN;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DESIGN;
    return normalizeDesign(JSON.parse(raw));
  } catch {
    return DEFAULT_DESIGN;
  }
}

/**
 * Global design preferences — typography style, colour palette, and the
 * photo backdrop choice.
 *
 * The values live in React state (App.jsx owns them) and are mirrored onto
 * the `.app-container` element as `data-style` / `data-palette`, which is
 * where src/design.css resolves them. They are persisted so a returning
 * visitor keeps their choice.
 *
 * `photoMode` is 'off' | 'on'. `photoId` pins a specific entry from the
 * active (style x palette) pool; leaving it null means "first in pool",
 * which makes the backdrop follow the preset automatically.
 */
export function useDesign(initial) {
  const [design, setDesign] = useState(() =>
    normalizePhotoPrefs(initial ? normalizeDesign(initial) : readStoredDesign())
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
    } catch {
      // Private mode / quota — preferences simply won't survive a reload.
    }
  }, [design]);

  const setStyle = useCallback((style) => {
    // The photo pool is keyed by (style, palette), so a pinned id from the
    // old style must not survive the switch.
    setDesign((prev) => normalizePhotoPrefs({ ...prev, style, photoId: null }));
  }, []);

  const setPalette = useCallback((palette) => {
    setDesign((prev) => normalizePhotoPrefs({ ...prev, palette, photoId: null }));
  }, []);

  const setPhotoMode = useCallback((photoMode) => {
    setDesign((prev) => normalizePhotoPrefs({ ...prev, photoMode }));
  }, []);

  const setPhotoId = useCallback((photoId) => {
    setDesign((prev) => normalizePhotoPrefs({ ...prev, photoId }));
  }, []);

  /** Advance to the next photo in the active pool, wrapping around. */
  const cyclePhoto = useCallback((pool) => {
    if (!Array.isArray(pool) || pool.length === 0) return;
    setDesign((prev) => {
      const current = pool.findIndex((p) => p.idStable === prev.photoId);
      const next = pool[(current + 1) % pool.length];
      return normalizePhotoPrefs({ ...prev, photoId: next.idStable, photoMode: 'on' });
    });
  }, []);

  const resetDesign = useCallback(() => {
    setDesign(normalizePhotoPrefs(DEFAULT_DESIGN));
  }, []);

  return {
    design,
    style: design.style,
    palette: design.palette,
    photoMode: design.photoMode,
    photoId: design.photoId,
    setStyle,
    setPalette,
    setPhotoMode,
    setPhotoId,
    cyclePhoto,
    resetDesign,
  };
}

export default useDesign;