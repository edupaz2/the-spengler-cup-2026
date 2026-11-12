import { useEffect, useRef, useState } from "preact/hooks";
import { CardFront } from "../components/CardImage";
import { dayLabel } from "../components/GamesCarousel";
import { DUPLICATE_PUCKS } from "../game/economy.config";
import type { Card } from "../types";

export function CardReveal({ cards, owned, onDone }: { cards: Card[]; owned: Set<string>; onDone(): void }) {
  const [index, setIndex] = useState(0);
  const finished = useRef(false);
  const empty = cards.length === 0;
  useEffect(() => {
    if (empty && !finished.current) { finished.current = true; onDone(); }
  }, [empty, onDone]);
  if (empty) return null;
  const last = cards.length - 1;
  const at = Math.min(index, last);
  const card = cards[at];
  const duplicate = owned.has(card.id) || cards.slice(0, at).some((c) => c.id === card.id);
  const advance = () => {
    if (at < last) { setIndex(at + 1); return; }
    if (finished.current) return;
    finished.current = true;
    onDone();
  };
  return (
    <section class="opening reveal">
      <h1>Your new cards</h1>
      <p class="muted">{at + 1} of {cards.length}</p>
      <div class="reveal-card" key={`${at}:${card.id}`} onClick={() => { if (at < last) advance(); }}>
        <CardFront card={card} tier="normal" size="full" />
      </div>
      <p class={`reveal-tag ${duplicate ? "dup" : "new"}`}>{duplicate ? `Duplicate · +${DUPLICATE_PUCKS[card.rarity]} Pucks` : "New"}</p>
      <button type="button" class="primary" onClick={advance}>{at < last ? "Next card" : "Continue"}</button>
    </section>
  );
}

export function GiftDeck({ date, onClaim, collectionBefore, onDone }: {
  date: string; onClaim(): Card[]; collectionBefore: Set<string>; onDone(): void;
}) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [before] = useState(collectionBefore); // snapshot: the claim changes the collection
  const claimed = useRef(false);
  const tear = () => {
    if (claimed.current) return;
    claimed.current = true;
    const pulled = onClaim();
    if (pulled.length === 0) onDone();
    else setCards(pulled);
  };
  if (cards) return <CardReveal cards={cards} owned={before} onDone={onDone} />;
  return (
    <section class="opening">
      <p class="opening-label">{dayLabel(date)} · your daily gift</p>
      <img class="opening-art deck-art" src={`${import.meta.env.BASE_URL}art/deck.webp`} alt="A sealed deck of cards" />
      <h1>A new deck for you</h1>
      <p>Your daily cards are inside</p>
      <button type="button" class="primary" onClick={tear}>Tear it open</button>
    </section>
  );
}
