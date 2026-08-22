import React from 'react';
import { Check } from 'lucide-react';

export default function SuccessView({ quote, onViewLibrary, onAddAnother }) {
  if (!quote) return null;

  const themeClass = `theme-${quote.theme.toLowerCase().replace(/\s+/g, '-')}`;

  const getQuoteFontSizeClass = (text) => {
    const len = text ? text.length : 0;
    if (len < 60) return 'quote-display';
    if (len > 150) return 'quote-md';
    return 'quote-lg';
  };

  return (
    <div 
      className="flex-1 flex flex-col justify-between p-6 theme-charcoal-solid animate-scale-in"
      style={{ 
        height: '100%', 
        backgroundColor: '#121412', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Header and Checkmark */}
      <div style={{ marginTop: 'var(--spacing-safe-area-top)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div 
          style={{ 
            width: 72, 
            height: 72, 
            borderRadius: 'var(--rounded-full)', 
            backgroundColor: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(255, 255, 255, 0.2)',
            animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <Check size={36} strokeWidth={2.5} style={{ color: '#121412' }} />
        </div>
        <h3 className="label-caps" style={{ color: '#ffffff', fontSize: 13, letterSpacing: '0.2em', fontWeight: '700' }}>
          SAVED TO LIBRARY
        </h3>
      </div>

      {/* Mini Card Preview */}
      <div 
        className={`glass-panel ${themeClass}`}
        style={{ 
          width: '100%',
          maxWidth: 320,
          aspectRatio: '3/4',
          borderRadius: 'var(--rounded-lg)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <span 
          style={{ 
            fontFamily: 'var(--font-quote)', 
            fontSize: 70, 
            color: 'var(--text-color)', 
            opacity: 0.08, 
            lineHeight: 0, 
            position: 'absolute',
            top: 40,
            left: 20
          }}
        >
          “
        </span>

        <p 
          className={getQuoteFontSizeClass(quote.text)} 
          style={{ 
            color: 'var(--text-color)', 
            fontSize: quote.text.length < 60 ? '24px' : quote.text.length > 150 ? '16px' : '20px',
            marginBottom: 16,
            lineHeight: 1.25
          }}
        >
          {quote.text}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: -24 }}>
<span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  width: 18,
                  height: 1.5,
                  backgroundColor: 'var(--accent-color, var(--text-color))',
                  opacity: 0.8,
                  marginRight: 6,
                  flexShrink: 0
                }}
              />
            <p className="attribution" style={{ color: 'var(--text-color)', fontSize: 11, opacity: 0.9, lineHeight: 1 }}>
              {quote.author || 'Anonymous'}
            </p>
          </div>
          {quote.source && (
            <p className="label-caps" style={{ color: 'var(--subtext-color)', fontSize: 9, opacity: 0.7 }}>
              {quote.source}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--spacing-safe-area-bottom)' }}>
        <button 
          onClick={onViewLibrary}
          className="scale-press"
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: 'var(--rounded-xl)', 
            backgroundColor: '#ffffff', 
            color: '#121412', 
            border: 'none', 
            fontFamily: 'var(--font-label)',
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          View in Library
        </button>

        <button 
          onClick={onAddAnother}
          className="scale-press"
          style={{ 
            width: '100%', 
            padding: '16px', 
            borderRadius: 'var(--rounded-xl)', 
            backgroundColor: 'rgba(255,255,255,0.06)', 
            color: '#ffffff', 
            border: '1px solid rgba(255,255,255,0.1)', 
            fontFamily: 'var(--font-label)',
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          Add Another
        </button>
      </div>
    </div>
  );
}
