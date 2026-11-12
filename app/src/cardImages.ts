import type { Card, CardCategory, Tier } from "./types";

export type ImageSize = "thumb" | "full";

const CATEGORY_SLUG: Partial<Record<CardCategory, string>> = { rule: "rules-and-concepts", gotd: "game-of-the-day" };

function url(size: ImageSize, name: string): string {
  return `${import.meta.env.BASE_URL}cards/${size}/${name}.webp`;
}

export function frontSrc(card: Card, tier: Tier, size: ImageSize): string | null {
  return card.image ? url(size, `front_${card.image}_${tier}`) : null;
}

export function backSrc(category: CardCategory, tier: Tier): string {
  return url("full", `back_${CATEGORY_SLUG[category] ?? category}_${tier}`);
}

export function lockedSrc(category: CardCategory): string {
  return url("thumb", `locked_${CATEGORY_SLUG[category] ?? category}`);
}
