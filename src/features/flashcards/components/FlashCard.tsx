import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RATING_CONFIG, type Rating, type Flashcard } from '../types';

interface FlashCardProps {
  card: Flashcard;
  onRate: (rating: Rating) => void;
  remaining: number;
}

const RATINGS: Rating[] = [0, 1, 2, 3];

export function FlashCard({ card, onRate, remaining }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);

  function handleRate(rating: Rating) {
    setFlipped(false);
    setTimeout(() => onRate(rating), 150);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <p className="text-xs text-muted-foreground">{remaining} card{remaining !== 1 ? 's' : ''} remaining</p>

      <div
        className="w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(v => !v)}
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Show question' : 'Reveal answer'}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setFlipped(v => !v); }}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '180px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-card border border-border rounded-2xl p-8 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-lg font-medium text-center">{card.front}</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-2xl p-8 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-lg text-center">{card.back}</p>
          </div>
        </div>
      </div>

      {!flipped && (
        <p className="text-xs text-muted-foreground">Tap card to reveal answer</p>
      )}

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 w-full"
          >
            {RATINGS.map(r => {
              const cfg = RATING_CONFIG[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRate(r)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-transform hover:scale-105 active:scale-95"
                  style={{ backgroundColor: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
