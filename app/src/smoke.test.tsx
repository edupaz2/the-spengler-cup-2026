// End-to-end smoke test of the core journey on the real generated data (jsdom, no browser download needed).
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./app";

function stubFetch() {
  vi.stubGlobal("fetch", async (url: string) => {
    try {
      const body = readFileSync("public/data/" + String(url).split("data/")[1], "utf8");
      return { ok: true, status: 200, json: async () => JSON.parse(body) } as Response;
    } catch {
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }
  });
}

const click = (el: HTMLElement) => fireEvent.click(el);

/** Steps through the one-by-one reveal until its final "Continue". */
async function openAllCards() {
  await screen.findByText(/^1 of \d+$/);
  while (screen.queryByRole("button", { name: "Next card" })) click(screen.getByRole("button", { name: "Next card" }));
  click(screen.getByRole("button", { name: "Continue" }));
}

describe("core journey", () => {
  let errors: unknown[][];
  beforeEach(() => {
    localStorage.clear();
    location.hash = "#/";
    errors = [];
    vi.spyOn(console, "error").mockImplementation((...a) => { errors.push(a); });
    stubFetch();
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("claim, predict, play, advance, settle, upgrade", async () => {
    render(<App />);

    // opening: welcome, tear open the deck, reveal every card, then Today
    click(await screen.findByRole("button", { name: "Open my first deck" }));
    click(await screen.findByRole("button", { name: "Tear it open" }));
    await openAllCards();
    expect(await screen.findByRole("link", { name: /daily quiz/i })).toBeTruthy();

    // place a prediction
    location.hash = "#/predict";
    const bet = await screen.findAllByRole("button", { name: /place bet/i });
    const card = bet[0].closest("article") as HTMLElement;
    click(within(card).getAllByRole("button").find((b) => /\d\.\d\dx/.test(b.textContent ?? "")) as HTMLElement);
    click(within(card).getByRole("button", { name: /place bet/i }));
    expect(within(card).getByText(/your bet/i)).toBeTruthy();

    // play the five questions and read each reveal
    location.hash = "#/challenge/2025-12-26";
    // five questions on the full data, fewer on the synthetic demo data
    await waitFor(() => expect(document.querySelector(".question")).toBeTruthy());
    while (document.querySelector(".question")) {
      const answer = [...document.querySelectorAll<HTMLButtonElement>(".options button, .hl-options button")].find((b) => !b.disabled)!;
      click(answer);
      expect(await screen.findByRole("status")).toBeTruthy(); // the reveal
      click(screen.getByRole("button", { name: /^(next|finish)$/i }));
      await waitFor(() => expect(document.querySelector(".question") || screen.queryByText(/done for today/i)).toBeTruthy());
    }
    expect(await screen.findByText(/done for today/i)).toBeTruthy();

    // advance the replay day: yesterday's prediction settles
    click(screen.getByRole("button", { name: /advance day/i }));
    click(await screen.findByRole("button", { name: "Tear it open" }));
    await openAllCards();
    expect(await screen.findByText("Yesterday in Davos")).toBeTruthy();
    expect(await screen.findByLabelText(/yesterday's predictions/i)).toBeTruthy();
    click(screen.getByRole("button", { name: "See today" }));
    location.hash = "#/";
    expect(await screen.findByRole("link", { name: /daily quiz/i })).toBeTruthy();
    expect(screen.queryByText("Yesterday in Davos")).toBeNull();

    // upgrade a card to silver
    location.hash = "#/cards";
    // find a category that holds an owned card, then open it
    const categories = await screen.findAllByRole("button", { name: / \d+\/\d+$/ });
    const withOwned = categories.find((b) => !/ 0\/\d+$/.test(b.textContent ?? "")) as HTMLElement;
    click(withOwned);
    click(document.querySelector<HTMLButtonElement>("button.album-card") as HTMLElement);
    click(await screen.findByRole("button", { name: /upgrade to silver/i }));
    await waitFor(() => expect(document.querySelector(".tier-silver")).toBeTruthy());

    expect(errors).toEqual([]);
  });

  it("advancing the replay day mid-reveal does not strand the gift deck", async () => {
    render(<App />);
    click(await screen.findByRole("button", { name: "Open my first deck" }));
    click(await screen.findByRole("button", { name: "Tear it open" }));
    await screen.findByText(/^1 of \d+$/);
    while (screen.queryByRole("button", { name: "Next card" })) click(screen.getByRole("button", { name: "Next card" }));

    // advance while the first day's reveal is on its last card: the stale deck must give way to the new day's
    click(screen.getByRole("button", { name: /advance day/i }));

    // the new day offers its own deck, which opens and leads to Today
    click(await screen.findByRole("button", { name: "Tear it open" }));
    await openAllCards();
    const seeToday = screen.queryByRole("button", { name: "See today" });
    if (seeToday) click(seeToday);
    expect(await screen.findByRole("link", { name: /daily quiz/i })).toBeTruthy();
    expect(errors).toEqual([]);
  });
});
