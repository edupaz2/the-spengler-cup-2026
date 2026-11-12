import type { Profile } from "../state/profile";

const SPEED_BONUS = 50;
const SPEED_WINDOW_MS = 15000;
const GUESS_POINTS = [100, 80, 60, 40, 20];

export function answerScore(correct: boolean, ms: number): number {
  if (!correct) return 0;
  const left = Math.max(0, 1 - Math.max(0, ms) / SPEED_WINDOW_MS);
  return 100 + Math.round(SPEED_BONUS * left);
}

export function guessScore(cluesUsed: number, correct: boolean): number {
  if (!correct) return 0;
  return GUESS_POINTS[Math.min(Math.max(cluesUsed, 1), GUESS_POINTS.length) - 1];
}

const DAY_MS = 86_400_000;
const shift = (date: string, days: number) => new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

/** Streak = run of consecutive claimed days ending on `date`, counting `date` itself. Idempotent. */
export function streakAfter(p: Profile, date: string): Profile {
  const days = new Set([...p.claimedDoors, date]);
  let streak = 0;
  for (let d = date; days.has(d); d = shift(d, -1)) streak += 1;
  return { ...p, streak };
}

/** Percent correct over answered questions, weighted by difficulty (1 when unknown). */
export function knowledgeRating(p: Profile, difficultyOf: (id: string) => 1 | 2 | 3 = () => 1): number {
  let right = 0;
  let total = 0;
  for (const [id, ok] of Object.entries(p.answers)) {
    const w = difficultyOf(id);
    total += w;
    if (ok) right += w;
  }
  return total === 0 ? 0 : Math.round((100 * right) / total);
}
