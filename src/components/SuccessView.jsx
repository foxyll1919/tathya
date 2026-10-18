import React from 'react';
import { Check } from 'lucide-react';
import { themeClassFor } from '../design/quoteThemes';

function getQuoteFontSizeClass(text) {
  const len = text ? text.length : 0;
  if (len < 60) return 'quote-display';
  if (len > 150) return 'quote-md';
  return 'quote-lg';
}

export default function SuccessView({ quote, onViewLibrary, onAddAnother }) {
  if (!quote) return null;

  const themeClass = themeClassFor(quote.theme);
  const previewSize = quote.text.length < 60 ? '24px' : quote.text.length > 150 ? '16px' : '20px';

  return (
    <div
      className="flex-1 flex flex-col justify-between p-6 theme-charcoal-solid animate-scale-in"
      style={{
        height: '100%',
        backgroundColor: 'var(--chrome-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Header and Checkmark */}
      <div
        role="status"
        style={{ marginTop: 'var(--spacing-safe-area-top)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--rounded-full)',
            backgroundColor: 'var(--accent-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
            animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <Check size={36} strokeWidth={2.5} style={{ color: 'var(--on-accent, #121412)' }} />
        </div>
        <h1 className="label-caps" style={{ color: 'var(--chrome-fg)', fontSize: 13, letterSpacing: '0.2em' }}>
          Saved to Library
        </h1>
      </div>

      {/* Mini Card Preview */}
      <figure
        className={`glass-panel ${themeClass}`}
        style={{
          width: '100%',
          maxWidth: 320,
          aspectRatio: '3/4',
          margin: 0,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span className="quote-mark" aria-hidden="true" style={{ fontSize: 70, position: 'absolute', top: 40, left: 20 }}>
          &ldquo;
        </span>

        <blockquote style={{ margin: 0 }}>
          <p
            className={getQuoteFontSizeClass(quote.text)}
            style={{ color: 'var(--text-color)', fontSize: previewSize, marginBottom: 16, lineHeight: 1.3 }}
          >
            {quote.text}
          </p>
          <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <cite className="attribution" style={{ color: 'var(--text-color)', fontSize: 11, opacity: 0.9, lineHeight: 1, fontStyle: 'normal' }}>
              {quote.author || 'Anonymous'}
            </cite>
            {quote.source && (
              <span className="label-caps" style={{ color: 'var(--subtext-color)', fontSize: 9, opacity: 0.85 }}>
                {quote.source}
              </span>
            )}
          </figcaption>
        </blockquote>
      </figure>

      {/* Actions — one primary CTA, one secondary */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--spacing-safe-area-bottom)' }}>
        <button type="button" onClick={onViewLibrary} className="chrome-primary">
          View in Library
        </button>

        <button type="button" onClick={onAddAnother} className="chrome-row">
          <span style={{ textAlign: 'center', width: '100%' }}>Add Another</span>
        </button>
      </div>
    </div>
  );
}