import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { CardReveal, GiftDeck } from "./GiftDeck";
import { Recap } from "./Recap";
import { Welcome } from "./Welcome";
import type { Card, ScheduledGame } from "../types";

const card = (id: string): Card => ({
  id, category: "player", title: id, team: null, availableOn: null, unlock: null, image: null, rarity: "common", front: [],
  back: { normal: "", silver: "", gold: { text: "", visual: "table", data: {} }, diamond: { question: "", options: ["a", "b", "c", "d"], answerIndex: 0 } },
});
const GAMES_26: ScheduledGame[] = [
  { id: "g1", date: "2025-12-26", start: "15:10", stage: "Group stage", group: "A", home: "Davos", away: "Ocelari", score: [5, 2] },
];
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("opening screens", () => {
  it("welcome_continues", () => {
    const onContinue = vi.fn();
    render(<Welcome onContinue={onContinue} />);
    expect(screen.getByText("Six teams, six days, one trophy. A new deck of cards every morning.")).toBeTruthy();
    click("Open my first deck");
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
  it("reveals_cards_one_by_one_with_counter_and_tags", () => {
    const onDone = vi.fn();
    render(<CardReveal cards={[card("a"), card("b"), card("a")]} owned={new Set(["b"])} onDone={onDone} />);
    expect(screen.getByText("1 of 3")).toBeTruthy(); expect(screen.getByText("New")).toBeTruthy();
    click("Next card");
    expect(screen.getByText("2 of 3")).toBeTruthy(); expect(screen.getByText(/^Duplicate/)).toBeTruthy();
    click("Next card");
    expect(screen.getByText("3 of 3")).toBeTruthy(); expect(screen.getByText(/^Duplicate/)).toBeTruthy();
    click("Continue");
    click("Continue");
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it("duplicate_tag_shows_the_pucks_for_the_rarity", () => {
    render(<CardReveal cards={[card("b")]} owned={new Set(["b"])} onDone={() => {}} />);
    expect(screen.getByText("Duplicate · +10 Pucks")).toBeTruthy();
  });
  it("tapping_the_card_advances_but_never_past_the_last", () => {
    const onDone = vi.fn();
    const { container } = render(<CardReveal cards={[card("a"), card("b")]} owned={new Set()} onDone={onDone} />);
    const face = container.querySelector(".reveal-card") as HTMLElement;
    fireEvent.click(face); fireEvent.click(face); fireEvent.click(face);
    expect(screen.getByText("2 of 2")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });
  it("tear_it_open_claims_once_even_when_tapped_twice", () => {
    const onClaim = vi.fn(() => [card("a")]);
    render(<GiftDeck date="2025-12-27" onClaim={onClaim} collectionBefore={new Set()} onDone={() => {}} />);
    const b = screen.getByRole("button", { name: "Tear it open" });
    fireEvent.click(b); fireEvent.click(b);
    expect(onClaim).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 of 1")).toBeTruthy();
  });
  it("a_deck_of_more_than_three_uses_the_real_count", () => {
    render(<GiftDeck date="2025-12-27" onClaim={() => [card("a"), card("b"), card("c"), card("d"), card("e")]} collectionBefore={new Set()} onDone={() => {}} />);
    click("Tear it open");
    expect(screen.getByText("1 of 5")).toBeTruthy();
  });
  it("an_empty_deck_skips_the_reveal", () => {
    const onDone = vi.fn();
    render(<GiftDeck date="2025-12-27" onClaim={() => []} collectionBefore={new Set()} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Tear it open" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
  it("a_reveal_of_no_cards_finishes_at_once", () => {
    const onDone = vi.fn();
    const { container } = render(<CardReveal cards={[]} owned={new Set()} onDone={onDone} />);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe("");
  });
  it("recap_lists_yesterdays_final_scores", () => {
    render(<Recap games={GAMES_26} outcomes={[]} markets={[]} bets={[]} onContinue={() => {}} />);
    expect(screen.getByText("Yesterday in Davos")).toBeTruthy();
    expect(screen.getByText("5:2")).toBeTruthy();
  });
  it("recap_without_games_says_so_and_continues", () => {
    const onContinue = vi.fn();
    render(<Recap games={[]} outcomes={[]} markets={[]} bets={[]} onContinue={onContinue} />);
    expect(screen.getByText("No games yesterday")).toBeTruthy();
    click("See today");
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
