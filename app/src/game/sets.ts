import type { Profile } from "../state/profile";
import type { SetBonus } from "../types";

export function completedSets(p: Profile, sets: SetBonus[]): string[] {
  return sets
    .filter((s) => !p.claimedSets.includes(s.id) && s.cardIds.every((id) => id in p.collection))
    .map((s) => s.id);
}

export function claimSet(p: Profile, set: SetBonus): Profile {
  if (p.claimedSets.includes(set.id)) return p;
  return { ...p, pucks: p.pucks + set.reward.pucks, claimedSets: [...p.claimedSets, set.id] };
}
