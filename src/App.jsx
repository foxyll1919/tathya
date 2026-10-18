import React, { useState, useEffect, useMemo } from 'react';
import FeedView from './components/FeedView';
import AddFlow from './components/AddFlow';
import SuccessView from './components/SuccessView';
import ShareSheet from './components/ShareSheet';
import DesignPanel from './components/DesignPanel';
import OptionsSheet from './components/OptionsSheet';
import ConfirmDialog from './components/ConfirmDialog';
import PhotoBackdrop from './components/PhotoBackdrop';
import { useTimeTheme } from './hooks/useTimeTheme';
import { useDesign } from './hooks/useDesign';
import { poolFor, resolveBackdrop, surfaceTone, tintFor } from './design/photoPresets';
import { effectiveCardColors } from './utils/cardExport/cardColors';

const DEFAULT_QUOTES = [
  {
    id: '1',
    text: "The most beautiful things in the world cannot be seen or touched, they are felt with the heart.",
    author: "Antoine de Saint-Exupéry",
    source: "The Little Prince",
    theme: "Midnight Cobalt",
    tags: ["mindfulness", "wisdom"],
    favorite: false
  },
  {
    id: '2',
    text: "The only constant in life is change.",
    author: "Heraclitus",
    source: "Ancient Greece",
    theme: "Sunset Orange",
    tags: ["wisdom", "philosophy"],
    favorite: true
  },
  {
    id: '3',
    text: "Silence is a source of great strength.",
    author: "Lao Tzu",
    source: "Tao Te Ching",
    theme: "Forest Green",
    tags: ["philosophy"],
    favorite: false
  },
  {
    id: '4',
    text: "The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.",
    author: "Carl Sagan",
    source: "Cosmos",
    theme: "Ethereal Dawn",
    tags: ["science", "mindfulness"],
    favorite: false
  }
];

