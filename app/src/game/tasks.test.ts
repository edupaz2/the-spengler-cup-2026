import { describe, expect, it } from "vitest";
import { dailyTasks, progress } from "./tasks";
import { newProfile } from "../state/profile";

describe("tasks", () => {
  it("daily_tasks_deterministic_per_date", () => {
    expect(dailyTasks("2025-12-27")).toEqual(dailyTasks("2025-12-27"));
    expect(dailyTasks("2025-12-27")).toHaveLength(3);
    expect(new Set(dailyTasks("2025-12-27").map((t) => t.metric)).size).toBe(3);
    const ids = new Set(["2025-12-26", "2025-12-27", "2025-12-28", "2025-12-29"].map((d) => dailyTasks(d).map((t) => t.goal).join()));
    expect(ids.size).toBeGreaterThan(1);
  });
  it("progress_counts_only_that_days_activity", () => {
    const p = {
      ...newProfile(),
      answers: { "2025-12-27:q1": true, "2025-12-27:q2": false, "2025-12-26:q1": true },
      bets: [{ marketId: "2025-12-27-g3-winner", optionId: "away", stake: 10 }],
      flips: ["2025-12-27:c1", "2025-12-26:c2"],
    };
    const byMetric = Object.fromEntries(dailyTasks("2025-12-27").map((t) => [t.metric, progress(p, t)]));
    expect(byMetric.answers ?? byMetric.correct).toBeDefined();
    const t = (metric: "answers" | "correct" | "cardsFlipped" | "predictions") =>
      ({ id: "2025-12-27:" + metric, label: "", goal: 9, reward: 1, metric });
    expect(progress(p, t("answers"))).toBe(2);
    expect(progress(p, t("correct"))).toBe(1);
    expect(progress(p, t("cardsFlipped"))).toBe(1);
    expect(progress(p, t("predictions"))).toBe(1);
  });
});
