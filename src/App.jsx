import React, { useState, useEffect } from 'react';
import FeedView from './components/FeedView';
import AddFlow from './components/AddFlow';
import SuccessView from './components/SuccessView';
import ShareSheet from './components/ShareSheet';
import { Heart, Trash2, Share2, ArrowDown, X } from 'lucide-react';

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
  const [quotes, setQuotes] = useState(() => {
    const saved = localStorage.getItem('tathya_wisdom_quotes');
    return saved ? JSON.parse(saved) : DEFAULT_QUOTES;
  });

  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'add' | 'success'
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [savedQuotePreview, setSavedQuotePreview] = useState(null);
  
  // Modals & Bottom sheets
  const [selectedQuote, setSelectedQuote] = useState(null); // Quote selected for options
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Sync to local storage
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
    
    // Add to quotes list
    setQuotes((prev) => [quoteObject, ...prev]);
    
    // Set preview quote for Success screen
    setSavedQuotePreview(quoteObject);
    
    // Go to success screen
    setActiveTab('success');
  };

  const handleDeleteQuote = (id) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
    setIsMenuOpen(false);
    setSelectedQuote(null);
    
    // Reset active index if it goes out of bounds
    if (activeQuoteIndex > 0 && activeQuoteIndex >= quotes.length - 1) {
      setActiveQuoteIndex(quotes.length - 2);
    }
  };

  // Navigations from Success view
  const handleViewInLibrary = () => {
    if (savedQuotePreview) {
      // Find the index of the newly added quote in the main or filtered list
      const index = quotes.findIndex(q => q.id === savedQuotePreview.id);
      if (index !== -1) {
        setFavoritesOnly(false); // Make sure show all is active to see it
        setActiveQuoteIndex(index);
      }
    }
    setActiveTab('feed');
  };

  const handleAddAnother = () => {
    setSavedQuotePreview(null);
    setActiveTab('add');
  };

  return (
    <div className="app-container">
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

      {/* Success/Confirmation Screen */}
      {activeTab === 'success' && (
        <SuccessView
          quote={savedQuotePreview}
          onViewLibrary={handleViewInLibrary}
          onAddAnother={handleAddAnother}
        />
      )}

      {/* Share Sheet Overlay Modal */}
      {isShareOpen && selectedQuote && (
        <ShareSheet
          quote={selectedQuote}
          onClose={() => {
            setIsShareOpen(false);
            setSelectedQuote(null);
          }}
        />
      )}

      {/* Contextual Options Drawer (Bottom Sheet) */}
      {isMenuOpen && selectedQuote && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => {
            setIsMenuOpen(false);
            setSelectedQuote(null);
          }}
        >
          {/* Glass drawer panel */}
          <div 
            className="glass-panel animate-slide-up"
            style={{
              backgroundColor: '#161816',
              borderTopLeftRadius: 'var(--rounded-lg)',
              borderTopRightRadius: 'var(--rounded-lg)',
              padding: '24px var(--spacing-edge-margin) 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              borderBottom: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Horizontal slider bar */}
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 12 }} />

            {/* Quote attribution metadata preview */}
            <div style={{ paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="attribution" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>SELECTED WISDOM</p>
              <p style={{ fontSize: 13, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-quote)' }}>
                "{selectedQuote.text}"
              </p>
            </div>

            {/* Favorite button */}
            <button
              onClick={() => {
                handleToggleFavorite(selectedQuote.id);
                // Update selected quote state so ui reflects change
                setSelectedQuote(prev => ({ ...prev, favorite: !prev.favorite }));
                setIsMenuOpen(false);
              }}
              className="scale-press"
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 'var(--rounded-default)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontFamily: 'var(--font-attribution)',
                fontSize: 14,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Heart size={18} fill={selectedQuote.favorite ? "white" : "none"} style={{ color: selectedQuote.favorite ? 'var(--color-error)' : 'inherit' }} />
              {selectedQuote.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>

            {/* Share button */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsShareOpen(true);
              }}
              className="scale-press"
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 'var(--rounded-default)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontFamily: 'var(--font-attribution)',
                fontSize: 14,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Share2 size={18} />
              Share and Customize Layout
            </button>

            {/* Delete button (Destructive) */}
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this quote from your library?")) {
                  handleDeleteQuote(selectedQuote.id);
                }
              }}
              className="scale-press"
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: 'var(--rounded-default)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontFamily: 'var(--font-attribution)',
                fontSize: 14,
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Trash2 size={18} />
              Delete Permanently
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setSelectedQuote(null);
              }}
              className="scale-press"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 'var(--rounded-default)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font-label)',
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: '0.1em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              <ArrowDown size={14} />
              DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
