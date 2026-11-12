import { describe, expect, it } from "vitest";
import { DUPLICATE_PUCKS, PACKS, PITY_EVERY, UPGRADE_COST } from "./economy.config";
import { levelFor, openPack, upgradeCard } from "./economy";
import { newProfile } from "../state/profile";
import type { Card, CardCategory, Rarity } from "../types";

function card(id: string, over: Partial<Card> = {}): Card {
  return {
    id, category: "player" as CardCategory, title: id, team: null, availableOn: null, unlock: null, image: null,
    rarity: "common" as Rarity, front: [],
    back: { normal: "", silver: "", gold: { text: "", visual: "table", data: {} }, diamond: { question: "", options: ["a", "b", "c", "d"], answerIndex: 0 } },
    ...over,
  };
}
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };
const TODAY = "2025-12-27";
const CATALOG = [
  card("p1"), card("p2"), card("p3"), card("p4"), card("r1", { rarity: "rare" }),
  card("g-today", { category: "gotd", availableOn: TODAY }),
  card("g-other", { category: "gotd", availableOn: "2025-12-28" }),
  card("ach", { category: "achievement" }),
];
const rich = () => ({ ...newProfile(), pucks: 1000 });

describe("openPack", () => {
  it("pack_deducts_price_and_adds_cards", () => {
    const { profile, pulled } = openPack(rich(), "standard", CATALOG, seq(0.1, 0.3, 0.5), "r1", TODAY);
    expect(profile.pucks).toBe(1000 - PACKS.standard.price + pulled.reduce((n, c) => n + (profile.collection[c.id].copies > 1 ? DUPLICATE_PUCKS[c.rarity] : 0), 0));
    expect(pulled).toHaveLength(PACKS.standard.size);
    for (const c of pulled) expect(profile.collection[c.id].copies).toBeGreaterThanOrEqual(1);
  });
  it("duplicate_converts_to_pucks_by_rarity", () => {
    const owned = { ...rich(), collection: { r1: { tier: "normal" as const, copies: 1 } } };
    const only = [card("r1", { rarity: "rare" })];
    const { profile } = openPack(owned, "standard", only, () => 0, "r2", TODAY);
    expect(profile.collection.r1.copies).toBe(4);
    expect(profile.pucks).toBe(1000 - PACKS.standard.price + 3 * DUPLICATE_PUCKS.rare);
  });
  it("pity_guarantees_rare_every_n_packs", () => {
    let p = { ...rich(), openedRequests: Array.from({ length: PITY_EVERY - 1 }, (_, i) => `x${i}`) };
    const commonsFirst = [card("c1"), card("c2"), card("c3"), card("rare1", { rarity: "rare" })];
    const out = openPack(p, "standard", commonsFirst, () => 0, "pity", TODAY);
    expect(out.pulled.some((c) => c.rarity !== "common")).toBe(true);
    p = { ...rich(), openedRequests: [] };
    const out2 = openPack(p, "standard", commonsFirst, () => 0, "nopity", TODAY);
    expect(out2.pulled.every((c) => c.rarity === "common")).toBe(true);
  });
  it("same_request_id_does_not_double_spend", () => {
    const a = openPack(rich(), "standard", CATALOG, () => 0.2, "same", TODAY);
    const b = openPack(a.profile, "standard", CATALOG, () => 0.2, "same", TODAY);
    expect(b.profile).toEqual(a.profile);
    expect(b.pulled).toEqual([]);
  });
  it("insufficient_pucks_rejected", () => {
    const p = { ...newProfile(), pucks: 10 };
    const out = openPack(p, "standard", CATALOG, () => 0, "poor", TODAY);
    expect(out.profile).toEqual(p);
    expect(out.pulled).toEqual([]);
  });
  it("daily_pack_includes_game_of_the_day", () => {
    const { pulled } = openPack(newProfile(), "daily", CATALOG, () => 0.9, "d1", TODAY);
    expect(pulled.map((c) => c.id)).toContain("g-today");
    expect(pulled).toHaveLength(PACKS.daily.size);
  });
  it("achievement_cards_never_in_packs", () => {
    for (let i = 0; i < 40; i++) {
      const { pulled } = openPack(rich(), "premium", CATALOG, () => Math.random(), `a${i}`, TODAY);
      expect(pulled.map((c) => c.category)).not.toContain("achievement");
    }
  });
  it("other_days_game_of_the_day_never_in_packs", () => {
    for (let i = 0; i < 40; i++) {
      const { pulled } = openPack(rich(), "premium", CATALOG, () => Math.random(), `o${i}`, TODAY);
      expect(pulled.map((c) => c.id)).not.toContain("g-other");
    }
  });
});

describe("upgradeCard", () => {
  const owned = (tier: "normal" | "silver" | "gold" | "diamond", pucks = 1000) =>
    ({ ...newProfile(), pucks, collection: { c: { tier, copies: 1 } } });
  it("upgrade_never_goes_negative", () => {
    const r = upgradeCard(owned("normal", UPGRADE_COST.silver - 1), "c", false);
    expect(r).toEqual({ ok: false, reason: "pucks" });
    const ok = upgradeCard(owned("normal", UPGRADE_COST.silver), "c", false);
    expect(ok.ok && ok.profile.pucks).toBe(0);
  });
  it("diamond_requires_challenge", () => {
    expect(upgradeCard(owned("gold"), "c", false)).toEqual({ ok: false, reason: "challenge" });
    const ok = upgradeCard(owned("gold"), "c", true);
    expect(ok.ok && ok.profile.collection.c.tier).toBe("diamond");
  });
  it("cannot_upgrade_past_diamond", () => {
    expect(upgradeCard(owned("diamond"), "c", true)).toEqual({ ok: false, reason: "max" });
  });
  it("not_owned_is_rejected", () => {
    expect(upgradeCard(newProfile(), "nope", true)).toEqual({ ok: false, reason: "not-owned" });
  });
});

describe("levelFor", () => {
  it("level_thresholds", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(99)).toBe(1);
    expect(levelFor(100)).toBe(2);
    expect(levelFor(10_000_000)).toBe(10);
  });
});
