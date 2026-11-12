import type { Profile } from "../state/profile";
import { eightZurich } from "./clock";

export type OpeningStep = "welcome" | "gift" | "recap" | null;

/** Which full-screen step the morning opening is on, if any. */
export function nextOpeningStep(p: Profile, today: string, dates: string[], now: Date): OpeningStep {
  if (!p.seenWelcome) return "welcome";
  if (!p.claimedDoors.includes(today) && eightZurich(today) <= now) return "gift";
  if (dates.indexOf(today) > 0 && !p.seenRecaps.includes(today)) return "recap";
  return null;
}
