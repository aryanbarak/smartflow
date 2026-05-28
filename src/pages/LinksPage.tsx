import { useState } from 'react';
import { Plus, Globe, ExternalLink, Grid, List, Star, Trash2, Search, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLinks, useCreateLink, useDeleteLink, useToggleFavorite } from '@/features/links/useLinks';

function LinkFavicon({ url, title }: Readonly<{ url: string; title: string }>) {
  try {
    const hostname = new URL(url).hostname;
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt={title}
        className="w-8 h-8 rounded object-contain"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  } catch {
    return <Globe className="w-6 h-6 text-muted-foreground" />;
  }
}

function AddLinkModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const { mutate: create, isPending } = useCreateLink();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  function handleSave() {
    if (!url.trim()) { setError('URL is required'); return; }
    try { new URL(url.trim()); } catch { setError('Invalid URL'); return; }
    if (!title.trim()) { setError('Title is required'); return; }
    create({ url: url.trim(), title: title.trim(), description, tags, is_favorite: false }, {
      onSuccess: () => onClose(),
      onError: () => setError('Failed to save'),
    });
  }

  return (
    <div className="space-y-4 pt-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label>URL</Label>
        <Input placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input placeholder="Website name" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input placeholder="Optional note" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add tag…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            <Tag size={14} />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map(t => (
              <Badge key={t} variant="secondary" className="gap-1 text-xs">
                {t}
                <button type="button" aria-label={`Remove tag ${t}`} onClick={() => removeTag(t)}>
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <Button className="w-full" onClick={handleSave} disabled={isPending}>
        {isPending ? 'Saving…' : 'Save Link'}
      </Button>
    </div>
  );
}

export default function LinksPage() {
  const { data: links = [], isLoading } = useLinks();
  const { mutate: deleteLink } = useDeleteLink();
  const { mutate: toggleFav } = useToggleFavorite();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const allTags = Array.from(new Set(links.flatMap(l => l.tags))).sort((a, b) => a.localeCompare(b));

  const filtered = links.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || l.description.toLowerCase().includes(q);
    const matchTag = !activeTag || l.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe className="text-blue-400" size={22} />
            Web Links
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{links.length} saved links</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus size={16} />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Link</DialogTitle></DialogHeader>
            <AddLinkModal onClose={() => setShowAdd(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search links…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('grid')}>
          <Grid size={16} />
        </Button>
        <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-9 w-9" onClick={() => setViewMode('list')}>
          <List size={16} />
        </Button>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={cn('px-3 py-1 rounded-full text-xs transition-colors', activeTag ? 'bg-muted text-muted-foreground hover:text-foreground' : 'bg-primary text-primary-foreground')}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn('px-3 py-1 rounded-full text-xs transition-colors', activeTag === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Links grid/list */}
      {isLoading && (
        <div className="text-center text-muted-foreground py-12 text-sm">Loading...</div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          <Globe size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No links found</p>
        </div>
      )}
      {!isLoading && filtered.length > 0 && (
        <div className={cn(viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2')}>
          {filtered.map(link => (
            <div
              key={link.id}
              className={cn(
                'group bg-card border border-border rounded-xl p-4 flex gap-3 hover:bg-muted/30 transition-colors',
                viewMode === 'list' && 'items-center'
              )}
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                <LinkFavicon url={link.url} title={link.title} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-primary truncate flex-1"
                  >
                    {link.title}
                  </a>
                  <ExternalLink size={12} className="shrink-0 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {link.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{link.description}</p>
                )}
                {link.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {link.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">#{t}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  aria-label={link.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={() => toggleFav({ id: link.id, current: link.is_favorite })}
                  className={cn('p-1 rounded hover:bg-muted transition-colors', link.is_favorite ? 'text-yellow-400' : 'text-muted-foreground')}
                >
                  <Star size={14} fill={link.is_favorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  aria-label="Delete link"
                  onClick={() => deleteLink(link.id)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
