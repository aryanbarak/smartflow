import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { globalSearch, type SearchResult } from './searchService';
import { useDebounce } from '@/hooks/useDebounce';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) { setResults([]); return; }
    setLoading(true);
    globalSearch(debouncedQuery).then(r => {
      setResults(r);
      setLoading(false);
    });
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openSearch = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const go = (result: SearchResult) => {
    navigate(result.route);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline text-xs bg-background border border-border rounded px-1 py-0.5 leading-none">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search everything..."
                className="flex-1 bg-transparent text-sm outline-none"
                aria-label="Global search"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="p-1 hover:bg-muted rounded transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="text-center text-xs text-muted-foreground py-6">Searching...</div>
              )}
              {!loading && query && results.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-6">No results found</div>
              )}
              {!loading && results.map(r => (
                <button
                  key={`${r.type}-${r.id}`}
                  type="button"
                  onClick={() => go(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                >
                  <span className="text-lg flex-shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
              {!query && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  Start typing to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
