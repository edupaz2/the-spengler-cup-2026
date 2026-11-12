import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { ReplayBar } from "./ReplayBar";
import { createClock } from "../game/clock";

const DATES = ["2025-12-26", "2025-12-27", "2025-12-28"];
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe("ReplayBar", () => {
  it("replay_bar_advances_day", () => {
    const clock = createClock("replay", DATES, mem());
    const onAdvance = vi.fn();
    const { container } = render(<ReplayBar clock={clock} onAdvance={onAdvance} />);
    expect(container.textContent).toContain("2025-12-26");
    fireEvent.click(screen.getByRole("button", { name: /advance day/i }));
    expect(clock.day()).toBe("2025-12-27");
    expect(onAdvance).toHaveBeenCalledOnce();
  });
  it("hidden_in_live_mode", () => {
    const live = createClock("live", DATES, mem());
    const { container } = render(<ReplayBar clock={live} onAdvance={() => {}} />);
    expect(container.textContent).toBe("");
  });
});
