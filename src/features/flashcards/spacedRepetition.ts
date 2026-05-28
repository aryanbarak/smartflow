import type { Rating } from './types';

export interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  nextReview: string;
}

export function sm2(
  currentEase: number,
  currentInterval: number,
  rating: Rating,
): SM2Result {
  // Quality 0-1 = failed, 2-3 = passed
  let ease = currentEase;
  let interval: number;

  if (rating < 2) {
    interval = 1;
  } else {
    if (currentInterval === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentInterval * ease);
    }
    ease = ease + (0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02));
    if (ease < 1.3) ease = 1.3;
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    easeFactor: Math.round(ease * 1000) / 1000,
    intervalDays: interval,
    nextReview: next.toISOString().split('T')[0],
  };
}
