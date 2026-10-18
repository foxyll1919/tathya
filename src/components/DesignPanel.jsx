import React from 'react';
import { X, RotateCcw, ImageOff, Shuffle, Camera } from 'lucide-react';
import Sheet from './Sheet';
import { DEFAULT_DESIGN, PALETTE_IDS, PALETTES, STYLE_IDS, STYLES, getPalette, getStyle } from '../design/presets';
import { CURATED } from '../design/photoPresets';

/**
 * Design panel — pick the typography style, the colour palette, and the
 * photo backdrop.
 *
 * Three independent radiogroups, live-applied: the feed behind the sheet
 * restyles as you choose, so the swatch *is* the preview. Choices persist
 * to localStorage via useDesign.
 *
 * Radio semantics come from real `<input type="radio">` elements so
 * arrow-key navigation, grouping and screen-reader announcements all work
 * without reimplementation; the card is the visible label.
 */
export default function DesignPanel({
  style,
  palette,
  photoMode,
  photoPool,
  backdrop,
  onStyleChange,
  onPaletteChange,
  onPhotoModeChange,
  onPhotoChange,
  onCyclePhoto,
  onReset,
  onClose,
}) {
  const activeStyle = getStyle(style);
  const activePalette = getPalette(palette);
  const isPristine =
    style === DEFAULT_DESIGN.style &&
    palette === DEFAULT_DESIGN.palette &&
    photoMode === DEFAULT_DESIGN.photoMode;

  const pool = Array.isArray(photoPool) ? photoPool : [];

  return (
    <Sheet
      onClose={onClose}
      labelledBy="design-panel-title"
      describedBy="design-panel-sub"
      variant="rail"
      zIndex={120}
    >
      <div className="design-panel__header">
        <div className="design-panel__title">
          <h2 className="design-panel__heading" id="design-panel-title">
            Design
          </h2>
          <p className="design-panel__sub" id="design-panel-sub">
            Typography, color and backdrop. Saved on this device.
          </p>
        </div>
        <button type="button" className="icon-btn icon-btn--sm icon-btn--plain" onClick={onClose} aria-label="Close design panel">
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="design-group" role="group" aria-labelledby="design-style-legend">
        <div className="design-group__legend">
          <span className="design-group__name" id="design-style-legend">Style</span>
          <span className="design-group__value">{activeStyle.name}</span>
        </div>
        <div className="design-style-grid">
          {STYLE_IDS.map((id) => {
            const preset = STYLES[id];
            return (
              <label
                key={id}
                className="design-style-card"
                style={{
                  '--specimen-font': `'${preset.quoteFamily}', serif`,
                  '--specimen-weight': preset.export.quoteWeightShort,
                  '--specimen-tracking': preset.export.quoteTracking,
                }}
              >
                <input
                  type="radio"
                  name="tathya-design-style"
                  className="sr-only"
                  value={id}
                  checked={style === id}
                  onChange={() => onStyleChange(id)}
                />
                <span className="design-style-card__specimen" aria-hidden="true">
                  {preset.specimen}
                </span>
                <span className="design-style-card__name">{preset.name}</span>
                <span className="design-style-card__hint">{preset.tagline}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="design-group" role="group" aria-labelledby="design-palette-legend">
        <div className="design-group__legend">
          <span className="design-group__name" id="design-palette-legend">Palette</span>
          <span className="design-group__value">{activePalette.name}</span>
        </div>
        <div className="design-palette-grid">
          {PALETTE_IDS.map((id) => {
            const option = PALETTES[id];
            return (
              <label key={id} className="design-palette-card">
                <input
                  type="radio"
                  name="tathya-design-palette"
                  className="sr-only"
                  value={id}
                  checked={palette === id}
                  onChange={() => onPaletteChange(id)}
                />
                <span className="design-palette-card__swatches" aria-hidden="true">
                  {option.swatches.map((color, i) => (
                    <span key={i} className="design-palette-card__dot" style={{ background: color }} />
                  ))}
                </span>
                <span className="design-palette-card__name">{option.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="design-group" role="group" aria-labelledby="design-backdrop-legend">
        <div className="design-group__legend">
          <span className="design-group__name" id="design-backdrop-legend">Backdrop</span>
          <span className="design-group__value">{photoMode === 'on' ? `${pool.length} curated` : 'Off'}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="chip"
            aria-pressed={photoMode === 'on'}
            onClick={() => onPhotoModeChange(photoMode === 'on' ? 'off' : 'on')}
            style={{ minHeight: 44, paddingInline: 16 }}
          >
            {photoMode === 'on' ? (
              <Camera size={14} aria-hidden="true" />
            ) : (
              <ImageOff size={14} aria-hidden="true" />
            )}
            {photoMode === 'on' ? 'Photo On' : 'Photo Off'}
          </button>

          {photoMode === 'on' && pool.length > 1 && (
            <button
              type="button"
              className="chrome-ghost"
              onClick={onCyclePhoto}
              style={{ minHeight: 44 }}
            >
              <Shuffle size={14} aria-hidden="true" />
              Next Photo
            </button>
          )}
        </div>

        {photoMode === 'on' && pool.length > 0 ? (
          <>
            <ul
              className="photo-strip"
              aria-label={`Backdrop choices for ${activeStyle.name} and ${activePalette.name}`}
              style={{ marginTop: 12 }}
            >
              {pool.map((photo) => {
                const selected = backdrop?.idStable === photo.idStable;
                return (
                  <li key={photo.idStable}>
                    <label className="photo-chip">
                      <input
                        type="radio"
                        name="tathya-design-photo"
                        className="sr-only"
                        value={photo.idStable}
                        checked={selected}
                        onChange={() => onPhotoChange(photo.idStable)}
                      />
                      <img
                        src={photo.thumbUrl}
                        alt=""
                        width={64}
                        height={44}
                        loading="lazy"
                        decoding="async"
                        style={{ background: photo.dominant }}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>

            <p className="design-panel__sub" style={{ marginTop: 10, fontSize: 11 }}>
              {backdrop?.credit ? (
                <>
                  Photo by{' '}
                  <a href={backdrop.credit.profileUrl} target="_blank" rel="noreferrer noopener">
                    {backdrop.credit.name}
                  </a>{' '}
                  on Unsplash.
                </>
              ) : CURATED ? (
                'Photo via Unsplash.'
              ) : (
                <>
                  Temporary seed photos — run{' '}
                  <code style={{ fontSize: 10 }}>npm run curate:photos</code> to replace with
                  credited picks.
                </>
              )}
            </p>
          </>
        ) : (
          photoMode === 'on' ? (
            <p className="design-panel__sub" style={{ marginTop: 10, fontSize: 11 }}>
              No backdrop curated for this style and palette yet.
            </p>
          ) : null
        )}
      </div>

      <div className="design-panel__footer">
        <p className="design-panel__sub" style={{ flex: '1 1 auto', minWidth: 0 }}>
          {activeStyle.hint}
        </p>
        <button
          type="button"
          className="chrome-ghost"
          onClick={onReset}
          disabled={isPristine}
          style={{ flex: '0 0 auto' }}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset
        </button>
      </div>
    </Sheet>
  );
}
