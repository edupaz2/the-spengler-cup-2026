import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { GamesCarousel } from "./GamesCarousel";
import type { ScheduledGame } from "../types";

const g = (id: string, date: string, start: string, score: [number, number]): ScheduledGame => ({
  id, date, start, stage: "Group stage", group: "A", home: `Home ${id}`, away: `Away ${id}`, score,
});
const GAMES = [g("g1", "2025-12-26", "12:00", [5, 2]), g("g2", "2025-12-26", "20:15", [3, 2]), g("g3", "2025-12-27", "15:10", [1, 0]), g("g4", "2025-12-27", "20:15", [4, 4])];
const DATES = ["2025-12-26", "2025-12-27"];

describe("GamesCarousel", () => {
  it("opens_on_today_with_start_times_and_no_scores", () => {
    render(<GamesCarousel games={GAMES} dates={DATES} today="2025-12-27" />);
    expect(screen.getByText(/today/i)).toBeTruthy();
    expect(screen.getByText("15:10")).toBeTruthy();
    expect(screen.queryByText("5:2")).toBeNull();
  });
  it("previous_day_shows_final_scores", () => {
    render(<GamesCarousel games={GAMES} dates={DATES} today="2025-12-27" />);
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(screen.getByText("5:2")).toBeTruthy();
    expect(screen.getByText(/final score/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous day" })).toHaveProperty("disabled", true);
  });
  it("a_day_without_games_says_so_and_does_not_crash", () => {
    render(<GamesCarousel games={GAMES} dates={[...DATES, "2026-01-01"]} today="2026-01-01" />);
    expect(screen.getByText("No games")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next day" })).toHaveProperty("disabled", true);
  });
  it("first_day_has_a_disabled_previous_and_dots_mark_the_current_page", () => {
    const { container } = render(<GamesCarousel games={GAMES} dates={DATES} today="2025-12-26" />);
    expect(screen.getByRole("button", { name: "Previous day" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Next day" })).toHaveProperty("disabled", false);
    expect(container.querySelectorAll(".dot")).toHaveLength(2);
    expect(container.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });
  it("no_games_at_all_does_not_crash", () => {
    render(<GamesCarousel games={[]} dates={[]} today="2025-12-27" />);
    expect(screen.getByText("No games")).toBeTruthy();
  });
});
