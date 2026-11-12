import { describe, expect, it } from "vitest";
import { eightZurich } from "./clock";
import { nextOpeningStep } from "./opening";
import { newProfile } from "../state/profile";

const DATES = ["2025-12-26", "2025-12-27"];
const at8 = eightZurich;

describe("nextOpeningStep", () => {
  it("first_open_starts_with_welcome", () => expect(nextOpeningStep(newProfile(), "2025-12-26", DATES, at8("2025-12-26"))).toBe("welcome"));
  it("then_the_gift_deck_once_unlocked", () => {
    const p = { ...newProfile(), seenWelcome: true };
    expect(nextOpeningStep(p, "2025-12-26", DATES, at8("2025-12-26"))).toBe("gift");
    expect(nextOpeningStep(p, "2025-12-26", DATES, new Date(at8("2025-12-26").getTime() - 1))).toBeNull();
  });
  it("no_recap_on_the_first_day_and_one_recap_per_later_day", () => {
    const p = { ...newProfile(), seenWelcome: true, claimedDoors: ["2025-12-26", "2025-12-27"] };
    expect(nextOpeningStep(p, "2025-12-26", DATES, at8("2025-12-26"))).toBeNull();
    expect(nextOpeningStep(p, "2025-12-27", DATES, at8("2025-12-27"))).toBe("recap");
    expect(nextOpeningStep({ ...p, seenRecaps: ["2025-12-27"] }, "2025-12-27", DATES, at8("2025-12-27"))).toBeNull();
  });
});
