import type { Profile } from "../state/profile";

export interface Achievement { id: string; label: string; cardId: string; earned(p: Profile): boolean }

const wins = (p: Profile) => p.settled.filter((s) => s.endsWith(":won")).length;

function perfectDay(p: Profile): boolean {
  const byDay = new Map<string, boolean[]>();
  for (const [key, ok] of Object.entries(p.answers)) {
    const day = key.split(":")[0];
    byDay.set(day, [...(byDay.get(day) ?? []), ok]);
  }
  return [...byDay.values()].some((r) => r.length >= 5 && r.every(Boolean));
}

const def = (id: string, label: string, earned: (p: Profile) => boolean): Achievement => ({ id, label, cardId: `ach-${id}`, earned });

export const ACHIEVEMENTS: Achievement[] = [
  def("streak3", "Three days in a row", (p) => p.streak >= 3),
  def("perfect_day", "Perfect day: all five right", perfectDay),
  def("first_prediction_win", "First winning prediction", (p) => wins(p) >= 1),
  def("three_prediction_wins", "Three winning predictions", (p) => wins(p) >= 3),
  def("first_upgrade", "First card upgrade", (p) => Object.values(p.collection).some((c) => c.tier !== "normal")),
  def("first_set", "First set completed", (p) => p.claimedSets.length >= 1),
];

export function newlyEarned(p: Profile): string[] {
  return ACHIEVEMENTS.filter((a) => a.earned(p) && !p.achievements.includes(a.id)).map((a) => a.id);
}

/** Record newly earned achievements and put their cards in the collection (never sold in packs). */
export function applyAchievements(p: Profile): Profile {
  const fresh = newlyEarned(p);
  if (fresh.length === 0) return p;
  const collection = { ...p.collection };
  for (const id of fresh) collection[`ach-${id}`] = collection[`ach-${id}`] ?? { tier: "normal", copies: 1 };
  return applyAchievements({ ...p, achievements: [...p.achievements, ...fresh], collection });
}
