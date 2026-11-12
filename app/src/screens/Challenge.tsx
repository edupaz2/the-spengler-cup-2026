import { useState } from "preact/hooks";
import { QuestionView } from "../components/QuestionView";
import type { QuestionResult } from "../game/challenge";
import type { DayPack } from "../types";

export interface ChallengeProps {
  pack: DayPack;
  onFinish: (results: QuestionResult[]) => void;
  /** Called once per question as it is answered, so the caller can save progress. */
  onAnswer?: (id: string, correct: boolean, score: number) => void;
  /** Already answered questions (id -> correct), e.g. after a reload. They are skipped, not re-awarded. */
  answered?: Record<string, boolean>;
}

export function Challenge({ pack, onFinish, onAnswer, answered = {} }: ChallengeProps) {
  const qs = pack.questions;
  const firstOpen = qs.findIndex((q) => !(q.id in answered));
  const start = firstOpen === -1 ? qs.length : firstOpen;
  const [index, setIndex] = useState(start);
  const [results, setResults] = useState<QuestionResult[]>(
    qs.slice(0, start).map((q) => ({ id: q.id, correct: answered[q.id], score: answered[q.id] ? 100 : 0 })),
  );

  if (index >= qs.length) {
    return <button type="button" class="primary" onClick={() => onFinish(results)}>Finish</button>;
  }
  const q = qs[index];
  return (
    <section class="challenge">
      <p class="muted">Question {index + 1} of {qs.length}</p>
      <QuestionView
        key={q.id}
        q={q}
        last={index === qs.length - 1}
        onAnswer={(correct, score) => {
          const r = { id: q.id, correct, score };
          setResults((all) => [...all, r]);
          onAnswer?.(q.id, correct, score);
        }}
        onNext={() => (index === qs.length - 1 ? onFinish(results) : setIndex(index + 1))}
      />
    </section>
  );
}
