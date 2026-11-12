import { useState } from "preact/hooks";
import { answerScore, guessScore } from "../game/scoring";
import type { Question } from "../types";
import { GuessPlayerView } from "./GuessPlayer";
import { HigherLowerView } from "./HigherLower";
import { Reveal } from "./Reveal";

export function categoryLabel(q: Question): string {
  switch (q.kind) {
    case "bank": return q.category === "rules" ? "Hockey 101" : "Tournament History";
    case "hidden_hero": return "Hidden Hero";
    case "higher_lower": return "Higher or Lower";
    case "guess_player": return "Guess the Player";
  }
}

export function QuestionView({ q, last, onAnswer, onNext }: {
  q: Question; last: boolean; onAnswer: (correct: boolean, score: number) => void; onNext: () => void;
}) {
  const [started] = useState(() => Date.now());
  const [result, setResult] = useState<{ correct: boolean } | null>(null);
  const settle = (correct: boolean, score?: number) => {
    setResult({ correct });
    onAnswer(correct, score ?? answerScore(correct, Date.now() - started));
  };

  let body;
  let detail;
  if (q.kind === "bank") {
    body = (
      <>
        <p class="prompt">{q.prompt}</p>
        <div class="options">
          {q.options.map((o, i) => <button key={o} type="button" disabled={result !== null} onClick={() => settle(i === q.answerIndex)}>{o}</button>)}
        </div>
      </>
    );
  } else if (q.kind === "hidden_hero") {
    body = (
      <>
        <p class="prompt">Who made the biggest impact?</p>
        <div class="options">
          {q.players.map((p, i) => (
            <button key={p.alias} type="button" disabled={result !== null} onClick={() => settle(i === q.answerIndex)}>
              <strong>{p.alias}</strong>{" "}
              <small>{p.box.goals} G, {p.box.assists} A, {p.box.shots} shots, {p.box.toi_min} min</small>
            </button>
          ))}
        </div>
      </>
    );
    detail = (
      <ul class="hero-reveal">
        {q.reveal.map((r) => <li key={r.alias}>{r.alias}: {r.name}</li>)}
      </ul>
    );
  } else if (q.kind === "higher_lower") {
    body = <HigherLowerView q={q} onAnswer={(c) => settle(c)} />;
  } else {
    body = <GuessPlayerView q={q} onAnswer={(c, n) => settle(c, guessScore(n, c))} />;
  }

  return (
    <article class="question">
      <header>
        <span class="category">{categoryLabel(q)}</span>
        {"classic" in q && q.classic && <small class="classic"> Classic final spotlight</small>}
      </header>
      {body}
      {result && <Reveal correct={result.correct} why={q.why} detail={detail} last={last} onNext={onNext} />}
    </article>
  );
}
