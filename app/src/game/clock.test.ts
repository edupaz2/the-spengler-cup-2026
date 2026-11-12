import { describe, expect, it } from "vitest";
import { createClock } from "./clock";

function mem() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}
const DATES = ["2025-12-26", "2025-12-27", "2025-12-28"];

describe("clock", () => {
  it("replay_starts_on_first_date", () => {
    const c = createClock("replay", DATES, mem());
    expect(c.day()).toBe("2025-12-26");
    expect(c.now().toISOString()).toBe("2025-12-26T07:00:00.000Z"); // 08:00 Europe/Zurich (CET)
    expect(c.isFinished()).toBe(false);
  });
  it("advance_past_last_day_stays_and_is_finished", () => {
    const c = createClock("replay", DATES, mem());
    c.advanceDay(); c.advanceDay();
    expect(c.day()).toBe("2025-12-28");
    expect(c.isFinished()).toBe(false);
    c.advanceDay();
    expect(c.day()).toBe("2025-12-28");
    expect(c.isFinished()).toBe(true);
  });
  it("replay_position_survives_reload", () => {
    const s = mem();
    createClock("replay", DATES, s).advanceDay();
    expect(createClock("replay", DATES, s).day()).toBe("2025-12-27");
  });
  it("live_mode_uses_server_time", () => {
    const c = createClock("live", DATES, mem(), () => new Date("2026-12-26T23:30:00Z"));
    expect(c.mode).toBe("live");
    expect(c.now().toISOString()).toBe("2026-12-26T23:30:00.000Z");
    expect(c.day()).toBe("2026-12-27"); // already past midnight in Zurich
  });
});
