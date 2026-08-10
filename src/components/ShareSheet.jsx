import React, { useState } from 'react';
import { X, Copy, Share, Download, Check } from 'lucide-react';

const ASPECT_RATIOS = [
  { label: '9:16 Story', value: '9/16', widthClass: 'ratio-story', style: { aspectRatio: '9/16', maxWidth: '200px' } },
  { label: '1:1 Square', value: '1/1', widthClass: 'ratio-square', style: { aspectRatio: '1/1', maxWidth: '240px' } },
  { label: '16:9 Post', value: '16/9', widthClass: 'ratio-landscape', style: { aspectRatio: '16/9', maxWidth: '320px' } },
];

export default function ShareSheet({ quote, onClose }) {
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!quote) return null;

  const themeClass = `theme-${quote.theme.toLowerCase().replace(/\s+/g, '-')}`;

  const handleCopyText = () => {
    const shareText = `"${quote.text}"\n\n— ${quote.author}${quote.source ? ` (${quote.source})` : ''}\n\nShared via Tathya`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      // Simulate file download by creating a text file
      const element = document.createElement("a");
      const file = new Blob([`TATHYA EXPORT\nTheme: ${quote.theme}\nRatio: ${selectedRatio.label}\n\n"${quote.text}"\n— ${quote.author}`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `tathya_${quote.author.toLowerCase().replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1500);
  };

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
      onClick={onClose}
    >
      {/* Drawer Panel */}
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
        {/* Notch Indicator */}
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 4 }} />

        {/* Title */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="label-caps" style={{ color: 'rgba(255,255,255,0.5)' }}>EXPORT PREVIEW</span>
          <button 
            onClick={onClose}
            className="scale-press"
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Live Export Preview Container */}
        <div 
          style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 250,
            background: '#0d0f0d',
            borderRadius: 'var(--rounded-default)',
            padding: 16
          }}
        >
          {/* Card in correct Aspect Ratio */}
          <div 
            className={`glass-panel ${themeClass}`}
            style={{
              width: '100%',
              ...selectedRatio.style,
              borderRadius: 'var(--rounded-default)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <span style={{ fontSize: 32, fontFamily: 'var(--font-quote)', color: 'var(--text-color)', opacity: 0.08, lineHeight: 0, position: 'absolute', top: 20, left: 12 }}>“</span>
            
            <p 
              style={{ 
                fontFamily: 'var(--font-quote)',
                color: 'var(--text-color)', 
                fontSize: selectedRatio.value === '16/9' ? '12px' : '15px',
                fontWeight: '700',
                lineHeight: 1.25,
                marginBottom: 10,
                textAlign: 'left'
              }}
            >
              {quote.text.length > 100 ? `${quote.text.substring(0, 100)}...` : quote.text}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ width: 16, height: 1, backgroundColor: 'var(--accent-color, var(--text-color))', opacity: 0.8, marginBottom: 2 }} />
              <p className="attribution" style={{ color: 'var(--text-color)', fontSize: 9, opacity: 0.9 }}>
                {quote.author}
              </p>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Switcher */}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = selectedRatio.value === ratio.value;
            return (
              <button
                key={ratio.value}
                onClick={() => setSelectedRatio(ratio)}
                className="scale-press label-caps"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--rounded-default)',
                  background: isSelected ? 'white' : 'rgba(255,255,255,0.05)',
                  border: isSelected ? '1px solid white' : '1px solid rgba(255,255,255,0.1)',
                  color: isSelected ? 'black' : 'white',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: 10,
                  transition: 'all 0.2s'
                }}
              >
                {ratio.label}
              </button>
            );
          })}
        </div>

        {/* Export Actions */}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            onClick={handleCopyText}
            className="scale-press"
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 'var(--rounded-default)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
            {copied ? 'COPIED!' : 'COPY TEXT'}
          </button>

          <button
            onClick={handleDownloadImage}
            className="scale-press"
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 'var(--rounded-default)',
              backgroundColor: '#ffffff',
              border: 'none',
              color: '#0d0f0d',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
          >
            {downloaded ? <Check size={14} /> : <Download size={14} />}
            {downloaded ? 'EXPORTING...' : 'EXPORT CARD'}
          </button>
        </div>
      </div>
    </div>
  );
}
