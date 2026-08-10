import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, Plus, MoreHorizontal, Bookmark, Folder, Volume2, Sparkles, Filter } from 'lucide-react';

export default function FeedView({
  quotes,
  activeQuoteIndex,
  setActiveQuoteIndex,
  favoritesOnly,
  setFavoritesOnly,
  onOpenMenu,
  onToggleFavorite,
  onOpenShare,
  onOpenAdd,
  onOpenDelete
}) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const touchStartTime = useRef(0);
  const progressTimerRef = useRef(null);
  const touchHandledRef = useRef(false); // Guard against double-fire (touchend + synthetic mouseup)

  // Filter quotes by favorite status
  const filteredQuotes = favoritesOnly ? quotes.filter(q => q.favorite) : quotes;

  // Sync index if length changes or goes out of bounds
  useEffect(() => {
    if (activeQuoteIndex >= filteredQuotes.length && filteredQuotes.length > 0) {
      setActiveQuoteIndex(filteredQuotes.length - 1);
    }
  }, [filteredQuotes.length, activeQuoteIndex, setActiveQuoteIndex]);

  const handleNextQuote = () => {
    setProgress(0);
    if (filteredQuotes.length <= 1) return;
    setActiveQuoteIndex((prev) => (prev + 1) % filteredQuotes.length);
  };

  const handlePrevQuote = () => {
    setProgress(0);
    if (filteredQuotes.length <= 1) return;
    setActiveQuoteIndex((prev) => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  };

  // Story Auto-Advance Effect
  useEffect(() => {
    if (!isPlaying || filteredQuotes.length === 0) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const intervalTime = 50; // Update progress bar every 50ms
    const totalDuration = 5000; // 5 seconds per quote
    const step = (intervalTime / totalDuration) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextQuote();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, activeQuoteIndex, filteredQuotes.length]);

  // Handle Touch/Mouse hold to pause
  const handlePressStart = (e) => {
    // Avoid pausing if clicking interactive buttons
    if (e.target.closest('button') || e.target.closest('.action-btn')) return;
    // Mark touch events so synthetic mouse events are ignored
    if (e.type === 'touchstart') {
      touchHandledRef.current = false;
    }
    touchStartTime.current = Date.now();
    setIsPlaying(false);
  };

  const handlePressEnd = (e) => {
    if (e.target.closest('button') || e.target.closest('.action-btn')) return;

    // If this is a synthetic mouseup after a touchend, skip it
    if (e.type === 'mouseup' && touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    if (e.type === 'touchend') {
      touchHandledRef.current = true;
    }

    setIsPlaying(true);
    
    // Tap detection (if hold duration was less than 300ms)
    const holdDuration = Date.now() - touchStartTime.current;
    if (holdDuration < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX || (e.changedTouches && e.changedTouches[0].clientX)) - rect.left;
      
      // Tap on left 30% goes back, right 70% goes forward
      if (x < rect.width * 0.3) {
        handlePrevQuote();
      } else {
        handleNextQuote();
      }
    }
  };

  // Auto-sizing typography logic
  const getQuoteFontSizeClass = (text) => {
    const len = text ? text.length : 0;
    if (len < 60) return 'quote-display';
    if (len > 150) return 'quote-md';
    return 'quote-lg';
  };

  if (filteredQuotes.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 theme-charcoal-solid animate-fade-in" style={{ height: '100%' }}>
        {/* Simple top line */}
        <div style={{ marginTop: 'var(--spacing-safe-area-top)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="label-caps" style={{ color: 'var(--color-on-surface)', opacity: 0.8 }}>TATHYA</span>
          <button 
            onClick={() => setFavoritesOnly(false)} 
            className="scale-press"
            style={{ background: 'none', border: 'none', color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Filter size={14} />
            <span className="label-caps">Show All</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
          <div className="glow-on-hover" style={{ width: 80, height: 80, borderRadius: 'var(--rounded-full)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
            <Sparkles size={32} style={{ color: 'var(--color-outline)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="quote-lg" style={{ color: 'var(--color-on-surface)' }}>No Wisdom Found</h2>
            <p className="attribution" style={{ color: 'var(--color-on-surface-variant)', textTransform: 'none', fontSize: 13 }}>
              {favoritesOnly 
                ? "You haven't marked any quotes as favorite yet." 
                : "Create a timeless visual card of your favorite quotes."}
            </p>
          </div>
          
          <button 
            onClick={onOpenAdd} 
            className="scale-press"
            style={{ 
              marginTop: 12,
              padding: '14px 28px', 
              borderRadius: 'var(--rounded-xl)', 
              background: 'white', 
              color: 'black', 
              border: 'none', 
              fontFamily: 'var(--font-label)',
              fontSize: 12,
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)'
            }}
          >
            Create Quote
          </button>
        </div>

        <div style={{ height: 80 }}></div>
      </div>
    );
  }

  const activeQuote = filteredQuotes[activeQuoteIndex];
  const themeClass = `theme-${activeQuote.theme.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div 
      className="flex-1 flex flex-col justify-between relative overflow-hidden transition-all duration-500"
      style={{ height: '100%', userSelect: 'none' }}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {/* Story Progress Indicators at the Top */}
      <div 
        style={{ 
          position: 'absolute',
          top: 16,
          left: 'var(--spacing-edge-margin)',
          right: 'var(--spacing-edge-margin)',
          display: 'flex',
          gap: 6,
          zIndex: 50
        }}
      >
        {filteredQuotes.map((_, idx) => (
          <div 
            key={idx} 
            style={{ 
              height: 4, 
              flex: 1, 
              backgroundColor: 'rgba(255, 255, 255, 0.25)', 
              borderRadius: 'var(--rounded-full)', 
              overflow: 'hidden' 
            }}
          >
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: 'var(--text-color, #ffffff)', 
                width: idx === activeQuoteIndex ? `${progress}%` : idx < activeQuoteIndex ? '100%' : '0%',
                transition: idx === activeQuoteIndex ? 'none' : 'width 0.2s ease-out'
              }}
            />
          </div>
        ))}
      </div>

      {/* Top Header Controls (Inside Safe Zone) */}
      <div 
        style={{ 
          marginTop: 'var(--spacing-safe-area-top)', 
          paddingLeft: 'var(--spacing-edge-margin)',
          paddingRight: 'var(--spacing-edge-margin)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          zIndex: 40
        }}
      >
        <span className="label-caps" style={{ color: 'var(--text-color)', opacity: 0.9 }}>TATHYA</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setFavoritesOnly(!favoritesOnly);
            }} 
            className="scale-press"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-color)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              opacity: favoritesOnly ? 1 : 0.6
            }}
          >
            <Heart size={20} fill={favoritesOnly ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Central Immersive Quote Display */}
      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          paddingLeft: 'var(--spacing-edge-margin)',
          paddingRight: 'var(--spacing-edge-margin)',
          paddingBottom: 40,
          zIndex: 10
        }}
      >
        {/* Subtle decorative large quotation mark */}
        <span 
          className="quote-display" 
          style={{ 
            color: 'var(--text-color)', 
            opacity: 0.08, 
            fontSize: 100, 
            lineHeight: 0, 
            marginBottom: -20, 
            fontFamily: 'var(--font-quote)' 
          }}
        >
          “
        </span>

        {/* The Quote Card */}
        <div style={{ position: 'relative' }}>
          <p 
            className={getQuoteFontSizeClass(activeQuote.text)} 
            style={{ 
              color: 'var(--text-color)', 
              marginBottom: 24,
              whiteSpace: 'pre-wrap',
              textShadow: '0 2px 10px rgba(0,0,0,0.15)'
            }}
          >
            {activeQuote.text}
          </p>

          {/* Divider and Attribution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 2, backgroundColor: 'var(--accent-color, var(--text-color))', opacity: 0.8 }} />
            
            <p className="attribution" style={{ color: 'var(--text-color)', opacity: 0.9 }}>
              {activeQuote.author || "Anonymous"}
            </p>
            
            {activeQuote.source && (
              <span className="label-caps" style={{ color: 'var(--subtext-color)', opacity: 0.7 }}>
                {activeQuote.source}
              </span>
            )}
          </div>

          {/* Tags */}
          {activeQuote.tags && activeQuote.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              {activeQuote.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className="label-caps" 
                  style={{ 
                    padding: '4px 10px', 
                    borderRadius: 'var(--rounded-full)', 
                    border: '1px solid var(--outline-color, rgba(255,255,255,0.25))',
                    backgroundColor: 'var(--chip-bg, rgba(255,255,255,0.05))',
                    color: 'var(--text-color)',
                    fontSize: 10,
                    opacity: 0.85
                  }}
                >
                  #{tag.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Overlay & Navigation Buttons */}
      <div 
        style={{ 
          position: 'absolute', 
          right: 'var(--spacing-edge-margin)', 
          bottom: 'var(--spacing-safe-area-bottom)', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 20, 
          zIndex: 40 
        }}
      >
        {/* Favorite Icon */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(activeQuote.id);
          }}
          className="scale-press action-btn"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            color: 'var(--text-color)', 
            width: 48, 
            height: 48, 
            borderRadius: 'var(--rounded-full)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Heart size={20} fill={activeQuote.favorite ? "var(--text-color)" : "none"} style={{ color: activeQuote.favorite ? 'var(--accent-color)' : 'inherit' }} />
        </button>

        {/* Share Icon */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenShare(activeQuote);
          }}
          className="scale-press action-btn"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            color: 'var(--text-color)', 
            width: 48, 
            height: 48, 
            borderRadius: 'var(--rounded-full)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Share2 size={20} />
        </button>

        {/* Contextual Actions (Triple Dot) */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(activeQuote);
          }}
          className="scale-press action-btn"
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            color: 'var(--text-color)', 
            width: 48, 
            height: 48, 
            borderRadius: 'var(--rounded-full)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Floating Add Button (FAB) at Bottom Center/Left */}
      <div 
        style={{ 
          position: 'absolute', 
          left: 'var(--spacing-edge-margin)', 
          bottom: 'var(--spacing-safe-area-bottom)', 
          zIndex: 40 
        }}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdd();
          }}
          className="scale-press glow-on-hover"
          style={{ 
            backgroundColor: 'var(--text-color, #ffffff)', 
            color: 'var(--accent-color, #000000)',
            width: 56, 
            height: 56, 
            borderRadius: 'var(--rounded-full)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}
        >
          <Plus size={26} strokeWidth={2.5} style={{ color: 'var(--color-on-primary)' }} />
        </button>
      </div>
    </div>
  );
}
