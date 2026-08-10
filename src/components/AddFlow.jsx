import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Plus, Tag as TagIcon } from 'lucide-react';

const PRESET_THEMES = [
  { name: 'Midnight Cobalt', class: 'theme-midnight-cobalt', style: { background: 'linear-gradient(135deg, #10162f 0%, #0b0d1a 100%)' } },
  { name: 'Ethereal Dawn', class: 'theme-ethereal-dawn', style: { background: 'linear-gradient(135deg, #2b1e42 0%, #0d0c15 100%)' } },
  { name: 'Forest Green', class: 'theme-forest-green', style: { background: 'linear-gradient(135deg, #0b2518 0%, #030805 100%)' } },
  { name: 'Sunset Orange', class: 'theme-sunset-orange', style: { background: 'linear-gradient(135deg, #380e14 0%, #0c0204 100%)' } },
  { name: 'Sand Solid', class: 'theme-sand-solid', style: { background: '#f5f2eb' } },
  { name: 'Charcoal Solid', class: 'theme-charcoal-solid', style: { background: '#121412' } },
];

const PRESET_TAGS = ['philosophy', 'mindfulness', 'wisdom', 'life', 'science', 'art'];

export default function AddFlow({ onSave, onCancel }) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(PRESET_THEMES[0]);
  const [tags, setTags] = useState([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const textareaRef = useRef(null);

  // Focus textarea on load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      text: text.trim(),
      author: author.trim() || 'Anonymous',
      source: source.trim() || '',
      theme: selectedTheme.name,
      tags: tags
    });
  };

  const handleToggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const cleanTag = newTagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  // Font sizing calculations
  const getFontSize = () => {
    const len = text.length;
    if (len < 60) return { fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-quote)' };
    if (len > 150) return { fontSize: '22px', fontWeight: '600', fontFamily: 'var(--font-quote)' };
    return { fontSize: '28px', fontWeight: '700', fontFamily: 'var(--font-quote)' };
  };

  const currentThemeClass = selectedTheme.class;

  return (
    <div 
      className="flex-1 flex flex-col justify-between theme-charcoal-solid animate-slide-up"
      style={{ 
        height: '100%',
        backgroundColor: '#121412',
        color: '#e2e3df',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Header */}
      <div 
        style={{ 
          marginTop: 'var(--spacing-safe-area-top)',
          paddingLeft: 'var(--spacing-edge-margin)',
          paddingRight: 'var(--spacing-edge-margin)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 48,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <button 
          onClick={onCancel}
          className="scale-press"
          style={{ background: 'none', border: 'none', color: '#e2e3df', cursor: 'pointer', padding: 4 }}
        >
          <X size={24} />
        </button>
        
        <span className="label-caps" style={{ letterSpacing: '0.15em', fontWeight: 600 }}>ADD QUOTE</span>
        
        <button 
          onClick={handleSave}
          disabled={!text.trim()}
          className="scale-press"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: text.trim() ? '#ffffff' : 'rgba(255,255,255,0.2)', 
            cursor: text.trim() ? 'pointer' : 'default', 
            padding: 4 
          }}
        >
          <Check size={24} />
        </button>
      </div>

      {/* Main Quote Input Section */}
      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 'var(--spacing-edge-margin)', 
          overflowY: 'auto',
          gap: 20
        }}
      >
        {/* Dynamic Tag Management */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {tags.map((tag, i) => (
            <span 
              key={i} 
              onClick={() => handleToggleTag(tag)}
              className="label-caps scale-press"
              style={{ 
                padding: '4px 10px', 
                borderRadius: 'var(--rounded-full)', 
                border: '1px solid #ffffff',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: 10,
                cursor: 'pointer'
              }}
            >
              #{tag.toUpperCase()}
            </span>
          ))}

          {!isAddingTag ? (
            <button
              onClick={() => setIsAddingTag(true)}
              className="scale-press label-caps"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 'var(--rounded-full)',
                border: '1px dashed rgba(255,255,255,0.3)',
                background: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 10,
                cursor: 'pointer'
              }}
            >
              <Plus size={10} /> TAG
            </button>
          ) : (
            <form onSubmit={handleAddCustomTag} style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="tag name..."
                onBlur={() => {
                  if(!newTagInput.trim()) setIsAddingTag(false);
                }}
                autoFocus
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 'var(--rounded-full)',
                  padding: '2px 8px',
                  color: 'white',
                  fontFamily: 'var(--font-label)',
                  fontSize: 10,
                  outline: 'none',
                  width: 80
                }}
              />
            </form>
          )}
        </div>

        {/* Text Area Input for Quote */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your universal truth..."
          style={{
            ...getFontSize(),
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            resize: 'none',
            minHeight: 180,
            lineHeight: 1.25,
            opacity: text ? 1 : 0.4,
            paddingTop: 10
          }}
        />

        {/* Inputs for Author & Source */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-attribution)' }}>Author</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Anonymous"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontFamily: 'var(--font-attribution)',
                fontSize: 14,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-attribution)' }}>Source</span>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Book, speech, podcast (optional)"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontFamily: 'var(--font-attribution)',
                fontSize: 14,
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Suggested presets tags */}
        <div style={{ marginTop: 20 }}>
          <p className="label-caps" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontSize: 10 }}>SUGGESTED TAGS</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESET_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className="scale-press label-caps"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--rounded-full)',
                    background: active ? 'white' : 'rgba(255,255,255,0.05)',
                    border: active ? '1px solid white' : '1px solid rgba(255,255,255,0.1)',
                    color: active ? 'black' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: 10
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Theme Selector (Sticky at Bottom) */}
      <div 
        style={{ 
          padding: '20px var(--spacing-edge-margin)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: '#0d0f0d'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="label-caps" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>SELECT THEME</span>
          <span className="label-caps" style={{ color: '#white', fontSize: 10, opacity: 0.8 }}>{selectedTheme.name}</span>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            gap: 12, 
            overflowX: 'auto', 
            paddingBottom: 4,
            scrollSnapType: 'x mandatory'
          }}
        >
          {PRESET_THEMES.map((theme) => {
            const isSelected = selectedTheme.name === theme.name;
            const innerPreviewText = theme.class.includes('sand') ? '#1e201e' : '#ffffff';
            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => setSelectedTheme(theme)}
                className="scale-press"
                style={{
                  ...theme.style,
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--rounded-full)',
                  border: isSelected ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isSelected ? '0 0 12px rgba(255,255,255,0.2)' : 'none',
                  outline: 'none'
                }}
              >
                <span 
                  style={{ 
                    fontFamily: 'var(--font-quote)', 
                    fontSize: 11, 
                    fontWeight: 'bold', 
                    color: innerPreviewText,
                    opacity: 0.8
                  }}
                >
                  Aa
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
