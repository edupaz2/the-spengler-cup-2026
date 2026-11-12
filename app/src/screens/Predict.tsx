import { MarketCard } from "../components/MarketCard";
import { placeBet } from "../game/predictions";
import type { Profile } from "../state/profile";
import type { Market } from "../types";

export function Predict({ markets, now, profile, update }: {
  markets: Market[]; now: Date; profile: Profile; update(fn: (p: Profile) => Profile): void; date?: string;
}) {
  return (
    <section class="predict">
      <h1>Predictions</h1>
      <p class="play-money muted">Pucks are play money. Nothing here costs or pays real money.</p>
      {markets.length === 0 ? (
        <p>No games today. Check yesterday's results and come back tomorrow.</p>
      ) : (
        markets.map((m) => (
          <MarketCard
            key={m.id}
            market={m}
            bet={profile.bets.find((b) => b.marketId === m.id)}
            pucks={profile.pucks}
            now={now}
            onBet={(optionId, stake) => update((p) => { const r = placeBet(p, m, optionId, stake, now); return r.ok ? r.profile : p; })}
          />
        ))
      )}
    </section>
  );
}
