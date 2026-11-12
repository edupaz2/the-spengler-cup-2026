import { describe, expect, it } from "vitest";
import { answerScore, guessScore, knowledgeRating, streakAfter } from "./scoring";
import { newProfile } from "../state/profile";

describe("scoring", () => {
  it("wrong_answer_scores_zero", () => expect(answerScore(false, 0)).toBe(0));
  it("faster_scores_more_up_to_cap", () => {
    expect(answerScore(true, 0)).toBe(150);
    expect(answerScore(true, 7500)).toBe(125);
    expect(answerScore(true, 15000)).toBe(100);
    expect(answerScore(true, 60000)).toBe(100);
    expect(answerScore(true, 2000)).toBeGreaterThan(answerScore(true, 9000));
  });
  it("guess_player_fewer_clues_scores_more", () => {
    expect([1, 2, 3, 4, 5].map((n) => guessScore(n, true))).toEqual([100, 80, 60, 40, 20]);
  });
  it("guess_player_wrong_scores_zero", () => expect(guessScore(1, false)).toBe(0));
  it("rating_is_zero_with_no_answers", () => expect(knowledgeRating(newProfile())).toBe(0));
  it("rating_weights_by_difficulty", () => {
    const p = { ...newProfile(), answers: { a: true, b: false } };
    expect(knowledgeRating(p)).toBe(50);
    expect(knowledgeRating(p, (id) => (id === "a" ? 3 : 1))).toBe(75);
  });
  it("streak_counts_consecutive_days_ending_today", () => {
    const p = { ...newProfile(), claimedDoors: ["2025-12-26", "2025-12-27", "2025-12-29"] };
    expect(streakAfter(p, "2025-12-28").streak).toBe(3);
    expect(streakAfter(p, "2025-12-31").streak).toBe(1);
    expect(streakAfter(streakAfter(p, "2025-12-28"), "2025-12-28").streak).toBe(3);
  });
});
