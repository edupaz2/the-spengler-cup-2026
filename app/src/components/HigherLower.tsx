import { useState } from "preact/hooks";
import type { HigherLower as HL } from "../types";

export function HigherLowerView({ q, onAnswer }: { q: HL; onAnswer: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const pick = (side: "a" | "b") => { if (picked) return; setPicked(side); onAnswer(side === q.answer); };
  return (
    <div class="higher-lower">
      <p class="prompt">{q.prompt}</p>
      <div class="hl-options">
        {(["a", "b"] as const).map((side) => (
          <button key={side} type="button" disabled={picked !== null} onClick={() => pick(side)}>
            {q[side].label}
            {picked && <strong class="value">{q[side].value}</strong>}
          </button>
        ))}
      </div>
    </div>
  );
}
