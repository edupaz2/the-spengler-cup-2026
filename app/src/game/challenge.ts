import type { Profile } from "../state/profile";

export interface QuestionResult { id: string; correct: boolean; score: number }

const PUCKS_PER_CORRECT = 10; // placeholders: tune in playtest
const PERFECT_BONUS = 20;

/** Pay out a finished challenge once per date. */
export function finishChallenge(p: Profile, date: string, results: QuestionResult[]): Profile {
  const marker = `${date}:challenge`;
  if (p.completedTasks.includes(marker)) return p;
  const correct = results.filter((r) => r.correct).length;
  const perfect = results.length > 0 && correct === results.length;
  const points = results.reduce((n, r) => n + r.score, 0);
  return {
    ...p,
    pucks: p.pucks + correct * PUCKS_PER_CORRECT + (perfect ? PERFECT_BONUS : 0),
    xp: p.xp + Math.round(points / 10),
    completedTasks: [...p.completedTasks, marker],
  };
}
