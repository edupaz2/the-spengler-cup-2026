import type { Card } from "../types";
import type { Profile } from "../state/profile";
import { cumulativeDays, milestoneReward } from "./calendar";
import { openPack } from "./economy";
import { PACKS } from "./economy.config";
import { streakAfter } from "./scoring";

export const DOOR_XP = 20; // placeholder: tune in playtest

/** Claim the day's deck: free daily pack, streak, XP and any milestone reward. Idempotent per date. */
export function claimDoor(
  p: Profile, date: string, catalog: Card[], rng: () => number,
): { profile: Profile; pulled: Card[] } {
  if (p.claimedDoors.includes(date)) return { profile: p, pulled: [] };
  const daily = openPack(p, "daily", catalog, rng, `daily:${date}`, date);
  let profile: Profile = { ...daily.profile, claimedDoors: [...daily.profile.claimedDoors, date], xp: daily.profile.xp + DOOR_XP };
  profile = streakAfter(profile, date);
  const pulled = [...daily.pulled];
  const reward = milestoneReward(cumulativeDays(profile));
  if (reward) {
    profile = { ...profile, pucks: profile.pucks + reward.pucks };
    if (reward.packId) {
      // the milestone pack is free: refund its price, then open it
      profile = { ...profile, pucks: profile.pucks + PACKS[reward.packId].price };
      const bonus = openPack(profile, reward.packId, catalog, rng, `milestone:${cumulativeDays(profile)}`, date);
      profile = bonus.profile;
      pulled.push(...bonus.pulled);
    }
  }
  return { profile, pulled };
}
