import type { Profile } from "../state/profile";
import { eightZurich } from "./clock";

const DAY_MS = 86_400_000;

function zurichDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** A door opens at 08:00 Europe/Zurich on its own date. */
export function unlockedDates(all: string[], now: Date): string[] {
  return all.filter((d) => eightZurich(d).getTime() <= now.getTime());
}

export function cumulativeDays(p: Profile): number {
  return p.claimedDoors.length;
}

// Placeholder rewards: tune in playtest.
const MILESTONES: Record<number, { pucks: number; packId?: string }> = {
  2: { pucks: 50 },
  3: { pucks: 100 },
  5: { pucks: 150, packId: "standard" },
  10: { pucks: 300, packId: "premium" },
  15: { pucks: 500, packId: "premium" },
};

export function milestoneReward(days: number): { pucks: number; packId?: string } | null {
  return MILESTONES[days] ?? null;
}

function isoWeekKey(date: string): string {
  const d = new Date(Date.parse(date));
  const thursday = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * DAY_MS);
  const year = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(year, 0, 1)) / (7 * DAY_MS)) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** One free skip per ISO week: it counts the previous day as played so the streak survives. */
export function applySkip(p: Profile, now: Date): Profile {
  const today = zurichDate(now);
  const week = isoWeekKey(today);
  if (p.skipsUsedWeek === week) return p;
  const yesterday = new Date(Date.parse(today) - DAY_MS).toISOString().slice(0, 10);
  const claimedDoors = p.claimedDoors.includes(yesterday) ? p.claimedDoors : [...p.claimedDoors, yesterday];
  return { ...p, skipsUsedWeek: week, claimedDoors };
}
