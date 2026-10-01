import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Lightbulb, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { searchContent, SearchResultItem } from '../../services/searchService';
import '../../styles/navbarSearch.css';

interface NavbarSearchProps {
  onSelectResult?: () => void;
  className?: string;
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({ onSelectResult, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchContent(trimmed);
        setResults(data);
        setHighlightedIndex(data.length > 0 ? 0 : -1);
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectResult) onSelectResult();
    navigate(item.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setHighlightedIndex(prev => (prev + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setHighlightedIndex(prev => (prev - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    }
  };

  return (
    <div className={`nav-search-wrapper ${className}`} ref={containerRef}>
      <div className={`nav-search-bar ${isOpen ? 'active' : ''}`}>
        <Search size={15} className="nav-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="nav-search-input"
          placeholder="Search ideas, forum..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Search content"
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
        {isLoading ? (
          <Loader2 size={13} className="nav-search-icon animate-spin" />
        ) : query ? (
          <button
            type="button"
            className="nav-search-clear"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            title="Clear search"
          >
            <X size={13} />
          </button>
        ) : (
          <kbd className="nav-search-kbd">Ctrl+K</kbd>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="nav-search-dropdown" role="listbox">
          <div className="nav-search-header">
            <span>Results ({results.length})</span>
            <span style={{ fontSize: '0.7rem' }}>Fuzzy & Full-Text Search</span>
          </div>

          {results.length === 0 && !isLoading ? (
            <div className="nav-search-empty">
              No matching ideas or forum discussions found for "{query}".
            </div>
          ) : (
            <ul className="nav-search-list">
              {results.map((item, index) => {
                const isIdea = item.type === 'idea';
                const isSelected = index === highlightedIndex;

                return (
                  <li
                    key={`${item.type}-${item.id}`}
                    className={`nav-search-item ${isSelected ? 'highlighted' : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="nav-search-item-top">
                      <span className="nav-search-item-title">{item.title}</span>
                      <span className={`nav-search-tag ${isIdea ? 'idea' : 'forum'}`}>
                        {isIdea ? <Lightbulb size={11} /> : <MessageSquare size={11} />}
                        {isIdea ? 'Idea' : 'Forum'}
                      </span>
                    </div>

                    <div className="nav-search-snippet">{item.snippet}</div>

                    <div className="nav-search-meta">
                      <span>🏷️ {item.category}</span>
                      <span>•</span>
                      <span>👤 {item.author_name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="nav-search-footer">
            <span>Use ↑↓ to navigate, Enter to select, Esc to dismiss</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              Jump <ArrowRight size={11} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
