import { fireEvent, render, screen, within } from "@testing-library/preact";
import { useState } from "preact/hooks";
import { afterEach, describe, expect, it } from "vitest";
import { Cards } from "./Cards";
import { newProfile, type Profile } from "../state/profile";
import type { Card, CardCategory, Catalog, Tier } from "../types";

function card(id: string, category: CardCategory = "player", over: Partial<Card> = {}): Card {
  return {
    id, category, title: `Title ${id}`, team: null, availableOn: null, unlock: null, image: null, rarity: "common", front: [`front ${id}`],
    back: {
      normal: `normal text ${id}`, silver: `silver text ${id}`,
      gold: { text: `gold text ${id}`, visual: "table", data: {} },
      diamond: { question: `Diamond question ${id}?`, options: ["Right", "Wrong 1", "Wrong 2", "Wrong 3"], answerIndex: 0 },
    },
    ...over,
  };
}
const TEAMS = ["team-hc-davos", "team-canada", "team-ocelari", "team-fribourg", "team-helsinki", "team-selects"];
const CATALOG: Catalog = {
  cards: [
    card("a"), card("b"), card("c"), card("r1", "rule"), card("ach1", "achievement", { unlock: "streak3" }),
    ...TEAMS.map((id) => card(id, "team", id === "team-hc-davos" ? { title: "HC Davos", image: "team_hc-davos" } : {})),
  ],
  sets: [{ id: "s1", label: "Alpha set", cardIds: ["a", "b", "c"], reward: { pucks: 100 } }],
};
type Owned = Profile["collection"];
function Harness({ owned = {}, pucks = 1000, catalog = CATALOG }: { owned?: Owned; pucks?: number; catalog?: Catalog }) {
  const [p, setP] = useState<Profile>({ ...newProfile(), pucks, collection: owned });
  return (
    <>
      <output data-testid="pucks">{p.pucks}</output>
      <output data-testid="tier-a">{p.collection.a?.tier}</output>
      <output data-testid="flips">{p.flips.join(",")}</output>
      <Cards catalog={catalog} profile={p} update={(fn) => setP(fn)} today="2025-12-27" rng={() => 0.1} />
    </>
  );
}
const own = (tier: Tier = "normal") => ({ tier, copies: 1 });
const openA = () => fireEvent.click(screen.getByRole("button", { name: /^Title a, / }));

afterEach(() => { location.hash = ""; });

