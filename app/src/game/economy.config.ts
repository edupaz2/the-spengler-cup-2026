import type { Rarity, Tier } from "../types";

// All numbers below are placeholders: tune in playtest.
export const START_PUCKS = 200;
export const PACKS: Record<string, { price: number; size: number }> = {
  daily: { price: 0, size: 3 },
  standard: { price: 100, size: 3 },
  premium: { price: 300, size: 5 },
};
export const UPGRADE_COST: Record<Exclude<Tier, "normal">, number> = { silver: 50, gold: 150, diamond: 400 };
export const DUPLICATE_PUCKS: Record<Rarity, number> = { common: 10, rare: 30, epic: 80, legendary: 200 };
export const RARITY_WEIGHT: Record<Rarity, number> = { common: 70, rare: 20, epic: 8, legendary: 2 };
export const PITY_EVERY = 5; // every 5th opened pack holds at least one rare or better
export const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]; // xp needed for level 1..10
export const TIERS: Tier[] = ["normal", "silver", "gold", "diamond"];
