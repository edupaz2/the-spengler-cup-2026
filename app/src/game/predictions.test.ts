import { describe, expect, it } from "vitest";
import { placeBet, settleBets } from "./predictions";
import { MAX_STAKE, MIN_STAKE } from "./predictions.config";
import { newProfile } from "../state/profile";
import type { Market } from "../types";

const M: Market = {
  id: "2025-12-27-g3-winner", kind: "winner", date: "2025-12-27", gameId: "3",
  lockAt: "2025-12-27T13:00:00+01:00",
  options: [{ id: "home", label: "Helsinki", odds: 2.5 }, { id: "away", label: "Sparta", odds: 1.6 }],
};
const BEFORE = new Date("2025-12-27T07:00:00Z");
const rich = { ...newProfile(), pucks: 500 };

describe("placeBet", () => {
  it("bet_after_lock_rejected", () => {
    expect(placeBet(rich, M, "home", 50, new Date("2025-12-27T12:00:00Z"))).toEqual({ ok: false, reason: "locked" });
    expect(placeBet(rich, M, "home", 50, new Date("2025-12-27T11:59:59Z")).ok).toBe(true);
  });
  it("bet_over_balance_rejected", () => {
    expect(placeBet({ ...newProfile(), pucks: 40 }, M, "home", 50, BEFORE)).toEqual({ ok: false, reason: "funds" });
  });
  it("stake_outside_limits_rejected", () => {
    expect(placeBet(rich, M, "home", MIN_STAKE - 1, BEFORE)).toEqual({ ok: false, reason: "stake" });
    expect(placeBet(rich, M, "home", MAX_STAKE + 1, BEFORE)).toEqual({ ok: false, reason: "stake" });
  });
  it("duplicate_bet_on_market_rejected", () => {
    const r = placeBet(rich, M, "home", 50, BEFORE);
    expect(r.ok && placeBet(r.profile, M, "away", 50, BEFORE)).toEqual({ ok: false, reason: "duplicate" });
  });
  it("unknown_option_rejected", () => {
    expect(placeBet(rich, M, "nope", 50, BEFORE)).toEqual({ ok: false, reason: "option" });
  });
  it("stake_is_deducted_when_placed", () => {
    const r = placeBet(rich, M, "home", 50, BEFORE);
    expect(r.ok && r.profile.pucks).toBe(450);
    expect(r.ok && r.profile.bets).toEqual([{ marketId: M.id, optionId: "home", stake: 50 }]);
  });
});

describe("settleBets", () => {
  const placed = (opt: string) => {
    const r = placeBet(rich, M, opt, 50, BEFORE);
    if (!r.ok) throw new Error("setup");
    return r.profile;
  };
  it("win_pays_stake_times_odds", () => {
    const { profile, outcomes } = settleBets(placed("home"), [M], { [M.id]: "home" });
    expect(outcomes).toEqual([{ marketId: M.id, won: true, payout: 125 }]);
    expect(profile.pucks).toBe(450 + 125);
    expect(profile.settled).toEqual([`${M.id}:won`]);
  });
  it("loss_pays_nothing_and_stake_stays_deducted", () => {
    const { profile, outcomes } = settleBets(placed("home"), [M], { [M.id]: "away" });
    expect(outcomes).toEqual([{ marketId: M.id, won: false, payout: 0 }]);
    expect(profile.pucks).toBe(450);
    expect(profile.settled).toEqual([`${M.id}:lost`]);
  });
  it("settling_twice_pays_once", () => {
    const first = settleBets(placed("home"), [M], { [M.id]: "home" });
    const second = settleBets(first.profile, [M], { [M.id]: "home" });
    expect(second.profile.pucks).toBe(first.profile.pucks);
    expect(second.outcomes).toEqual([]);
  });
  it("settle_ignores_markets_without_results", () => {
    const { profile, outcomes } = settleBets(placed("home"), [M], {});
    expect(outcomes).toEqual([]);
    expect(profile.settled).toEqual([]);
  });
});
