import type { Clock } from "../game/clock";
import type { Profile } from "../state/profile";
import type { Card } from "../types";

export interface ScreenProps {
  clock: Clock; dates: string[]; profile: Profile; update(fn: (p: Profile) => Profile): void; catalog: Card[]; rng?: () => number;
}
