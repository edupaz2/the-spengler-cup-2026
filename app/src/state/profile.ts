import { START_PUCKS } from "../game/economy.config";
import type { Tier } from "../types";

export interface Bet { marketId: string; optionId: string; stake: number }

export interface Profile {
  pucks: number;
  xp: number;
  streak: number;
  skipsUsedWeek: string | null;
  claimedDoors: string[];
  collection: Record<string, { tier: Tier; copies: number }>;
  answers: Record<string, boolean>;
  bets: Bet[];
  settled: string[];
  completedTasks: string[];
  openedRequests: string[];
  claimedSets: string[];
  achievements: string[];
  flips: string[]; // "YYYY-MM-DD:cardId" for each card back viewed (daily task metric)
  seenWelcome: boolean;
  seenRecaps: string[]; // dates whose "yesterday" recap was shown
  version: 1;
}

const KEY = "sa.profile";

export function newProfile(): Profile {
  return {
    pucks: START_PUCKS, xp: 0, streak: 0, skipsUsedWeek: null, claimedDoors: [], collection: {},
    answers: {}, bets: [], settled: [], completedTasks: [], openedRequests: [],
    claimedSets: [], achievements: [], flips: [], seenWelcome: false, seenRecaps: [], version: 1,
  };
}

export function loadProfile(s: Pick<Storage, "getItem">): Profile {
  try {
    const raw = s.getItem(KEY);
    if (!raw) return newProfile();
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || p.version !== 1) return newProfile();
    return { ...newProfile(), ...p };
  } catch {
    return newProfile();
  }
}

export function saveProfile(s: Pick<Storage, "setItem">, p: Profile): void {
  try {
    s.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage blocked or full: the session continues in memory
  }
}
