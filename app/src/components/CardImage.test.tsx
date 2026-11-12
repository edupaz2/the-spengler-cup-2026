import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it } from "vitest";
import { CardFront } from "./CardImage";
import { backSrc, frontSrc, lockedSrc } from "../cardImages";
import type { Card } from "../types";

function card(over: Partial<Card> = {}): Card {
  return {
    id: "x", category: "team", title: "Title", team: null, availableOn: null, unlock: null, image: null, rarity: "common", front: ["front x"],
    back: {
      normal: "n", silver: "s",
      gold: { text: "g", visual: "table", data: {} },
      diamond: { question: "q?", options: ["Right", "W1", "W2", "W3"], answerIndex: 0 },
    },
    ...over,
  };
}

describe("card images", () => {
  it("builds_front_back_and_locked_urls", () => {
    expect(frontSrc(card({ image: "team_hc-davos" }), "silver", "thumb")).toMatch(/cards\/thumb\/front_team_hc-davos_silver\.webp$/);
    expect(backSrc("rule", "gold")).toMatch(/cards\/full\/back_rules-and-concepts_gold\.webp$/);
    expect(lockedSrc("gotd")).toMatch(/cards\/thumb\/locked_game-of-the-day\.webp$/);
    expect(frontSrc(card({ image: null }), "normal", "full")).toBeNull();
  });
  it("falls_back_to_text_when_the_image_fails", () => {
    render(<CardFront card={card({ title: "HC Davos", front: ["Group B"], image: "team_hc-davos" })} tier="normal" size="thumb" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("HC Davos")).toBeTruthy();
    expect(screen.getByText("Group B")).toBeTruthy();
  });
  it("falls_back_to_text_when_the_card_has_no_image", () => {
    render(<CardFront card={card({ title: "Mystery", image: null })} tier="normal" size="thumb" />);
    expect(screen.getByText("Mystery")).toBeTruthy();
  });
});
