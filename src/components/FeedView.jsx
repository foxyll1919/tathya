import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Share2, Plus, MoreHorizontal, Sparkles, Filter, Palette, Pause, Play } from 'lucide-react';

const STORY_DURATION_MS = 5000;
const TICK_MS = 50;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function FeedView({
  quotes,
  activeQuoteIndex,
  setActiveQuoteIndex,
  favoritesOnly,
  setFavoritesOnly,
  onOpenMenu,
  onToggleFavorite,
  onOpenShare,
  onOpenDesign,
  onOpenAdd
}) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const touchStartTime = useRef(0);
  const progressTimerRef = useRef(null);
  const touchHandledRef = useRef(false); // Guard against double-fire (touchend + synthetic mouseup)

  const reducedMotion = prefersReducedMotion();

  // Filter quotes by favorite status
  const filteredQuotes = favoritesOnly ? quotes.filter(q => q.favorite) : quotes;

  // Sync index if length changes or goes out of bounds
  useEffect(() => {
    if (activeQuoteIndex >= filteredQuotes.length && filteredQuotes.length > 0) {
      setActiveQuoteIndex(filteredQuotes.length - 1);
    }
  }, [filteredQuotes.length, activeQuoteIndex, setActiveQuoteIndex]);

  const handleNextQuote = useCallback(() => {
    setProgress(0);
    if (filteredQuotes.length <= 1) return;
    setActiveQuoteIndex((prev) => (prev + 1) % filteredQuotes.length);
  }, [filteredQuotes.length, setActiveQuoteIndex]);

  const handlePrevQuote = useCallback(() => {
    setProgress(0);
    if (filteredQuotes.length <= 1) return;
    setActiveQuoteIndex((prev) => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  }, [filteredQuotes.length, setActiveQuoteIndex]);

  // Story Auto-Advance Effect — off under reduced motion, and suspended
  // while the tab is hidden so quotes don't silently advance in the bg.
  useEffect(() => {
    const canPlay =
      isPlaying && !isPausedByUser && !reducedMotion && !document.hidden && filteredQuotes.length > 0;

    if (!canPlay) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return undefined;
    }

    const step = (TICK_MS / STORY_DURATION_MS) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextQuote();
          return 0;
        }
        return prev + step;
      });
    }, TICK_MS);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, isPausedByUser, reducedMotion, activeQuoteIndex, filteredQuotes.length, handleNextQuote]);

  // Handle Touch/Mouse hold to pause
  const handlePressStart = (e) => {
    // Avoid pausing if clicking interactive buttons
    if (e.target.closest('button') || e.target.closest('.action-btn') || e.target.closest('a')) return;
    // Mark touch events so synthetic mouse events are ignored
    if (e.type === 'touchstart') {
      touchHandledRef.current = false;
    }
    touchStartTime.current = Date.now();
    setIsPlaying(false);
  };

  const handlePressEnd = (e) => {
    if (e.target.closest('button') || e.target.closest('.action-btn') || e.target.closest('a')) return;

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

  // Keyboard equivalent for the swipe/tap navigation, plus a pause toggle.
  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextQuote();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevQuote();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      setIsPausedByUser((v) => !v);
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
          <span className="label-caps" style={{ color: 'var(--text-color)', opacity: 0.85 }}>Tathya</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {favoritesOnly && (
              <button
                type="button"
                onClick={() => setFavoritesOnly(false)}
                className="chrome-ghost"
                style={{ color: 'var(--text-color)' }}
              >
                <Filter size={14} aria-hidden="true" />
                Show All
              </button>
            )}
            <button type="button" className="icon-btn icon-btn--sm icon-btn--plain" onClick={onOpenDesign} aria-label="Open design panel" style={{ color: 'var(--text-color)' }}>
              <Palette size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6">
          <div className="glow-on-hover" style={{ width: 80, height: 80, borderRadius: 'var(--rounded-full)', border: '2px dashed var(--chrome-border-strong)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Sparkles size={32} style={{ color: 'var(--accent-color)' }} aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '32ch' }}>
            <h2 className="quote-lg" style={{ color: 'var(--text-color)' }}>No Wisdom Found</h2>
            <p className="attribution" style={{ color: 'var(--subtext-color)', textTransform: 'none', fontSize: 14 }}>
              {favoritesOnly
                ? 'Nothing is marked as a favorite yet.'
                : 'Save a line worth remembering and it becomes a card.'}
            </p>
          </div>

          <button type="button" onClick={onOpenAdd} className="chrome-primary">
            Create Quote
          </button>
        </div>

        <div style={{ height: 80 }} aria-hidden="true" />
      </div>
    );
  }

  const activeQuote = filteredQuotes[activeQuoteIndex] || filteredQuotes[0];
  if (!activeQuote) return null;

  const total = filteredQuotes.length;
  const isPlayingStory = isPlaying && !isPausedByUser && !reducedMotion;

  return (
    <figure
      className="flex-1 flex flex-col justify-between relative overflow-hidden"
      style={{ height: '100%', margin: 0 }}
      tabIndex={0}
      aria-label={`Quote ${activeQuoteIndex + 1} of ${total}${favoritesOnly ? ', favorites only' : ''}. Use the left and right arrow keys to browse.`}
      onKeyDown={handleKeyDown}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      {/* Story Progress Indicators at the Top */}
      <div
        aria-hidden="true"
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
              backgroundColor: 'var(--chrome-track)',
              borderRadius: 'var(--rounded-full)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--accent-color)',
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
          gap: 12,
          width: '100%',
          zIndex: 40
        }}
      >
        <span className="label-caps" style={{ color: 'var(--text-color)', opacity: 0.9 }} translate="no">Tathya</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {total > 1 && !reducedMotion && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPausedByUser((v) => !v);
              }}
              aria-pressed={isPausedByUser}
              aria-label="Pause story autoplay"
              className="icon-btn icon-btn--plain"
              style={{ color: 'var(--text-color)' }}
            >
              {isPlayingStory ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFavoritesOnly(!favoritesOnly);
            }}
            aria-pressed={favoritesOnly}
            aria-label={favoritesOnly ? 'Show all quotes' : 'Show favorites only'}
            className="icon-btn icon-btn--plain"
            style={{
              color: 'var(--text-color)',
              opacity: favoritesOnly ? 1 : 0.65
            }}
          >
            <Heart size={20} fill={favoritesOnly ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDesign();
            }}
            aria-label="Open design panel"
            className="icon-btn icon-btn--plain"
            style={{ color: 'var(--text-color)' }}
          >
            <Palette size={20} aria-hidden="true" />
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
        <span className="quote-mark" aria-hidden="true" style={{ fontSize: 100, marginBottom: -20 }}>
          &ldquo;
        </span>

        {/* The Quote Card */}
        <blockquote style={{ margin: 0 }}>
          <p
            className={getQuoteFontSizeClass(activeQuote.text)}
            style={{
              color: 'var(--text-color)',
              marginBottom: 24,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere'
            }}
          >
            {activeQuote.text}
          </p>

          <figcaption style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <cite className="attribution" style={{ color: 'var(--text-color)', opacity: 0.9, lineHeight: 1.2, fontStyle: 'normal' }}>
              {activeQuote.author || 'Anonymous'}
            </cite>

            {activeQuote.source && (
              <span className="label-caps" style={{ color: 'var(--subtext-color)', opacity: 0.85 }}>
                {activeQuote.source}
              </span>
            )}
          </figcaption>
        </blockquote>

        {/* Tags */}
        {activeQuote.tags && activeQuote.tags.length > 0 && (
          <ul
            aria-label="Tags"
            style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24, padding: 0 }}
          >
            {activeQuote.tags.map((tag) => (
              <li key={tag}>
                <span className="chip chip--static">
                  #{tag.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
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
          gap: 16,
          zIndex: 40
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(activeQuote.id);
          }}
          aria-pressed={!!activeQuote.favorite}
          aria-label={activeQuote.favorite ? 'Remove from favorites' : 'Add to favorites'}
          className="icon-btn action-btn"
          style={{
            background: 'color-mix(in srgb, var(--text-color) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--text-color) 18%, transparent)',
            color: 'var(--text-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Heart
            size={20}
            fill={activeQuote.favorite ? 'var(--accent-color)' : 'none'}
            stroke={activeQuote.favorite ? 'var(--accent-color)' : 'currentColor'}
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenShare(activeQuote);
          }}
          aria-label="Share this quote"
          className="icon-btn action-btn"
          style={{
            background: 'color-mix(in srgb, var(--text-color) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--text-color) 18%, transparent)',
            color: 'var(--text-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Share2 size={20} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(activeQuote);
          }}
          aria-label="More options for this quote"
          className="icon-btn action-btn"
          style={{
            background: 'color-mix(in srgb, var(--text-color) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--text-color) 18%, transparent)',
            color: 'var(--text-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <MoreHorizontal size={20} aria-hidden="true" />
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
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenAdd();
          }}
          aria-label="Add a new quote"
          className="glow-on-hover"
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'var(--on-accent, #0d0f0d)',
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
          <Plus size={26} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </figure>
  );
}