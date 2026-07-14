import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { searchContent, type SearchResult } from '@/lib/search';
import { logSearchEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  onResultClick?: () => void;
}

const HIGHLIGHT_LIMIT = 60;
const DEBOUNCE_MS = 300;

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.trim().toLowerCase()
      ? <mark key={index} className="rounded bg-primary/15 px-0.5 text-foreground">{part}</mark>
      : <React.Fragment key={index}>{part}</React.Fragment>
  );
}

function ResultCard({
  result, query, active, onClick,
}: { result: SearchResult; query: string; active: boolean; onClick: () => void }) {
  return (
    <Link href={result.url} onClick={onClick}>
      <div
        id={`result-${result.id}`}
        role="option"
        aria-selected={active}
        className={cn(
          'rounded-xl border p-4 transition-colors cursor-pointer',
          active
            ? 'border-primary bg-primary/5'
            : 'border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>{result.type}</span>
              {result.category && (
                <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-[0.14em]">
                  {result.category}
                </Badge>
              )}
            </div>
            <h3 className="truncate text-sm font-semibold text-foreground">
              {highlightMatch(result.title, query)}
            </h3>
            {result.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {highlightMatch(result.description.slice(0, HIGHLIGHT_LIMIT), query)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SearchBar({
  placeholder = 'Search posts, videos, photos…',
  autoFocus = false,
  onResultClick,
}: SearchBarProps) {
  const [query, setQuery]               = useState('');
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showResults, setShowResults]   = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  // ── Debounced search ───────────────────────────────────────────────────────
  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();

    // Guard: skip empty queries
    if (!trimmed) {
      setResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const searchResults = await searchContent(trimmed);
      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
      logSearchEvent(
        searchResults.length === 0 ? 'no_results' : 'query',
        { query: trimmed, resultCount: searchResults.length }
      );
    } catch (err) {
      console.error('[Search] error:', err);
      setResults([]);
      setShowResults(true);
      setError('Search is temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => performSearch(query), DEBOUNCE_MS);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query, performSearch]);

  // ── Click-outside close ────────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleClear() {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  }

  function handleResultClick(result?: SearchResult) {
    if (result) logSearchEvent('result_click', { query, resultId: result.id, resultType: result.type });
    setShowResults(false);
    onResultClick?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showResults || results.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        inputRef.current?.blur();
        break;
    }
  }

  const hasQuery   = query.trim().length > 0;
  const noResults  = showResults && !loading && !error && results.length === 0 && hasQuery;

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <Search
          size={16}
          className="absolute left-3 pointer-events-none"
          style={{ color: 'var(--muted-foreground)' }}
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls="search-results-listbox"
          aria-activedescendant={
            selectedIndex >= 0 && results[selectedIndex]
              ? `result-${results[selectedIndex].id}`
              : undefined
          }
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-9 pr-9 h-10 rounded-xl bg-background/70 border-border/60 focus:border-primary/60 transition-colors"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
        />
        {/* Clear / Loader */}
        <div className="absolute right-3 flex items-center">
          {loading && <Loader2 size={15} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />}
          {!loading && hasQuery && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className="flex items-center justify-center h-5 w-5 rounded-full transition-colors"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div
          id="search-results-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-border/60 bg-background shadow-lg overflow-hidden"
          style={{ maxHeight: '380px', overflowY: 'auto' }}
        >
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-3 p-4" style={{ color: 'var(--muted-foreground)' }}>
              <AlertCircle size={16} style={{ color: 'var(--error, #a12c7b)', flexShrink: 0 }} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="p-6 text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Try a different keyword</p>
            </div>
          )}

          {/* Results list */}
          {!error && results.length > 0 && (
            <div className="p-2 space-y-1">
              {results.map((result, i) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  query={query}
                  active={i === selectedIndex}
                  onClick={() => handleResultClick(result)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
