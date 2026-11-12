import type { Profile } from "../state/profile";

export type TaskMetric = "answers" | "correct" | "cardsFlipped" | "predictions";
export interface Task { id: string; label: string; goal: number; reward: number; metric: TaskMetric }

// Placeholder goals and rewards: tune in playtest.
const VARIANTS: Record<"quiz" | "cards" | "bets", { metric: TaskMetric; goal: number; reward: number; label: string }[]> = {
  quiz: [
    { metric: "answers", goal: 3, reward: 20, label: "Answer 3 questions" },
    { metric: "answers", goal: 5, reward: 40, label: "Answer all 5 questions" },
    { metric: "correct", goal: 3, reward: 30, label: "Get 3 answers right" },
    { metric: "correct", goal: 5, reward: 60, label: "Get a perfect day" },
  ],
  cards: [
    { metric: "cardsFlipped", goal: 1, reward: 10, label: "Read the back of a card" },
    { metric: "cardsFlipped", goal: 3, reward: 25, label: "Read the back of 3 cards" },
  ],
  bets: [
    { metric: "predictions", goal: 1, reward: 20, label: "Place a prediction" },
    { metric: "predictions", goal: 2, reward: 30, label: "Place 2 predictions" },
  ],
};

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

export function dailyTasks(date: string): Task[] {
  const h = hash(date);
  return (Object.keys(VARIANTS) as (keyof typeof VARIANTS)[]).map((group, i) => {
    const options = VARIANTS[group];
    const v = options[(h >>> (i * 4)) % options.length];
    return { id: `${date}:${v.metric}`, label: v.label, goal: v.goal, reward: v.reward, metric: v.metric };
  });
}

/** Task ids start with their date; answers are keyed "date:questionId", flips "date:cardId", bets by market id (starts with the date). */
export function progress(p: Profile, t: Task): number {
  const date = t.id.split(":")[0];
  switch (t.metric) {
    case "answers": return Object.keys(p.answers).filter((k) => k.startsWith(date + ":")).length;
    case "correct": return Object.entries(p.answers).filter(([k, ok]) => ok && k.startsWith(date + ":")).length;
    case "cardsFlipped": return p.flips.filter((k) => k.startsWith(date + ":")).length;
    case "predictions": return p.bets.filter((b) => b.marketId.startsWith(date)).length;
  }
}
