import type { Outcome } from "../game/predictions";
import type { Bet } from "../state/profile";
import type { Market } from "../types";

export function SettleSheet({ outcomes, markets, bets }: { outcomes: Outcome[]; markets: Market[]; bets: Bet[] }) {
  if (outcomes.length === 0) return null;
  return (
    <section class="settle-sheet" aria-label="Yesterday's predictions">
      <h2>Yesterday's predictions</h2>
      <ul>
        {outcomes.map((o) => {
          const market = markets.find((m) => m.id === o.marketId);
          const bet = bets.find((b) => b.marketId === o.marketId);
          const pick = market?.options.find((x) => x.id === bet?.optionId)?.label ?? bet?.optionId ?? "";
          return (
            <li key={o.marketId} class={o.won ? "won" : "lost"}>
              <strong>{o.won ? `Won +${o.payout} Pucks` : `Lost ${bet?.stake ?? 0} Pucks`}</strong>
              <span> You picked {pick}.</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
