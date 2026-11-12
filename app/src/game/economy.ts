import type { Card, Tier } from "../types";
import type { Profile } from "../state/profile";
import { DUPLICATE_PUCKS, LEVEL_XP, PACKS, PITY_EVERY, RARITY_WEIGHT, TIERS, UPGRADE_COST } from "./economy.config";

function eligible(catalog: Card[], today: string): Card[] {
  return catalog.filter((c) => {
    if (c.category === "achievement") return false;
    if (c.category === "gotd") return c.availableOn === today;
    return c.availableOn === null || c.availableOn <= today;
  });
}

function weightedPick(pool: Card[], rng: () => number): Card {
  const total = pool.reduce((n, c) => n + RARITY_WEIGHT[c.rarity], 0);
  let r = rng() * total;
  for (const c of pool) {
    r -= RARITY_WEIGHT[c.rarity];
    if (r < 0) return c;
  }
  return pool[pool.length - 1];
}

export function openPack(
  p: Profile, packId: string, catalog: Card[], rng: () => number, requestId: string, today: string,
): { profile: Profile; pulled: Card[] } {
  const pack = PACKS[packId];
  if (!pack || p.openedRequests.includes(requestId) || p.pucks < pack.price) return { profile: p, pulled: [] };
  const pool = eligible(catalog, today);
  if (pool.length === 0) return { profile: p, pulled: [] };

  const pulled: Card[] = [];
  if (packId === "daily") {
    const gotd = pool.find((c) => c.category === "gotd");
    if (gotd) pulled.push(gotd);
  }
  const rest = pool.filter((c) => c.category !== "gotd" || packId !== "daily");
  while (pulled.length < pack.size) pulled.push(weightedPick(rest.length ? rest : pool, rng));

  const pity = (p.openedRequests.length + 1) % PITY_EVERY === 0;
  if (pity && !pulled.some((c) => c.rarity !== "common")) {
    const better = pool.filter((c) => c.rarity !== "common" && c.category !== "gotd");
    if (better.length) pulled[pulled.length - 1] = weightedPick(better, rng);
  }

  let pucks = p.pucks - pack.price;
  const collection = { ...p.collection };
  for (const c of pulled) {
    const have = collection[c.id];
    if (have) {
      collection[c.id] = { ...have, copies: have.copies + 1 };
      pucks += DUPLICATE_PUCKS[c.rarity];
    } else {
      collection[c.id] = { tier: "normal", copies: 1 };
    }
  }
  return { profile: { ...p, pucks, collection, openedRequests: [...p.openedRequests, requestId] }, pulled };
}

export type UpgradeResult =
  | { ok: true; profile: Profile }
  | { ok: false; reason: "pucks" | "max" | "challenge" | "not-owned" };

export function upgradeCard(p: Profile, cardId: string, challengePassed: boolean): UpgradeResult {
  const have = p.collection[cardId];
  if (!have) return { ok: false, reason: "not-owned" };
  const next = TIERS[TIERS.indexOf(have.tier) + 1] as Tier | undefined;
  if (!next) return { ok: false, reason: "max" };
  if (next === "diamond" && !challengePassed) return { ok: false, reason: "challenge" };
  const cost = UPGRADE_COST[next as Exclude<Tier, "normal">];
  if (p.pucks < cost) return { ok: false, reason: "pucks" };
  return {
    ok: true,
    profile: { ...p, pucks: p.pucks - cost, collection: { ...p.collection, [cardId]: { ...have, tier: next } } },
  };
}

export function levelFor(xp: number): number {
  let level = 1;
  LEVEL_XP.forEach((need, i) => { if (xp >= need) level = i + 1; });
  return level;
}
