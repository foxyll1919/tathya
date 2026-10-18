import React, { useState, useCallback } from 'react';
import { X, Copy, Download, Share2, Check, Loader2, AlertCircle } from 'lucide-react';
import Sheet from './Sheet';
import { downloadCardPng, getCardFile } from '../utils/cardExport';
import { themeClassFor } from '../design/quoteThemes';
import { useShare } from '../hooks/useShare';

const ASPECT_RATIOS = [
  { label: '9:16 Story', value: '9/16', style: { aspectRatio: '9/16', width: '180px', height: '320px' } },
  { label: '1:1 Square', value: '1/1', style: { aspectRatio: '1/1', width: '220px', height: '220px' } },
  { label: '16:9 Post', value: '16/9', style: { aspectRatio: '16/9', width: '300px', height: '169px' } },
];

const CAPTION = (q) =>
  `“${q.text}”\n\n— ${q.author}${q.source ? ` (${q.source})` : ''}\n\nShared via Tathya`;

const FILENAME = (q, ratio) =>
  `tathya_${(q.author || 'quote').toLowerCase().replace(/\s+/g, '_')}_${ratio.value.replace('/', 'x')}.png`;

export default function ShareSheet({ quote, style, palette, backdrop, tint, colors, onClose }) {
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [highRes, setHighRes] = useState(false);
  const { shareQuote, copied: shareCopied } = useShare();

  const LONG_EDGE = highRes ? 2160 : 1080;

  const handleCopyText = useCallback(async () => {
    if (busy || !quote) return;
    setBusy('copy');
    setError(null);
    try {
      await navigator.clipboard.writeText(CAPTION(quote));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setError('Could not copy text — your browser blocked the clipboard.');
    } finally {
      setBusy(null);
    }
  }, [busy, quote]);

  const handleSave = useCallback(async () => {
    if (busy || !quote) return;
    setBusy('save');
    setError(null);
    try {
      await downloadCardPng(quote, FILENAME(quote, selectedRatio), {
        ratio: selectedRatio.value,
        width: LONG_EDGE,
        style,
        palette,
        tint,
        colors,
        backdrop,
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Could not generate the image. Please try again.');
    } finally {
      setBusy(null);
    }
  }, [busy, quote, selectedRatio, LONG_EDGE, style, palette, tint, colors, backdrop]);

  const handleShare = useCallback(async () => {
    if (busy || !quote) return;
    setBusy('share');
    setError(null);
    try {
      const file = await getCardFile(quote, FILENAME(quote, selectedRatio), {
        ratio: selectedRatio.value,
        width: LONG_EDGE,
        style,
        palette,
        tint,
        colors,
        backdrop,
      });
      const result = await shareQuote({
        title: `Tathya — ${quote.author || 'Quote'}`,
        text: CAPTION(quote),
        file,
      });
      if (result?.status === 'copied') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
      setError('Could not share. Try SAVE instead.');
    } finally {
      setBusy(null);
    }
  }, [busy, quote, selectedRatio, shareQuote, LONG_EDGE, style, palette, tint, colors, backdrop]);

  if (!quote) return null;

  const themeClass = themeClassFor(quote.theme);
  const limit = selectedRatio.value === '9/16' ? 160 : 100;
  const displayText = quote.text.length > limit ? `${quote.text.slice(0, limit).trimEnd()}…` : quote.text;
  const quoteFontSize = selectedRatio.value === '16/9' ? 11 : selectedRatio.value === '9/16' ? 13 : 14;

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  return (
    <Sheet
      onClose={onClose}
      labelledBy="share-title"
      dismissable={!busy}
      variant="bottom"
      zIndex={100}
    >
      <div className="sheet-handle sheet-panel__handle" aria-hidden="true" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 className="label-caps" id="share-title" style={{ color: 'var(--chrome-fg-muted)' }}>
          Export Preview
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={!!busy}
          aria-label="Close share sheet"
          className="icon-btn icon-btn--sm icon-btn--plain"
          style={{ color: 'var(--chrome-fg)' }}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 16,
          padding: 16,
          minHeight: 360,
          background: 'var(--chrome-bg)',
          borderRadius: 'var(--rounded-default)',
          overflow: 'hidden'
        }}
      >
        <figure
          className={`glass-panel ${themeClass}`}
          style={{
            ...selectedRatio.style,
            margin: 0,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxShadow: 'var(--shadow-card)',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {/* WYSIWYG backdrop. Mirrors .photo-layer exactly; the export
              bake reproduces these same four steps on a canvas. */}
          {backdrop?.url && (
            <div className="photo-layer" aria-hidden="true">
              <div className="photo-layer__base" style={{ '--photo-placeholder': backdrop.dominant }} />
              <img className="photo-layer__img" src={backdrop.url} alt="" decoding="async" />
              <div className="photo-layer__tint" />
              <div className="photo-layer__scrim" />
              <div className="photo-layer__grain" />
            </div>
          )}

          <span className="quote-mark" aria-hidden="true" style={{ fontSize: 40, position: 'absolute', top: 24, left: 16 }}>
            &ldquo;
          </span>

          <blockquote style={{ margin: 0, position: 'relative', zIndex: 1 }}>
            <p
              style={{
                fontFamily: 'var(--font-quote)',
                color: 'var(--text-color)',
                fontSize: quoteFontSize,
                fontWeight: 'var(--quote-weight, 700)',
                letterSpacing: 'var(--quote-tracking, 0)',
                lineHeight: 'var(--quote-leading, 1.3)',
                marginBottom: 12,
                marginTop: 8,
                textAlign: 'left'
              }}
            >
              {displayText}
            </p>
            <figcaption>
              <span className="attribution" style={{ color: 'var(--text-color)', fontSize: 9, opacity: 0.9, lineHeight: 1 }}>
                {quote.author || 'Anonymous'}
              </span>
            </figcaption>
          </blockquote>
        </figure>
      </div>

      <div role="group" aria-label="Aspect ratio" style={{ display: 'flex', gap: 8, width: '100%', marginTop: 16 }}>
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio.value}
            type="button"
            onClick={() => setSelectedRatio(ratio)}
            disabled={!!busy}
            aria-pressed={selectedRatio.value === ratio.value}
            className="chip"
            style={{ flex: 1, justifyContent: 'center', minHeight: 44, fontSize: 10 }}
          >
            {ratio.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setHighRes((v) => !v)}
        disabled={!!busy}
        aria-pressed={highRes}
        className="chrome-row"
        style={{ marginTop: 8, justifyContent: 'space-between' }}
      >
        <span className="label-caps" style={{ fontSize: 10 }}>Quality</span>
        <span style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
          {highRes ? '2K · 2160 px' : 'HD · 1080 px'}
        </span>
      </button>

      <div aria-live="polite" style={{ width: '100%' }}>
        {error && (
          <p
            role="alert"
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 'var(--rounded-default)',
              background: 'var(--danger-surface)',
              border: 'var(--hairline) solid var(--danger-border)',
              color: 'var(--danger-fg)',
              fontFamily: 'var(--font-attribution)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 16 }}>
        <ActionButton
          onClick={handleCopyText}
          disabled={!!busy}
          busy={busy === 'copy'}
          tone="ghost"
          label={copied || shareCopied ? 'Copied' : 'Copy Text'}
          icon={copied || shareCopied ? <Check size={14} style={{ color: 'var(--success-fg)' }} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        />
        <ActionButton
          onClick={handleSave}
          disabled={!!busy}
          busy={busy === 'save'}
          tone="primary"
          label={busy === 'save' ? 'Saving…' : savedFlash ? 'Saved' : 'Save'}
          icon={
            busy === 'save' ? (
              <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} aria-hidden="true" />
            ) : savedFlash ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Download size={14} aria-hidden="true" />
            )
          }
        />
        <ActionButton
          onClick={handleShare}
          disabled={!!busy}
          busy={busy === 'share'}
          tone="accent"
          label={busy === 'share' ? 'Sharing…' : 'Share'}
          icon={
            busy === 'share' ? (
              <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} aria-hidden="true" />
            ) : (
              <Share2 size={14} aria-hidden="true" />
            )
          }
        />
      </div>

      {!canShareFiles && (
        <p
          className="attribution"
          style={{
            color: 'var(--chrome-fg-muted)',
            fontSize: 10,
            letterSpacing: '0.04em',
            textTransform: 'none',
            textAlign: 'center',
            marginTop: 4
          }}
        >
          Native sharing is unavailable on this device — use Save.
        </p>
      )}
    </Sheet>
  );
}

function ActionButton({ onClick, disabled, busy, tone, label, icon }) {
  const styles = {
    ghost: {},
    primary: {
      backgroundColor: 'var(--accent-color)',
      borderColor: 'var(--accent-color)',
      color: 'var(--on-accent, #0d0f0d)'
    },
    accent: {
      backgroundColor: 'color-mix(in srgb, var(--accent-color) 14%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent-color) 45%, transparent)',
      color: 'var(--accent-color)'
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      className="chrome-row share-action-btn"
      style={{
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 6,
        minHeight: 64,
        textAlign: 'center',
        ...styles[tone]
      }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span className="label-caps" style={{ fontSize: 10 }}>{label}</span>
    </button>
  );
}
