import type { Clock } from "../game/clock";

export function ReplayBar({ clock, onAdvance }: { clock: Clock; onAdvance: () => void }) {
  if (clock.mode !== "replay") return null;
  return (
    <div class="replay-bar">
      <span>Replay of the 2025 edition · {clock.day()}</span>
      <button
        type="button"
        disabled={clock.isFinished()}
        onClick={() => { clock.advanceDay(); onAdvance(); }}
      >
        Advance day
      </button>
    </div>
  );
}
