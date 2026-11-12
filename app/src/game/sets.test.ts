import { describe, expect, it } from "vitest";
import { claimSet, completedSets } from "./sets";
import { newProfile } from "../state/profile";
import type { SetBonus } from "../types";

const SET: SetBonus = { id: "s1", label: "S1", cardIds: ["a", "b"], reward: { pucks: 100 } };
const own = (...ids: string[]) => ({ ...newProfile(), collection: Object.fromEntries(ids.map((i) => [i, { tier: "normal" as const, copies: 1 }])) });

describe("sets", () => {
  it("incomplete_set_not_claimable", () => expect(completedSets(own("a"), [SET])).toEqual([]));
  it("complete_set_is_listed_until_claimed", () => {
    const p = own("a", "b");
    expect(completedSets(p, [SET])).toEqual(["s1"]);
    expect(completedSets(claimSet(p, SET), [SET])).toEqual([]);
  });
  it("claiming_set_twice_pays_once", () => {
    const once = claimSet(own("a", "b"), SET);
    expect(once.pucks).toBe(newProfile().pucks + 100);
    expect(claimSet(once, SET).pucks).toBe(newProfile().pucks + 100);
  });
});
