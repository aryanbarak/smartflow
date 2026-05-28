import { useState } from 'react';
import { Plus, Trash2, BookOpen, ChevronLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDecks, useCreateDeck, useDeleteDeck, useCards, useDueCards, useAddCard, useDeleteCard, useReviewCard } from '@/features/flashcards/useFlashcards';
import { FlashCard } from '@/features/flashcards/components/FlashCard';
import type { FlashcardDeck, Rating } from '@/features/flashcards/types';

function AddCardForm({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const { mutate: addCard, isPending } = useAddCard(deckId);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  function handleAdd() {
    if (!front.trim() || !back.trim()) return;
    addCard({ front: front.trim(), back: back.trim() }, { onSuccess: () => { setFront(''); setBack(''); onClose(); } });
  }

  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">New Card</span>
        <button type="button" aria-label="Close" onClick={onClose}><X size={14} /></button>
      </div>
      <textarea
        value={front}
        onChange={e => setFront(e.target.value)}
        placeholder="Front (question)"
        rows={2}
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/40"
      />
      <textarea
        value={back}
        onChange={e => setBack(e.target.value)}
        placeholder="Back (answer)"
        rows={2}
        className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="button"
        disabled={!front.trim() || !back.trim() || isPending}
        onClick={handleAdd}
        className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
      >
        {isPending ? 'Adding...' : 'Add Card'}
      </button>
    </div>
  );
}

function DeckView({ deck, onBack }: { deck: FlashcardDeck; onBack: () => void }) {
  const { data: cards = [] } = useCards(deck.id);
  const { data: dueCards = [] } = useDueCards(deck.id);
  const { mutate: deleteCard } = useDeleteCard(deck.id);
  const { mutate: reviewCard } = useReviewCard(deck.id);
  const [mode, setMode] = useState<'browse' | 'review'>('browse');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAddCard, setShowAddCard] = useState(false);
  const [done, setDone] = useState(false);

  function startReview() {
    setReviewIndex(0);
    setDone(false);
    setMode('review');
  }

  function handleRate(rating: Rating) {
    const card = dueCards[reviewIndex];
    if (!card) return;
    reviewCard({ card, rating });
    if (reviewIndex + 1 >= dueCards.length) {
      setDone(true);
    } else {
      setReviewIndex(i => i + 1);
    }
  }

  if (mode === 'review') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMode('browse')} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Back to deck">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold">{deck.name}</h2>
        </div>

        {done ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-4xl">🎉</p>
            <p className="font-semibold text-lg">Session complete!</p>
            <p className="text-sm text-muted-foreground">All due cards reviewed.</p>
            <button
              type="button"
              onClick={() => setMode('browse')}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Back to deck
            </button>
          </div>
        ) : dueCards[reviewIndex] ? (
          <FlashCard
            card={dueCards[reviewIndex]}
            onRate={handleRate}
            remaining={dueCards.length - reviewIndex}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Back to decks">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold">{deck.name}</h2>
          {deck.description && <p className="text-xs text-muted-foreground">{deck.description}</p>}
        </div>
        {dueCards.length > 0 && (
          <button
            type="button"
            onClick={startReview}
            className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Study ({dueCards.length} due)
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowAddCard(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Add card"
        >
          <Plus size={14} />
          Card
        </button>
      </div>

      {showAddCard && <AddCardForm deckId={deck.id} onClose={() => setShowAddCard(false)} />}

      {cards.length === 0 && !showAddCard && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No cards yet</p>
        </div>
      )}

      <div className="space-y-2">
        {cards.map(card => (
          <div key={card.id} className="group bg-card border border-border rounded-xl px-4 py-3 flex gap-3">
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
              <p className="text-sm truncate">{card.front}</p>
              <p className="text-sm text-muted-foreground truncate">{card.back}</p>
            </div>
            <button
              type="button"
              aria-label="Delete card"
              onClick={() => deleteCard(card.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive text-muted-foreground transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { data: decks = [], isLoading } = useDecks();
  const { mutate: createDeck, isPending: creating } = useCreateDeck();
  const { mutate: deleteDeck } = useDeleteDeck();
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleCreate() {
    if (!newName.trim()) return;
    createDeck({ name: newName.trim(), description: newDesc.trim() || undefined }, {
      onSuccess: () => { setNewName(''); setNewDesc(''); setShowAdd(false); },
    });
  }

  if (activeDeck) {
    return <DeckView deck={activeDeck} onBack={() => setActiveDeck(null)} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="text-primary" size={22} />
            Flashcards
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          New Deck
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">New Deck</span>
                <button type="button" aria-label="Close" onClick={() => setShowAdd(false)}><X size={14} /></button>
              </div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Deck name"
                autoFocus
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                disabled={!newName.trim() || creating}
                onClick={handleCreate}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Deck'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="text-center text-muted-foreground py-12 text-sm">Loading...</div>
      )}

      {!isLoading && decks.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No decks yet</p>
          <button type="button" onClick={() => setShowAdd(true)} className="mt-3 text-primary text-sm hover:underline">
            Create your first deck
          </button>
        </div>
      )}

      <div className="space-y-3">
        {decks.map(deck => (
          <div
            key={deck.id}
            className="group bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => setActiveDeck(deck)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') setActiveDeck(deck); }}
            aria-label={`Open deck ${deck.name}`}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{deck.name}</p>
              {deck.description && <p className="text-xs text-muted-foreground truncate">{deck.description}</p>}
            </div>
            <button
              type="button"
              aria-label="Delete deck"
              onClick={e => { e.stopPropagation(); deleteDeck(deck.id); }}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:text-destructive text-muted-foreground transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
