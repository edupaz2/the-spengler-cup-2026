import { act, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CardPopup } from "./CardPopup";
import { BACK_LAYOUT } from "./backLayout";
import type { Card } from "../types";

const davos: Card = {
  id: "team-hc-davos", category: "team", title: "HC Davos", team: "HC Davos", availableOn: null, unlock: null,
  image: "team_hc-davos", rarity: "legendary", front: ["Group B", "17 titles"],
  back: {
    normal: "31 Swiss titles and 16 Spengler Cup titles before this edition, the host club.",
    silver: "Through 2025: 17 Spengler Cup titles and 42 finals reached.",
    gold: { text: "Their 2025 results.", visual: "table", data: { rows: [["vs Team Canada", "4:1"]] } },
    diamond: { question: "How many games did HC Davos play in 2025?", options: ["3", "4", "5", "6"], answerIndex: 2 },
  },
};
const noop = () => {};
const ok = () => ({ ok: true });

afterEach(() => vi.useRealTimers());

describe("CardPopup", () => {
  it("flips_with_the_button_and_reports_the_first_back_view_once", () => {
    const onFlip = vi.fn();
    render(<CardPopup card={davos} tier="normal" pucks={0} onClose={() => {}} onFlipToBack={onFlip} onUpgrade={() => ({ ok: true })} />);
    expect(screen.queryByText(davos.back.normal)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(screen.getByText(davos.back.normal)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(onFlip).toHaveBeenCalledTimes(1);
  });
  it("back_shows_only_what_the_tier_has_earned", () => {
    render(<CardPopup card={davos} tier="silver" pucks={0} onClose={() => {}} onFlipToBack={() => {}} onUpgrade={() => ({ ok: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(screen.getByText(davos.back.silver)).toBeTruthy();
    expect(screen.queryByText(davos.back.gold.text)).toBeNull();
  });
  it("hidden_stats_show_the_private_build_note_at_gold", () => {
    render(<CardPopup card={{ ...davos, statsHidden: true }} tier="gold" pucks={0} onClose={() => {}} onFlipToBack={() => {}} onUpgrade={() => ({ ok: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(screen.getByText("Full stats are in the private build.")).toBeTruthy();
  });
  it("hidden_stats_show_only_the_note_without_gold_text_or_visual", () => {
    const note = "Full stats are in the private build.";
    const { container, unmount } = render(<CardPopup card={{ ...davos, statsHidden: true }} tier="gold" pucks={0} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(screen.queryByText(davos.back.gold.text)).toBeNull();
    expect(screen.getAllByText(note)).toHaveLength(1);
    expect(container.querySelector(".back-visual table, .back-visual svg")).toBeNull();
    unmount();
    const same = { ...davos, statsHidden: true, back: { ...davos.back, gold: { ...davos.back.gold, text: note } } };
    render(<CardPopup card={same} tier="gold" pucks={0} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(screen.getAllByText(note)).toHaveLength(1);
  });
  it("a_tap_after_a_touch_swipe_flips_again", () => {
    const { container } = render(<CardPopup card={davos} tier="normal" pucks={0} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    const face = () => container.querySelector(".popup-card") as HTMLElement;
    fireEvent.pointerDown(face(), { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(face(), { clientX: 120, clientY: 100 }); // touch swipe: no click follows
    expect(screen.getByText(davos.back.normal)).toBeTruthy();
    fireEvent.pointerDown(face(), { clientX: 150, clientY: 100 });
    fireEvent.pointerUp(face(), { clientX: 150, clientY: 100 });
    fireEvent.click(face());
    expect(screen.queryByText(davos.back.normal)).toBeNull();
  });
  it("upgrade_button_does_not_flip_the_card_and_close_closes", () => {
    const onClose = vi.fn(); const onUpgrade = vi.fn(() => ({ ok: true }));
    render(<CardPopup card={davos} tier="normal" pucks={500} onClose={onClose} onFlipToBack={() => {}} onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByRole("button", { name: /upgrade to silver · 50 pucks/i }));
    expect(onUpgrade).toHaveBeenCalledWith(false);
    expect(screen.queryByText(davos.back.normal)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("is_a_dialog_named_after_the_card_with_the_front_caption", () => {
    render(<CardPopup card={davos} tier="normal" pucks={0} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    expect(screen.getByRole("dialog", { name: "HC Davos" })).toBeTruthy();
    expect((screen.getByRole("img") as HTMLImageElement).src).toMatch(/cards\/full\/front_team_hc-davos_normal\.webp$/);
    expect(screen.getByText("Group B")).toBeTruthy();
    expect(screen.getByText("17 titles")).toBeTruthy();
  });
  it("escape_and_backdrop_close", () => {
    const onClose = vi.fn();
    const { container } = render(<CardPopup card={davos} tier="normal" pucks={0} onClose={onClose} onFlipToBack={noop} onUpgrade={ok} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("dialog")); // inside the sheet: no close
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector(".popup-backdrop") as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("tapping_the_card_and_swiping_flip_it", () => {
    const { container } = render(<CardPopup card={davos} tier="normal" pucks={0} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    const face = () => container.querySelector(".popup-card") as HTMLElement;
    fireEvent.click(face());
    expect(screen.getByText(davos.back.normal)).toBeTruthy();
    fireEvent.pointerDown(face(), { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(face(), { clientX: 120, clientY: 104 });
    fireEvent.click(face()); // the click that ends a swipe does not flip again
    expect(screen.queryByText(davos.back.normal)).toBeNull();
    fireEvent.pointerDown(face(), { clientX: 200, clientY: 100 });
    fireEvent.pointerUp(face(), { clientX: 220, clientY: 100 }); // 20 px: not a swipe
    expect(screen.queryByText(davos.back.normal)).toBeNull();
  });
  it("back_uses_the_tier_template_and_shows_the_diamond_question_unclickable", () => {
    const { container } = render(<CardPopup card={davos} tier="diamond" pucks={0} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    const back = container.querySelector(".card-back") as HTMLElement;
    expect(back.style.backgroundImage).toMatch(/cards\/full\/back_team_diamond\.webp/);
    expect(screen.getByText("HC Davos", { selector: ".back-title" })).toBeTruthy();
    expect(screen.getByText(davos.back.gold.text)).toBeTruthy();
    expect(screen.getByText(davos.back.diamond.question)).toBeTruthy();
    expect(screen.getByText("5").closest("li")?.className).toMatch(/correct/);
    expect(screen.queryByRole("button", { name: "5" })).toBeNull();
    expect(screen.getByText("Fully upgraded")).toBeTruthy();
  });
  it("upgrade_is_disabled_when_pucks_are_short", () => {
    render(<CardPopup card={davos} tier="silver" pucks={149} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    expect((screen.getByRole("button", { name: "Upgrade to Gold · 150 Pucks" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("diamond_upgrade_asks_the_quiz_first", () => {
    const onUpgrade = vi.fn(() => ({ ok: true }));
    render(<CardPopup card={davos} tier="gold" pucks={1000} onClose={noop} onFlipToBack={noop} onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Diamond · 400 Pucks" }));
    expect(onUpgrade).not.toHaveBeenCalled();
    expect(screen.getByText(davos.back.diamond.question)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onUpgrade).not.toHaveBeenCalled();
    expect(screen.getByText("Not this time. Read the card back and try again.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Diamond · 400 Pucks" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(onUpgrade).toHaveBeenCalledWith(true);
  });
  it("a_failed_upgrade_shows_an_alert", () => {
    render(<CardPopup card={davos} tier="normal" pucks={500} onClose={noop} onFlipToBack={noop} onUpgrade={() => ({ ok: false, reason: "pucks" })} />);
    fireEvent.click(screen.getByRole("button", { name: /upgrade to silver/i }));
    expect(screen.getByRole("alert").textContent).toBe("Upgrade failed: pucks");
  });
  it("a_successful_upgrade_bursts_for_one_second", () => {
    vi.useFakeTimers();
    const { container } = render(<CardPopup card={davos} tier="normal" pucks={500} onClose={noop} onFlipToBack={noop} onUpgrade={ok} />);
    fireEvent.click(screen.getByRole("button", { name: /upgrade to silver/i }));
    expect(container.querySelector(".popup-card")?.className).toMatch(/upgrade-burst to-silver/);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector(".popup-card")?.className).not.toMatch(/upgrade-burst/);
  });
});

describe("BACK_LAYOUT", () => {
  it("adds_panels_as_the_tier_rises_and_keeps_them_on_the_card", () => {
    expect(BACK_LAYOUT.normal.text2).toBeUndefined();
    expect(BACK_LAYOUT.silver.text2).toBeTruthy();
    expect(BACK_LAYOUT.silver.visual).toBeUndefined();
    expect(BACK_LAYOUT.gold.visual).toBeTruthy();
    expect(BACK_LAYOUT.gold.quiz).toBeUndefined();
    expect(BACK_LAYOUT.diamond.quiz).toBeTruthy();
    for (const tier of Object.values(BACK_LAYOUT)) {
      for (const b of Object.values(tier)) {
        expect(b.top + b.height).toBeLessThanOrEqual(100);
        expect(b.left + b.width).toBeLessThanOrEqual(100);
      }
    }
  });
});
