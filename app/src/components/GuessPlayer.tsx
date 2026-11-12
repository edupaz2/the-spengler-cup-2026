import { useState } from "preact/hooks";
import type { GuessPlayer as GP } from "../types";

export function GuessPlayerView({ q, onAnswer }: { q: GP; onAnswer: (correct: boolean, cluesUsed: number) => void }) {
  const [clues, setClues] = useState(1);
  const [done, setDone] = useState(false);
  return (
    <div class="guess-player">
      <ol class="clues">
        {q.clues.slice(0, clues).map((c, i) => <li key={i}>{c}</li>)}
      </ol>
      {!done && clues < q.clues.length && (
        <button type="button" onClick={() => setClues(clues + 1)}>Another clue (worth less)</button>
      )}
      <div class="options">
        {q.options.map((o, i) => (
          <button key={o} type="button" disabled={done} onClick={() => { setDone(true); onAnswer(i === q.answerIndex, clues); }}>{o}</button>
        ))}
      </div>
    </div>
  );
}
