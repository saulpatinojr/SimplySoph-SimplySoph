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

export function SearchBar({ 
  placeholder = 'Search blog posts, videos, photos...', 
  autoFocus = false,
  onResultClick 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [, navigate] = useLocation();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
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
      if (searchResults.length === 0) {
        logSearchEvent('no_results', { query: searchQuery });
      } else {
        logSearchEvent('query', { query: searchQuery, resultCount: searchResults.length });
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, performSearch]);

  // Click outside to close results
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
    if (result) {
      logSearchEvent('result_click', { query, resultId: result.id, resultType: result.type });
    }
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
          aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
        {!loading && query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && results.length > 0 && (
        <Card
          id="search-results"
          className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-lg"
          role="listbox"
        >
          <div className="p-2 space-y-1">
            {results.map((result, index) => (
              <Link
                key={result.id}
                href={result.url}
                onClick={() => handleResultClick(result)}
              >
                <div
                  id={`result-${index}`}
                  className={cn(
                    "p-3 rounded-md cursor-pointer transition-colors",
                    index === selectedIndex ? "bg-accent" : "hover:bg-gray-100"
                  )}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm line-clamp-1">{result.title}</h4>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {result.type}
                    </Badge>
                  </div>
                  {result.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{result.description}</p>
                  )}
                  {result.category && (
                    <p className="text-xs text-gray-500 mt-1">Category: {result.category}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* No Results */}
      {showResults && query && !loading && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full p-4 z-50 shadow-lg">
          <p className="text-sm text-gray-600 text-center">
            No results found for "{query}"
          </p>
        </Card>
      )}
    </div>
  );
}
