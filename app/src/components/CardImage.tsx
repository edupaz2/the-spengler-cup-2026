import { useState } from "preact/hooks";
import { frontSrc, lockedSrc, type ImageSize } from "../cardImages";
import type { Card, CardCategory, Tier } from "../types";

export function CardFront({ card, tier, size }: { card: Card; tier: Tier; size: ImageSize }) {
  const src = frontSrc(card, tier, size);
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <div class={`card-fallback rarity-${card.rarity} tier-${tier}`}>
        <strong>{card.title}</strong>
        {card.front.map((line) => <span key={line}>{line}</span>)}
      </div>
    );
  }
  return <img class="card-img" src={src} alt={`${card.title}, ${tier}`} loading="lazy" decoding="async" onError={() => setFailed(src)} />;
}

export function CardLocked({ category }: { category: CardCategory }) {
  return <img class="card-img" src={lockedSrc(category)} alt="Locked card" loading="lazy" decoding="async" />;
}
