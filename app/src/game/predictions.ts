import type { Profile } from "../state/profile";
import type { Market } from "../types";
import { MAX_STAKE, MIN_STAKE } from "./predictions.config";

export type BetResult =
  | { ok: true; profile: Profile }
  | { ok: false; reason: "locked" | "funds" | "stake" | "duplicate" | "option" };

export function placeBet(p: Profile, m: Market, optionId: string, stake: number, now: Date): BetResult {
  if (now.getTime() >= Date.parse(m.lockAt)) return { ok: false, reason: "locked" };
  if (p.bets.some((b) => b.marketId === m.id)) return { ok: false, reason: "duplicate" };
  if (!m.options.some((o) => o.id === optionId)) return { ok: false, reason: "option" };
  if (!Number.isInteger(stake) || stake < MIN_STAKE || stake > MAX_STAKE) return { ok: false, reason: "stake" };
  if (stake > p.pucks) return { ok: false, reason: "funds" };
  return {
    ok: true,
    profile: { ...p, pucks: p.pucks - stake, bets: [...p.bets, { marketId: m.id, optionId, stake }] },
  };
}

export interface Outcome { marketId: string; won: boolean; payout: number }

/** `profile.settled` holds "<marketId>:won" or "<marketId>:lost", which makes settling idempotent. */
export function settleBets(
  p: Profile, markets: Market[], results: Record<string, string>,
): { profile: Profile; outcomes: Outcome[] } {
  const done = new Set(p.settled.map((s) => s.slice(0, s.lastIndexOf(":"))));
  let pucks = p.pucks;
  const settled = [...p.settled];
  const outcomes: Outcome[] = [];
  for (const bet of p.bets) {
    const result = results[bet.marketId];
    const market = markets.find((m) => m.id === bet.marketId);
    if (result === undefined || !market || done.has(bet.marketId)) continue;
    const won = bet.optionId === result;
    const odds = market.options.find((o) => o.id === bet.optionId)?.odds ?? 0;
    const payout = won ? Math.round(bet.stake * odds) : 0;
    pucks += payout;
    settled.push(`${bet.marketId}:${won ? "won" : "lost"}`);
    outcomes.push({ marketId: bet.marketId, won, payout });
  }
  return { profile: { ...p, pucks, settled }, outcomes };
}
