import React from 'react';
import { Heart, Share2, Trash2, Palette, ArrowDown } from 'lucide-react';
import Sheet from './Sheet';

export default function OptionsSheet({ quote, onToggleFavorite, onShare, onOpenDesign, onRequestDelete, onClose }) {
  const isFavorite = !!quote?.favorite;

  return (
    <Sheet onClose={onClose} labelledBy="options-title" zIndex={90}>
      <div className="sheet-handle sheet-panel__handle" aria-hidden="true" />

      <div style={{ paddingBottom: 14, borderBottom: 'var(--hairline) solid var(--chrome-border)' }}>
        <h2 className="label-caps" id="options-title" style={{ color: 'var(--chrome-fg-muted)', marginBottom: 6 }}>
          Selected Wisdom
        </h2>
        <p
          className="quote-md"
          style={{
            color: 'var(--chrome-fg)',
            fontSize: 16,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            lineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {quote?.text}
        </p>
        <p className="attribution" style={{ color: 'var(--chrome-fg-muted)', marginTop: 6, fontSize: 12 }}>
          {quote?.author || 'Anonymous'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        <button type="button" className="chrome-row" onClick={onToggleFavorite}>
          <Heart
            size={18}
            aria-hidden="true"
            fill={isFavorite ? 'currentColor' : 'none'}
            style={{ color: isFavorite ? 'var(--accent-color)' : 'currentColor' }}
          />
          <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        </button>

        <button type="button" className="chrome-row" onClick={onShare}>
          <Share2 size={18} aria-hidden="true" />
          <span>Share &amp; Customize Layout</span>
        </button>

        <button type="button" className="chrome-row" onClick={onOpenDesign}>
          <Palette size={18} aria-hidden="true" />
          <span>Design &amp; Color</span>
        </button>

        <button type="button" className="chrome-row chrome-row--danger" onClick={onRequestDelete}>
          <Trash2 size={18} aria-hidden="true" />
          <span>Delete Permanently</span>
        </button>

        <button type="button" className="chrome-ghost" onClick={onClose} style={{ marginTop: 4 }}>
          <ArrowDown size={14} aria-hidden="true" />
          Dismiss
        </button>
      </div>
    </Sheet>
  );
}