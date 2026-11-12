import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { Challenge } from "./Challenge";
import { finishChallenge } from "../game/challenge";
import { newProfile } from "../state/profile";
import type { DayPack } from "../types";

const PACK: DayPack = {
  date: "2025-12-31", games: ["11"], depth: "events",
  questions: [
    { id: "r1", kind: "bank", category: "rules", prompt: "What is icing?", options: ["Opt A", "Opt B", "Opt C", "Opt D"], answerIndex: 1, why: "Icing is shooting the puck the length of the ice.", difficulty: 1, source: "test" },
    { id: "hh", kind: "hidden_hero", classic: true, difficulty: 2, answerIndex: 2, why: "Stransky made the biggest impact.",
      players: [{ alias: "Player A", box: { goals: 2, assists: 1, shots: 4, toi_min: 16 } }, { alias: "Player B", box: { goals: 0, assists: 0, shots: 0, toi_min: 9 } }, { alias: "Player C", box: { goals: 1, assists: 0, shots: 5, toi_min: 16 } }],
      reveal: [{ alias: "Player A", name: "Adam Tambellini", impact: 0.57 }, { alias: "Player B", name: "Martins Lavins", impact: 0.43 }, { alias: "Player C", name: "Matej Stransky", impact: 0.66 }] },
    { id: "hl", kind: "higher_lower", difficulty: 1, metric: "shots", prompt: "Who took more shots?", a: { label: "Davos", value: 32 }, b: { label: "Collegiate Selects", value: 22 }, answer: "a", why: "Davos outshot them." },
    { id: "gp", kind: "guess_player", difficulty: 2, clues: ["Clue one", "Clue two", "Clue three", "Clue four", "Clue five"], options: ["P1", "P2", "P3", "P4"], answerIndex: 0, why: "It was P1." },
    { id: "h1", kind: "bank", category: "history", prompt: "Who won in 2018?", options: ["W", "X", "Y", "Z"], answerIndex: 0, why: "KalPa won in a shootout.", difficulty: 2, source: "test" },
  ],
};
const next = () => fireEvent.click(screen.getByRole("button", { name: /next|finish/i }));

describe("Challenge", () => {
  it("shows_category_label_per_question", () => {
    render(<Challenge pack={PACK} onFinish={() => {}} />);
    expect(screen.getByText("Hockey 101")).toBeTruthy();
    fireEvent.click(screen.getByText("Opt B")); next();
    expect(screen.getByText("Hidden Hero")).toBeTruthy();
    expect(screen.getByText(/classic final spotlight/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Player C/ })); next();
    expect(screen.getByText("Higher or Lower")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Davos/ })); next();
    expect(screen.getByText("Guess the Player")).toBeTruthy();
    fireEvent.click(screen.getByText("P1")); next();
    expect(screen.getByText("Tournament History")).toBeTruthy();
  });
  it("reveal_always_follows_an_answer", () => {
    render(<Challenge pack={PACK} onFinish={() => {}} />);
    expect(screen.queryByText(/Icing is shooting/)).toBeNull();
    fireEvent.click(screen.getByText("Opt A")); // wrong answer
    expect(screen.getByText(/Icing is shooting/)).toBeTruthy();
    expect(screen.getByText(/not quite/i)).toBeTruthy();
  });
  it("hidden_hero_reveals_real_names_after_answer", () => {
    render(<Challenge pack={PACK} onFinish={() => {}} answered={{ r1: true }} />);
    expect(screen.queryByText(/Stransky/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Player A/ }));
    expect(screen.getByText(/Matej Stransky/)).toBeTruthy();
    expect(screen.getByText(/Adam Tambellini/)).toBeTruthy();
  });
  it("guess_player_shows_one_clue_at_a_time", () => {
    render(<Challenge pack={PACK} onFinish={() => {}} answered={{ r1: true, hh: true, hl: true }} />);
    expect(screen.getByText("Clue one")).toBeTruthy();
    expect(screen.queryByText("Clue two")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /another clue/i }));
    expect(screen.getByText("Clue two")).toBeTruthy();
    expect(screen.queryByText("Clue three")).toBeNull();
  });
  it("guess_player_score_falls_with_each_clue", () => {
    const onAnswer = vi.fn();
    render(<Challenge pack={PACK} onFinish={() => {}} onAnswer={onAnswer} answered={{ r1: true, hh: true, hl: true }} />);
    fireEvent.click(screen.getByRole("button", { name: /another clue/i }));
    fireEvent.click(screen.getByText("P1"));
    expect(onAnswer).toHaveBeenCalledWith("gp", true, 80);
  });
  it("higher_lower_shows_both_values_after_answer", () => {
    render(<Challenge pack={PACK} onFinish={() => {}} answered={{ r1: true, hh: true }} />);
    expect(screen.queryByText("32")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Collegiate Selects/ }));
    expect(screen.getByText("32")).toBeTruthy();
    expect(screen.getByText("22")).toBeTruthy();
  });
  it("reload_mid_challenge_resumes_without_double_award", () => {
    const onAnswer = vi.fn();
    render(<Challenge pack={PACK} onFinish={() => {}} onAnswer={onAnswer} answered={{ r1: true, hh: false }} />);
    expect(screen.getByText("Higher or Lower")).toBeTruthy(); // resumed at the third question
    expect(onAnswer).not.toHaveBeenCalled();
  });
  it("onfinish_reports_results_for_every_question_including_resumed_ones", () => {
    const onFinish = vi.fn();
    render(<Challenge pack={PACK} onFinish={onFinish} answered={{ r1: true, hh: false, hl: true, gp: true }} />);
    fireEvent.click(screen.getByText("W"));
    next();
    const results = onFinish.mock.calls[0][0];
    expect(results.map((r: { id: string }) => r.id)).toEqual(["r1", "hh", "hl", "gp", "h1"]);
    expect(results.map((r: { correct: boolean }) => r.correct)).toEqual([true, false, true, true, true]);
  });
  it("finishing_awards_xp_and_pucks_once", () => {
    const results = [
      { id: "r1", correct: true, score: 150 }, { id: "hh", correct: false, score: 0 }, { id: "hl", correct: true, score: 100 },
      { id: "gp", correct: true, score: 80 }, { id: "h1", correct: true, score: 120 },
    ];
    const once = finishChallenge(newProfile(), "2025-12-31", results);
    expect(once.xp).toBeGreaterThan(0);
    expect(once.pucks).toBeGreaterThan(0);
    expect(finishChallenge(once, "2025-12-31", results)).toEqual(once);
  });
});
