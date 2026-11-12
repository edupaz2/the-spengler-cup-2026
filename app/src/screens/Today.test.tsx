import { render, screen } from "@testing-library/preact";
import { useState } from "preact/hooks";
import { describe, expect, it } from "vitest";
import { Today } from "./Today";
import { createClock } from "../game/clock";
import { newProfile } from "../state/profile";
import type { Card, ScheduledGame } from "../types";

const DATES = ["2025-12-26", "2025-12-27", "2025-12-28"];
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };
const card = (id: string): Card => ({
  id, category: "player", title: id, team: null, availableOn: null, unlock: null, image: null, rarity: "common", front: [],
  back: { normal: "", silver: "", gold: { text: "", visual: "table", data: {} }, diamond: { question: "", options: ["a", "b", "c", "d"], answerIndex: 0 } },
});
const CATALOG = ["a", "b", "c", "d", "e"].map(card);
const SCHEDULE: ScheduledGame[] = [
  { id: "g1", date: "2025-12-26", start: "15:10", stage: "Group stage", group: "A", home: "A", away: "B", score: [1, 0] },
  { id: "g2", date: "2025-12-27", start: "20:15", stage: "Group stage", group: "A", home: "C", away: "D", score: [2, 1] },
];

function Harness() {
  const clock = createClock("replay", DATES, mem());
  clock.advanceDay();
  const [p, setP] = useState({ ...newProfile(), pucks: 240, streak: 2 });
  return <Today clock={clock} dates={DATES} profile={p} update={(fn) => setP(fn)} catalog={CATALOG} rng={() => 0.1} schedule={SCHEDULE} tasksDone={1} tasksTotal={3} />;
}

describe("Today", () => {
  it("shows_chips_tiles_and_no_advent_wording", () => {
    const { container } = render(<Harness />);
    expect(screen.getByText("240 Pucks")).toBeTruthy();
    expect(screen.getByText("Lv 1")).toBeTruthy();
    expect(screen.getByRole("link", { name: /daily quiz/i }).getAttribute("href")).toBe("#/challenge/2025-12-27");
    expect(screen.getByRole("link", { name: /tasks/i }).textContent).toMatch(/1 of 3 done/);
    expect(screen.getByRole("link", { name: /card shop/i }).getAttribute("href")).toBe("#/cards?tab=shop");
    expect(container.textContent).not.toMatch(/door|advent|calendar/i);
  });
});
