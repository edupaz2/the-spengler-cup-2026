import { GameRow } from "../components/GamesCarousel";
import { SettleSheet } from "../components/SettleSheet";
import type { Outcome } from "../game/predictions";
import type { Bet } from "../state/profile";
import type { Market, ScheduledGame } from "../types";

export function Recap({ games, outcomes, markets, bets, onContinue }: {
  games: ScheduledGame[]; outcomes: Outcome[]; markets: Market[]; bets: Bet[]; onContinue(): void;
}) {
  const sorted = [...games].sort((a, b) => a.start.localeCompare(b.start));
  return (
    <section class="opening recap">
      <h1>Yesterday in Davos</h1>
      <div class="recap-games">
        {sorted.length === 0 && <p class="muted">No games yesterday</p>}
        {sorted.map((g) => <GameRow key={g.id} game={g} played />)}
      </div>
      <SettleSheet outcomes={outcomes} markets={markets} bets={bets} />
      <button type="button" class="primary" onClick={onContinue}>See today</button>
    </section>
  );
}