export default function App() {
  const { theme } = useTimeTheme();
  const {
    style,
    palette,
    photoMode,
    photoId,
    setStyle,
    setPalette,
    setPhotoMode,
    setPhotoId,
    cyclePhoto,
    resetDesign,
  } = useDesign();

  const [quotes, setQuotes] = useState(() => {
    const saved = localStorage.getItem('tathya_wisdom_quotes');
    return saved ? JSON.parse(saved) : DEFAULT_QUOTES;
  });

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'add' | 'success'
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [savedQuotePreview, setSavedQuotePreview] = useState(null);

  // Overlays — at most one confirmation/design surface at a time.
  const [selectedQuote, setSelectedQuote] = useState(null); // Quote the options sheet acts on
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Sync quotes to local storage
  useEffect(() => {
    localStorage.setItem('tathya_wisdom_quotes', JSON.stringify(quotes));
  }, [quotes]);

  const handleToggleFavorite = (id) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, favorite: !q.favorite } : q))
    );
  };

  const handleAddQuote = (newQuote) => {
    const quoteObject = {
      id: Date.now().toString(),
      ...newQuote,
      favorite: false
    };

    setQuotes((prev) => [quoteObject, ...prev]);
    setSavedQuotePreview(quoteObject);
    setActiveTab('success');
  };

  const handleViewInLibrary = () => {
    if (savedQuotePreview) {
      const index = quotes.findIndex(q => q.id === savedQuotePreview.id);
      if (index !== -1) {
        setFavoritesOnly(false);
        setActiveQuoteIndex(index);
      }
    }
    setActiveTab('feed');
  };

  const handleAddAnother = () => {
    setSavedQuotePreview(null);
    setActiveTab('add');
  };

  const closeOverlays = () => {
    setIsMenuOpen(false);
    setIsShareOpen(false);
    setIsDesignOpen(false);
    setPendingDelete(null);
    setSelectedQuote(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    setQuotes((prev) => prev.filter((q) => q.id !== pendingDelete.id));
    setActiveQuoteIndex((prev) => (prev > 0 ? prev - 1 : 0));
    closeOverlays();
  };

  const filteredQuotes = favoritesOnly ? quotes.filter(q => q.favorite) : quotes;
  const activeQuote = filteredQuotes[activeQuoteIndex];
  const themeClass = activeQuote && activeTab === 'feed'
    ? `theme-${activeQuote.theme.toLowerCase().replace(/\s+/g, '-')}`
    : 'theme-charcoal-solid';

  // Backdrop resolution is pure derivation from (style, palette, photoId),
  // so it is memoized rather than recomputed on every quote advance.
  const photoPool = useMemo(() => poolFor(style, palette), [style, palette]);
  const backdrop = useMemo(
    () => (photoMode === 'on' ? resolveBackdrop(style, palette, photoId) : null),
    [photoMode, style, palette, photoId]
  );

  // The CSS cascade resolves light/dark on its own; the canvas export
  // bake cannot read custom properties, so the same decision is made
  // here and handed down explicitly.
  const photoTone = useMemo(
    () =>
      surfaceTone({
        palette,
        quoteTheme: activeQuote?.theme,
        timeTheme: theme,
      }),
    [palette, activeQuote?.theme, theme]
  );
  const photoTint = useMemo(() => tintFor(palette, photoTone), [palette, photoTone]);

  // The exported card must paint the same colours the live cascade
  // resolves, otherwise `paper` would put white text on a light scrim.
  const cardColors = useMemo(
    () =>
      effectiveCardColors({
        palette,
        quoteTheme: activeQuote?.theme,
        tone: photoTone,
      }),
    [palette, activeQuote?.theme, photoTone]
  );

  return (
    <div
      className={`app-container ${themeClass}`}
      data-theme={theme}
      data-style={style}
      data-palette={palette}
    >
      <a className="skip-link" href="#main">
        Skip to quote
      </a>

      <PhotoBackdrop photo={backdrop} tint={photoTint} visible={activeTab === 'feed'} />

      <main id="main" tabIndex={-1}>
        {/* Feed View */}
        {activeTab === 'feed' && (
          <FeedView
            quotes={quotes}
            activeQuoteIndex={activeQuoteIndex}
            setActiveQuoteIndex={setActiveQuoteIndex}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            onOpenMenu={(quote) => {
              setSelectedQuote(quote);
              setIsMenuOpen(true);
            }}
            onToggleFavorite={handleToggleFavorite}
            onOpenShare={(quote) => {
              setSelectedQuote(quote);
              setIsShareOpen(true);
            }}
            onOpenDesign={() => setIsDesignOpen(true)}
            onOpenAdd={() => setActiveTab('add')}
          />
        )}

        {/* Add Flow View */}
        {activeTab === 'add' && (
          <AddFlow
            onSave={handleAddQuote}
            onCancel={() => setActiveTab('feed')}
          />
        )}

        {/* Success View */}
        {activeTab === 'success' && (
          <SuccessView
            quote={savedQuotePreview}
            onViewLibrary={handleViewInLibrary}
            onAddAnother={handleAddAnother}
          />
        )}
      </main>

      {/* Contextual Options Drawer */}
      {isMenuOpen && selectedQuote && (
        <OptionsSheet
          quote={selectedQuote}
          onToggleFavorite={() => {
            handleToggleFavorite(selectedQuote.id);
            setSelectedQuote((prev) => ({ ...prev, favorite: !prev.favorite }));
            closeOverlays();
          }}
          onShare={() => {
            setIsMenuOpen(false);
            setIsShareOpen(true);
          }}
          onOpenDesign={() => {
            setIsMenuOpen(false);
            setIsDesignOpen(true);
          }}
          onRequestDelete={() => {
            setIsMenuOpen(false);
            setPendingDelete(selectedQuote);
          }}
          onClose={closeOverlays}
        />
      )}

      {/* Delete Confirmation */}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this quote?"
          description={
            pendingDelete.text.length > 120
              ? `“${pendingDelete.text.slice(0, 117).trimEnd()}…” will be removed from your library. This cannot be undone.`
              : `“${pendingDelete.text}” will be removed from your library. This cannot be undone.`
          }
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {/* Design & Colour Panel */}
      {isDesignOpen && (
        <DesignPanel
          style={style}
          palette={palette}
          photoMode={photoMode}
          photoPool={photoPool}
          backdrop={backdrop}
          onStyleChange={setStyle}
          onPaletteChange={setPalette}
          onPhotoModeChange={setPhotoMode}
          onPhotoChange={setPhotoId}
          onCyclePhoto={() => cyclePhoto(photoPool)}
          onReset={resetDesign}
          onClose={() => setIsDesignOpen(false)}
        />
      )}

      {/* Share Sheet */}
      {isShareOpen && selectedQuote && (
        <ShareSheet
          quote={selectedQuote}
          style={style}
          palette={palette}
          backdrop={backdrop}
          tint={photoTint}
          colors={cardColors}
          onClose={() => {
            setIsShareOpen(false);
            setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
}
