import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Link, useLocation } from 'wouter';
import { searchContent, type SearchResult } from '@/lib/search';
import { logSearchEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  onResultClick?: () => void;
}

const HIGHLIGHT_LIMIT = 60;

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

function ResultCard({ result, query, active, onClick }: { result: SearchResult; query: string; active: boolean; onClick: () => void }) {
  return (
    <Link href={result.url} onClick={onClick}>
      <div
        id={`result-${result.id}`}
        className={cn(
          'rounded-xl border p-4 transition-colors',
          active ? 'border-primary bg-primary/5' : 'border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>{result.type}</span>
              {result.category && <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-[0.14em]">{result.category}</Badge>}
            </div>
            <h3 className="truncate text-sm font-semibold text-foreground">{highlightMatch(result.title, query)}</h3>
            {result.description && <p className="line-clamp-2 text-sm text-muted-foreground">{highlightMatch(result.description.slice(0, HIGHLIGHT_LIMIT), query)}</p>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SearchBar({ placeholder = 'Search blog posts, videos, photos...', autoFocus = false, onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [, navigate] = useLocation();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchContent(searchQuery);
      setResults(searchResults);
      setShowResults(true);
      setSelectedIndex(-1);
      logSearchEvent(searchResults.length === 0 ? 'no_results' : 'query', { query: searchQuery, resultCount: searchResults.length });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query, performSearch]);

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
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const result = results[selectedIndex];
          handleResultClick(result);
          navigate(result.url);
        }
        break;
      case 'Escape':
        setShowResults(false);
        break;
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-10"
          aria-expanded={showResults}
          aria-controls="search-results"
          aria-activedescendant={selectedIndex >= 0 ? `result-${results[selectedIndex]?.id}` : undefined}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
        {!loading && query && <Button variant="ghost" size="sm" onClick={handleClear} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" aria-label="Clear search"><X className="h-4 w-4" /></Button>}
      </div>

      {showResults && (
        <Card id="search-results" className="absolute z-50 mt-3 w-full overflow-hidden border border-border/60 bg-background shadow-xl">
          <div className="max-h-[32rem] overflow-auto p-2">
            {loading ? (
              <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No results found. Try a different keyword or category.</div>
            ) : (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <ResultCard key={result.id} result={result} query={query} active={index === selectedIndex} onClick={() => handleResultClick(result)} />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
