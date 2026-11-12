import { describe, expect, it } from "vitest";
import { applySkip, cumulativeDays, milestoneReward, unlockedDates } from "./calendar";
import { newProfile } from "../state/profile";

const ALL = ["2025-12-26", "2025-12-27", "2025-12-28"];

describe("calendar", () => {
  it("door_locked_before_0800_zurich", () => {
    expect(unlockedDates(ALL, new Date("2025-12-27T06:59:59Z"))).toEqual(["2025-12-26"]);
  });
  it("door_unlocks_at_0800_zurich", () => {
    expect(unlockedDates(ALL, new Date("2025-12-27T07:00:00Z"))).toEqual(["2025-12-26", "2025-12-27"]);
  });
  it("dst_change_days_still_unlock_at_0800", () => {
    const fall = ["2026-10-25"]; // clocks go back: 08:00 is CET (07:00Z)
    expect(unlockedDates(fall, new Date("2026-10-25T06:59:00Z"))).toEqual([]);
    expect(unlockedDates(fall, new Date("2026-10-25T07:00:00Z"))).toEqual(fall);
    const spring = ["2027-03-28"]; // clocks go forward: 08:00 is CEST (06:00Z)
    expect(unlockedDates(spring, new Date("2027-03-28T05:59:00Z"))).toEqual([]);
    expect(unlockedDates(spring, new Date("2027-03-28T06:00:00Z"))).toEqual(spring);
  });
  it("missed_day_keeps_cumulative_count", () => {
    const p = { ...newProfile(), claimedDoors: ["2025-12-26", "2025-12-28"] };
    expect(cumulativeDays(p)).toBe(2);
  });
  it("second_skip_in_week_rejected", () => {
    const mon = new Date("2025-12-29T07:00:00Z");
    const first = applySkip(newProfile(), mon);
    expect(first.skipsUsedWeek).not.toBeNull();
    expect(first.claimedDoors).toEqual(["2025-12-28"]);
    expect(applySkip(first, new Date("2025-12-31T07:00:00Z"))).toEqual(first);
    expect(applySkip(first, new Date("2026-01-05T07:00:00Z")).skipsUsedWeek).not.toBe(first.skipsUsedWeek);
  });
  it("milestone_table", () => {
    expect([1, 2, 3, 4, 5, 10, 15, 16].map((d) => milestoneReward(d) !== null)).toEqual([false, true, true, false, true, true, true, false]);
    expect(milestoneReward(5)?.packId).toBeDefined();
  });
});
