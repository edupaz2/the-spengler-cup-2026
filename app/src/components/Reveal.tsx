import type { ComponentChildren } from "preact";

export function Reveal({ correct, why, detail, last, onNext }: {
  correct: boolean; why: string; detail?: ComponentChildren; last: boolean; onNext: () => void;
}) {
  return (
    <div class={`reveal ${correct ? "right" : "wrong"}`} role="status">
      <strong>{correct ? "Correct!" : "Not quite."}</strong>
      <p>{why}</p>
      {detail}
      <button type="button" class="primary" onClick={onNext}>{last ? "Finish" : "Next"}</button>
    </div>
  );
}