describe("Cards album", () => {
  it("album_shows_owned_fronts_and_inert_locked_cards", () => {
    render(<Harness owned={{ "team-hc-davos": { tier: "normal", copies: 1 } }} />);
    fireEvent.click(screen.getByRole("button", { name: /teams 1\/6/i }));
    expect(screen.getByRole("button", { name: "HC Davos, normal" })).toBeTruthy();
    const locked = screen.getAllByAltText("Locked card");
    expect(locked).toHaveLength(5);
    fireEvent.click(locked[0]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("upgrading_in_the_popup_switches_the_image_to_the_new_tier", () => {
    render(<Harness owned={{ "team-hc-davos": { tier: "normal", copies: 1 } }} pucks={500} />);
    fireEvent.click(screen.getByRole("button", { name: /teams/i }));
    fireEvent.click(screen.getByRole("button", { name: "HC Davos, normal" }));
    fireEvent.click(screen.getByRole("button", { name: /upgrade to silver/i }));
    const img = within(screen.getByRole("dialog")).getByRole("img") as HTMLImageElement;
    expect(img.src).toMatch(/front_team_hc-davos_silver\.webp$/);
  });
  it("shows_album_progress_and_category_counts_in_order", () => {
    render(<Harness owned={{ a: own(), b: own(), "team-canada": own() }} />);
    expect(screen.getByText("My album · 3 of 11")).toBeTruthy();
    const labels = screen.getAllByRole("button").map((b) => b.textContent).filter((t) => /\d+\/\d+$/.test(t ?? ""));
    expect(labels).toEqual(["Players 2/3", "Goalies 0/0", "Teams 1/6", "Moments 0/0", "Rules 0/1", "Game of the Day 0/0", "Achievements 0/1"]);
    expect(screen.queryByRole("button", { name: /^all$/i })).toBeNull();
  });
  it("locked_cards_have_no_hint_text", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /achievements/i }));
    expect(screen.getByAltText("Locked card")).toBeTruthy();
    expect(screen.queryByText(/earn it/i)).toBeNull();
  });
  it("first_back_view_records_a_flip_for_today", () => {
    render(<Harness owned={{ a: own() }} />);
    openA();
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
    expect(screen.getByTestId("flips").textContent).toBe("2025-12-27:a");
  });
  it("upgrade_disabled_when_pucks_short", () => {
    render(<Harness owned={{ a: own() }} pucks={10} />);
    openA();
    expect((screen.getByRole("button", { name: /upgrade to silver/i }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("upgrade_spends_pucks_and_raises_tier", () => {
    render(<Harness owned={{ a: own() }} />);
    openA();
    fireEvent.click(screen.getByRole("button", { name: /upgrade to silver/i }));
    expect(screen.getByTestId("tier-a").textContent).toBe("silver");
    expect(screen.getByTestId("pucks").textContent).toBe("950");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("diamond_needs_challenge", () => {
    render(<Harness owned={{ a: own("gold") }} />);
    openA();
    fireEvent.click(screen.getByRole("button", { name: /upgrade to diamond/i }));
    expect(screen.getByText("Diamond question a?")).toBeTruthy();
    expect(screen.getByTestId("tier-a").textContent).toBe("gold");
    fireEvent.click(screen.getByRole("button", { name: "Wrong 1" }));
    expect(screen.getByText("Not this time. Read the card back and try again.")).toBeTruthy();
    expect(screen.getByTestId("tier-a").textContent).toBe("gold");
    expect(screen.getByTestId("pucks").textContent).toBe("1000");
    fireEvent.click(screen.getByRole("button", { name: /upgrade to diamond/i }));
    fireEvent.click(screen.getByRole("button", { name: "Right" }));
    expect(screen.getByTestId("tier-a").textContent).toBe("diamond");
    expect(screen.getByText("Fully upgraded")).toBeTruthy();
  });
});

describe("Cards shop and sets", () => {
  it("shop_pack_reduces_pucks_and_reveals_the_cards", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Shop" }));
    fireEvent.click(screen.getByRole("button", { name: /buy standard pack/i }));
    expect(Number(screen.getByTestId("pucks").textContent)).not.toBe(1000);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("1 of 3")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Next card" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Next card" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Continue" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("shop_tab_opens_from_the_hash", () => {
    location.hash = "#/cards?tab=shop";
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Shop" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: /buy standard pack/i })).toBeTruthy();
  });
  it("album_is_the_default_tab", () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Album" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.queryByRole("button", { name: /buy standard pack/i })).toBeNull();
  });
  it("set_progress_counts_owned_cards", () => {
    render(<Harness owned={{ a: own(), b: own() }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Sets" }));
    expect(screen.getByText("2 / 3")).toBeTruthy();
  });
  it("claim_set_button_only_when_complete", () => {
    const { unmount } = render(<Harness owned={{ a: own(), b: own() }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Sets" }));
    expect(screen.queryByRole("button", { name: /claim 100/i })).toBeNull();
    unmount();
    render(<Harness owned={{ a: own(), b: own(), c: own() }} />);
    fireEvent.click(screen.getByRole("tab", { name: "Sets" }));
    fireEvent.click(screen.getByRole("button", { name: /claim 100/i }));
    expect(screen.getByTestId("pucks").textContent).toBe("1100");
    expect(screen.queryByRole("button", { name: /claim 100/i })).toBeNull();
  });
});
