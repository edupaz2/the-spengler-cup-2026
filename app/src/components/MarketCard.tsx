import { useState } from "preact/hooks";
import { MAX_STAKE, MIN_STAKE } from "../game/predictions.config";
import type { Bet } from "../state/profile";
import type { Market } from "../types";

const TITLES = { winner: "Who wins?", star: "Best player of the day", powerplay: "Best power play" } as const;

function lockTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function MarketCard({ market, bet, pucks, now, onBet }: {
  market: Market; bet?: Bet; pucks: number; now: Date; onBet: (optionId: string, stake: number) => void;
}) {
  const [option, setOption] = useState<string | null>(null);
  const [stake, setStake] = useState(MIN_STAKE);
  const locked = now.getTime() >= Date.parse(market.lockAt);
  const chosen = bet && market.options.find((o) => o.id === bet.optionId);
  const blocked = locked || !!bet || option === null || stake > pucks;

  return (
    <article class="market">
      <h2>{TITLES[market.kind]} <small>Game {market.gameId.replace(/^g/, "")}</small></h2>
      {locked ? <p class="muted">Locked</p> : <p class="muted">Locks at {lockTime(market.lockAt)}</p>}
      <div class="options">
        {market.options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={(bet ? bet.optionId : option) === o.id}
            disabled={locked || !!bet}
            onClick={() => setOption(o.id)}
          >
            {o.label} <strong>{o.odds.toFixed(2)}x</strong>
          </button>
        ))}
      </div>
      {bet ? (
        <p>Your bet: {bet.stake} Pucks on {chosen?.label ?? bet.optionId}.</p>
      ) : (
        <>
          <label>
            Stake: {stake} Pucks
            <input type="range" min={MIN_STAKE} max={MAX_STAKE} step={10} value={stake} onInput={(e) => setStake(Number((e.target as HTMLInputElement).value))} />
          </label>
          <button type="button" class="primary" disabled={blocked} onClick={() => option && onBet(option, stake)}>Place bet</button>
        </>
      )}
    </article>
  );
}
