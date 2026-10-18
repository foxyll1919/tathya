import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { DEFAULT_QUOTE_THEME, PRESET_TAGS, QUOTE_THEMES } from '../design/quoteThemes';

export default function AddFlow({ onSave, onCancel }) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_QUOTE_THEME);
  const [tags, setTags] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);
  const tagInputRef = useRef(null);
  const uid = useId();
  const ids = {
    quote: `${uid}-quote`,
    author: `${uid}-author`,
    source: `${uid}-source`,
    tag: `${uid}-tag`,
    error: `${uid}-error`,
  };

  useEffect(() => {
    if (!isAddingTag) return;
    tagInputRef.current?.focus();
  }, [isAddingTag]);

  const handleSave = () => {
    const cleanText = text.trim();
    if (!cleanText) {
      setError('Add the quote text before saving.');
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    onSave({
      text: cleanText,
      author: author.trim() || 'Anonymous',
      source: source.trim(),
      theme: selectedTheme.name,
      tags,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSave();
    }
  };

  const handleToggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  const quoteFontSize = text.length > 150 ? 22 : text.length > 60 ? 28 : 32;

  return (
    <div
      className="flex-1 flex flex-col justify-between theme-charcoal-solid animate-slide-up"
      style={{ height: '100%', backgroundColor: '#121412', color: '#e2e3df' }}
      onKeyDown={handleKeyDown}
    >
      {/* Top Header */}
      <header
        style={{
          marginTop: 'var(--spacing-safe-area-top)',
          paddingLeft: 'var(--spacing-edge-margin)',
          paddingRight: 'var(--spacing-edge-margin)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          minHeight: 56,
          borderBottom: 'var(--hairline) solid var(--chrome-border)'
        }}
      >
        <button type="button" onClick={onCancel} className="icon-btn icon-btn--sm icon-btn--plain" aria-label="Cancel and return to feed" style={{ color: 'var(--chrome-fg)' }}>
          <X size={22} aria-hidden="true" />
        </button>

        <h1 className="label-caps" style={{ letterSpacing: '0.15em' }}>
          Add Quote
        </h1>

        <button
          type="button"
          onClick={handleSave}
          className="icon-btn icon-btn--sm icon-btn--plain"
          aria-label="Save quote"
          style={{ color: 'var(--chrome-fg)' }}
        >
          <Check size={22} aria-hidden="true" />
        </button>
      </header>

      {/* Main Quote Input Section */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--spacing-edge-margin)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          gap: 16
        }}
      >
        {/* Selected + custom tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleTag(tag)}
              aria-pressed="true"
              className="chip"
            >
              #{tag.toUpperCase()}
            </button>
          ))}

          {!isAddingTag ? (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="chip"
              style={{ borderStyle: 'dashed', background: 'none', color: 'var(--chrome-fg-muted)' }}
            >
              <Plus size={10} aria-hidden="true" />
              Tag
            </button>
          ) : (
            <form onSubmit={handleAddCustomTag}>
              <label className="sr-only" htmlFor={ids.tag}>
                New tag name
              </label>
              <input
                id={ids.tag}
                ref={tagInputRef}
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onBlur={() => setIsAddingTag(false)}
                placeholder="tag name…"
                autoComplete="off"
                style={{
                  background: 'var(--chrome-surface-2)',
                  border: 'var(--hairline) solid var(--chrome-border-strong)',
                  borderRadius: 'var(--rounded-full)',
                  padding: '6px 12px',
                  minHeight: 32,
                  color: 'var(--chrome-fg)',
                  fontFamily: 'var(--font-label)',
                  fontSize: 11,
                  width: 120
                }}
              />
            </form>
          )}
        </div>

        {/* Quote text */}
        <div className="underline-field" style={{ flex: '1 1 auto', minHeight: 180 }}>
          <label className="underline-field__label" htmlFor={ids.quote}>
            Quote
          </label>
          <textarea
            id={ids.quote}
            ref={textareaRef}
            name="quote"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Type your universal truth…"
            aria-describedby={error ? ids.error : undefined}
            aria-invalid={error ? 'true' : undefined}
            style={{
              width: '100%',
              minHeight: 180,
              flex: '1 1 auto',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-color, #ffffff)',
              resize: 'none',
              fontFamily: 'var(--font-quote)',
              fontWeight: 'var(--quote-weight, 700)',
              fontSize: `${quoteFontSize}px`,
              lineHeight: 'var(--quote-leading, 1.3)',
              letterSpacing: 'var(--quote-tracking, 0)',
              opacity: text ? 1 : 0.6,
              paddingTop: 8
            }}
          />
          {error && (
            <p
              id={ids.error}
              role="alert"
              style={{
                fontFamily: 'var(--font-attribution)',
                fontSize: 13,
                color: 'var(--danger-fg)',
                paddingTop: 8
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Attribution */}
        <div className="underline-field">
          <label className="underline-field__label" htmlFor={ids.author}>
            Author
          </label>
          <input
            id={ids.author}
            className="underline-field__control"
            type="text"
            name="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Anonymous"
            autoComplete="off"
          />
        </div>

        <div className="underline-field">
          <label className="underline-field__label" htmlFor={ids.source}>
            Source
          </label>
          <input
            id={ids.source}
            className="underline-field__control"
            type="text"
            name="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Book, speech, podcast (optional)"
            autoComplete="off"
          />
        </div>

        {/* Suggested tags */}
        <div>
          <p className="underline-field__label" style={{ marginBottom: 10 }}>
            Suggested Tags
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                aria-pressed={tags.includes(tag)}
                className="chip"
                style={{ textTransform: 'none', letterSpacing: '0.02em' }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card Color (sticky footer) */}
      <div
        style={{
          padding: '18px var(--spacing-edge-margin)',
          borderTop: 'var(--hairline) solid var(--chrome-border)',
          background: 'var(--chrome-bg)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="label-caps" id="card-color-label" style={{ color: 'var(--chrome-fg-muted)', fontSize: 11 }}>
            Card Color
          </span>
          <span className="label-caps" style={{ color: 'var(--accent-color)', fontSize: 10 }}>
            {selectedTheme.name}
          </span>
        </div>

        <div
          role="group"
          aria-labelledby="card-color-label"
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
        >
          {QUOTE_THEMES.map((themeOption) => (
            <label
              key={themeOption.name}
              className="design-palette-card"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                minHeight: 0,
                width: 'auto',
                flexGrow: 1,
                padding: '8px 10px'
              }}
            >
              <input
                type="radio"
                name="tathya-card-color"
                className="sr-only"
                value={themeOption.name}
                checked={selectedTheme.name === themeOption.name}
                onChange={() => setSelectedTheme(themeOption)}
              />
              <span
                aria-hidden="true"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 'var(--rounded-full)',
                  background: themeOption.preview,
                  border: 'var(--hairline) solid var(--chrome-border-strong)',
                  flex: '0 0 auto'
                }}
              />
              <span className="design-palette-card__name" style={{ fontSize: 10 }}>
                {themeOption.name}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}