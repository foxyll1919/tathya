import React, { useState, useRef, useCallback } from 'react';
import { X, Copy, Download, Share2, Check, Loader2 } from 'lucide-react';
import { downloadCardImage, getCardFile } from '../utils/exportCard';
import { useShare } from '../hooks/useShare';

const ASPECT_RATIOS = [
  { label: '9:16 Story', value: '9/16', style: { aspectRatio: '9/16', width: '180px', height: '320px' } },
  { label: '1:1 Square', value: '1/1', style: { aspectRatio: '1/1', width: '220px', height: '220px' } },
  { label: '16:9 Post', value: '16/9', style: { aspectRatio: '16/9', width: '300px', height: '169px' } },
];

const CAPTION = (q) =>
  `"${q.text}"\n\n— ${q.author}${q.source ? ` (${q.source})` : ''}\n\nShared via Tathya`;

const FILENAME = (q, ratio) =>
  `tathya_${(q.author || 'quote').toLowerCase().replace(/\s+/g, '_')}_${ratio.value.replace('/', 'x')}.png`;

export default function ShareSheet({ quote, onClose }) {
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [busy, setBusy] = useState(null);
  const cardRef = useRef(null);
  const { shareQuote, copied: shareCopied } = useShare();

  const handleCopyText = useCallback(async () => {
    if (busy || !quote) return;
    setBusy('copy');
    try {
      await navigator.clipboard.writeText(CAPTION(quote));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    } finally {
      setBusy(null);
    }
  }, [busy, quote]);

  const handleSave = useCallback(async () => {
    if (!cardRef.current || busy || !quote) return;
    setBusy('save');
    try {
      await downloadCardImage(cardRef.current, FILENAME(quote, selectedRatio));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setBusy(null);
    }
  }, [busy, quote, selectedRatio]);

  const handleShare = useCallback(async () => {
    if (!cardRef.current || busy || !quote) return;
    setBusy('share');
    try {
      const file = await getCardFile(cardRef.current, FILENAME(quote, selectedRatio));
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
    } finally {
      setBusy(null);
    }
  }, [busy, quote, selectedRatio, shareQuote]);

  if (!quote) return null;

  const themeClass = `theme-${quote.theme.toLowerCase().replace(/\s+/g, '-')}`;
  const truncated = quote.text.length > (selectedRatio.value === '9/16' ? 160 : 100);
  const displayText = truncated
    ? `${quote.text.substring(0, selectedRatio.value === '9/16' ? 160 : 100)}…`
    : quote.text;
  const quoteFontSize = selectedRatio.value === '16/9' ? 11 : selectedRatio.value === '9/16' ? 13 : 14;

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.25s ease-out'
      }}
      onClick={busy ? undefined : onClose}
    >
      <div
        className="glass-panel animate-slide-up"
        style={{
          backgroundColor: '#1a1c1a',
          borderTopLeftRadius: 'var(--rounded-lg)',
          borderTopRightRadius: 'var(--rounded-lg)',
          padding: '24px var(--spacing-edge-margin) 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          borderBottom: 'none',
          maxHeight: '90%'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 4 }} />

        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="label-caps" style={{ color: 'rgba(255,255,255,0.5)' }}>EXPORT PREVIEW</span>
          <button
            onClick={onClose}
            disabled={!!busy}
            aria-label="Close share sheet"
            className="scale-press"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: busy ? 'wait' : 'pointer',
              padding: 4,
              opacity: busy ? 0.4 : 1,
              borderRadius: 'var(--rounded-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 360,
            background: '#0d0f0d',
            borderRadius: 'var(--rounded-default)',
            padding: 16,
            overflow: 'hidden'
          }}
        >
          <div
            ref={cardRef}
            className={`glass-panel ${themeClass}`}
            style={{
              ...selectedRatio.style,
              borderRadius: 'var(--rounded-default)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 40,
                fontFamily: 'var(--font-quote)',
                color: 'var(--text-color)',
                opacity: 0.08,
                lineHeight: 0,
                position: 'absolute',
                top: 24,
                left: 16
              }}
            >
              “
            </span>

            <p
              style={{
                fontFamily: 'var(--font-quote)',
                color: 'var(--text-color)',
                fontSize: quoteFontSize,
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 12,
                marginTop: 8,
                textAlign: 'left',
                position: 'relative',
                zIndex: 1
              }}
            >
              {displayText}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <div style={{ width: 18, height: 1.5, backgroundColor: 'var(--accent-color, var(--text-color))', opacity: 0.8 }} />
              <p className="attribution" style={{ color: 'var(--text-color)', fontSize: 9, opacity: 0.9 }}>
                {quote.author || 'Anonymous'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = selectedRatio.value === ratio.value;
            return (
              <button
                key={ratio.value}
                onClick={() => setSelectedRatio(ratio)}
                disabled={!!busy}
                aria-pressed={isSelected}
                className="scale-press label-caps"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--rounded-default)',
                  background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
                  color: isSelected ? '#0d0f0d' : '#ffffff',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: 10,
                  transition: 'all 0.2s',
                  opacity: busy ? 0.5 : 1
                }}
              >
                {ratio.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <ActionButton
            onClick={handleCopyText}
            disabled={!!busy}
            busy={busy === 'copy'}
            tone="ghost"
            label={copied || shareCopied ? 'COPIED' : 'COPY TEXT'}
            icon={copied || shareCopied ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
          />
          <ActionButton
            onClick={handleSave}
            disabled={!!busy}
            busy={busy === 'save'}
            tone="primary"
            label={busy === 'save' ? 'SAVING…' : savedFlash ? 'SAVED' : 'SAVE'}
            icon={
              busy === 'save' ? (
                <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} />
              ) : savedFlash ? (
                <Check size={14} />
              ) : (
                <Download size={14} />
              )
            }
          />
          <ActionButton
            onClick={handleShare}
            disabled={!!busy}
            busy={busy === 'share'}
            tone="accent"
            label={busy === 'share' ? 'SHARING…' : 'SHARE'}
            icon={
              busy === 'share' ? (
                <Loader2 size={14} style={{ animation: 'spin 0.9s linear infinite' }} />
              ) : (
                <Share2 size={14} />
              )
            }
          />
        </div>

        {!canShareFiles && (
          <p
            className="attribution"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textAlign: 'center',
              textTransform: 'none',
              marginTop: -8
            }}
          >
            Native sharing is unavailable on this device — use SAVE.
          </p>
        )}
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, busy, tone, label, icon }) {
  const styles = {
    ghost: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      color: '#ffffff'
    },
    primary: {
      backgroundColor: '#ffffff',
      border: '1px solid #ffffff',
      color: '#0d0f0d'
    },
    accent: {
      backgroundColor: 'rgba(52, 211, 153, 0.12)',
      border: '1px solid rgba(52, 211, 153, 0.45)',
      color: '#a7f3d0'
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-label={label}
      className="scale-press share-action-btn"
      style={{
        flex: 1,
        padding: '14px 6px',
        borderRadius: 'var(--rounded-default)',
        ...styles[tone],
        fontFamily: 'var(--font-label)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !busy ? 0.5 : 1,
        transition: 'background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, opacity 0.18s ease, transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        minHeight: 64
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
