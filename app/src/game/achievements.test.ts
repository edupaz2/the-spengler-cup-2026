import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, newlyEarned } from "./achievements";
import { newProfile } from "../state/profile";

const day = (d: string, results: boolean[]) => Object.fromEntries(results.map((r, i) => [`${d}:q${i}`, r]));
const get = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!;

describe("achievements", () => {
  it("perfect_day_needs_all_five_correct", () => {
    const four = { ...newProfile(), answers: day("2025-12-26", [true, true, true, true]) };
    const oneWrong = { ...newProfile(), answers: day("2025-12-26", [true, true, true, true, false]) };
    const five = { ...newProfile(), answers: day("2025-12-26", [true, true, true, true, true]) };
    expect(get("perfect_day").earned(four)).toBe(false);
    expect(get("perfect_day").earned(oneWrong)).toBe(false);
    expect(get("perfect_day").earned(five)).toBe(true);
  });
  it("newly_earned_excludes_already_awarded", () => {
    const p = { ...newProfile(), streak: 3, collection: { x: { tier: "silver" as const, copies: 1 } } };
    expect(newlyEarned(p).sort()).toEqual(["first_upgrade", "streak3"]);
    expect(newlyEarned({ ...p, achievements: ["streak3"] })).toEqual(["first_upgrade"]);
  });
  it("prediction_wins_are_counted_from_settled", () => {
    const p = { ...newProfile(), settled: ["m1:won", "m2:lost", "m3:won", "m4:won"] };
    expect(get("first_prediction_win").earned(p)).toBe(true);
    expect(get("three_prediction_wins").earned(p)).toBe(true);
    expect(get("three_prediction_wins").earned({ ...p, settled: ["m1:won", "m2:won"] })).toBe(false);
  });
  it("every_achievement_names_its_card", () => {
    expect(ACHIEVEMENTS.map((a) => a.cardId)).toEqual(ACHIEVEMENTS.map((a) => "ach-" + a.id));
  });
});

describe("applyAchievements", () => {
  it("awards_card_and_records_id_once", async () => {
    const { applyAchievements } = await import("./achievements");
    const p = { ...newProfile(), streak: 3 };
    const once = applyAchievements(p);
    expect(once.achievements).toEqual(["streak3"]);
    expect(once.collection["ach-streak3"]).toEqual({ tier: "normal", copies: 1 });
    expect(applyAchievements(once)).toEqual(once);
  });
});
