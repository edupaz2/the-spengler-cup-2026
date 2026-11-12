import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { Predict } from "./Predict";
import { SettleSheet } from "../components/SettleSheet";
import { MAX_STAKE, MIN_STAKE } from "../game/predictions.config";
import { newProfile } from "../state/profile";
import type { Market } from "../types";

const M: Market = {
  id: "2025-12-27-g3-winner", kind: "winner", date: "2025-12-27", gameId: "3", lockAt: "2025-12-27T13:00:00+01:00",
  options: [{ id: "home", label: "IFK Helsinki", odds: 2.5 }, { id: "away", label: "HC Sparta Praha", odds: 1.6 }],
};
const MORNING = new Date("2025-12-27T07:00:00Z");
const props = (over = {}) => ({ markets: [M], now: MORNING, profile: { ...newProfile(), pucks: 300 }, update: vi.fn(), date: "2025-12-27", ...over });

describe("Predict", () => {
  it("shows_play_money_label", () => {
    render(<Predict {...props()} />);
    expect(screen.getByText(/play money/i)).toBeTruthy();
  });
  it("stake_picker_respects_min_max", () => {
    render(<Predict {...props()} />);
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(Number(slider.min)).toBe(MIN_STAKE);
    expect(Number(slider.max)).toBe(MAX_STAKE);
  });
  it("bet_button_disabled_when_locked_or_short", () => {
    const { unmount } = render(<Predict {...props({ now: new Date("2025-12-27T12:30:00Z") })} />);
    fireEvent.click(screen.getByRole("button", { name: /Sparta/ }));
    expect((screen.getByRole("button", { name: /place bet/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/locked/i)).toBeTruthy();
    unmount();
    render(<Predict {...props({ profile: { ...newProfile(), pucks: 5 } })} />);
    fireEvent.click(screen.getByRole("button", { name: /Sparta/ }));
    expect((screen.getByRole("button", { name: /place bet/i }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("placing_a_bet_calls_update_with_a_deducted_profile", () => {
    const p = props();
    render(<Predict {...p} />);
    fireEvent.click(screen.getByRole("button", { name: /Sparta/ }));
    fireEvent.click(screen.getByRole("button", { name: /place bet/i }));
    expect(p.update).toHaveBeenCalledOnce();
    const next = p.update.mock.calls[0][0](p.profile);
    expect(next.bets).toHaveLength(1);
    expect(next.pucks).toBe(300 - MIN_STAKE);
  });
  it("day_without_games_shows_recap_not_markets", () => {
    render(<Predict {...props({ markets: [] })} />);
    expect(screen.getByText(/no games today/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /place bet/i })).toBeNull();
  });
});

describe("SettleSheet", () => {
  it("settle_sheet_lists_wins_and_losses", () => {
    const m2: Market = { ...M, id: "2025-12-27-g4-winner", gameId: "4", options: [{ id: "home", label: "HC Davos", odds: 1.9 }, { id: "away", label: "Collegiate Selects", odds: 1.9 }] };
    render(
      <SettleSheet
        markets={[M, m2]}
        bets={[{ marketId: M.id, optionId: "away", stake: 50 }, { marketId: m2.id, optionId: "home", stake: 20 }]}
        outcomes={[{ marketId: M.id, won: true, payout: 80 }, { marketId: m2.id, won: false, payout: 0 }]}
      />,
    );
    expect(screen.getByText(/won/i).textContent).toMatch(/\+80/);
    expect(screen.getByText(/lost/i).textContent).toMatch(/20/);
  });
});
