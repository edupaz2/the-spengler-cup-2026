import { useEffect, useState } from "preact/hooks";
import { CardFront, CardLocked } from "../components/CardImage";
import { CardPopup } from "../components/CardPopup";
import { openPack, upgradeCard } from "../game/economy";
import { PACKS } from "../game/economy.config";
import { claimSet } from "../game/sets";
import type { Profile } from "../state/profile";
import type { Card, CardCategory, Catalog } from "../types";
import { CardReveal } from "./GiftDeck";

const CATEGORIES: [CardCategory, string][] = [
  ["player", "Players"], ["goalie", "Goalies"], ["team", "Teams"], ["moment", "Moments"],
  ["rule", "Rules"], ["gotd", "Game of the Day"], ["achievement", "Achievements"],
];
const TABS = [["album", "Album"], ["sets", "Sets"], ["shop", "Shop"]] as const;
type Tab = (typeof TABS)[number][0];

let packCounter = 0;

function tabFromHash(): Tab {
  const tab = new URLSearchParams(location.hash.split("?")[1] ?? "").get("tab");
  return TABS.find(([id]) => id === tab)?.[0] ?? "album";
}

export function Cards({ catalog, profile, update, today, rng = Math.random }: {
  catalog: Catalog; profile: Profile; update(fn: (p: Profile) => Profile): void; today: string; rng?: () => number;
}) {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [filter, setFilter] = useState<CardCategory>("player");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [reveal, setReveal] = useState<{ cards: Card[]; owned: Set<string> } | null>(null);

  useEffect(() => {
    const on = () => setTab(tabFromHash());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);

  const owned = catalog.cards.filter((c) => c.id in profile.collection).length;
  const sel = catalog.cards.find((c) => c.id === selected);
  const selTier = sel ? profile.collection[sel.id]?.tier : undefined;

  const buy = (packId: string) => {
    const out = openPack(profile, packId, catalog.cards, rng, `shop:${Date.now()}:${packCounter++}`, today);
    if (out.pulled.length === 0) { setMessage("You cannot afford that pack."); return; }
    setMessage("");
    setReveal({ cards: out.pulled, owned: new Set(Object.keys(profile.collection)) });
    update(() => out.profile);
  };
  const upgrade = (passedQuiz: boolean) => {
    if (!sel) return { ok: false, reason: "not-owned" };
    const r = upgradeCard(profile, sel.id, passedQuiz);
    if (r.ok) update(() => r.profile);
    return { ok: r.ok, reason: r.ok ? undefined : r.reason };
  };
  const recordFlip = (id: string) => update((p) => {
    const key = `${today}:${id}`;
    return p.flips.includes(key) ? p : { ...p, flips: [...p.flips, key] };
  });

  return (
    <section class="cards">
      <div class="cards-head">
        <h1>Cards</h1>
        <span class="chip">{profile.pucks} Pucks</span>
      </div>
      <p class="muted">Pucks are play money.</p>

      <div class="seg" role="tablist" aria-label="Cards">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "album" && (
        <>
          <p class="album-count">My album · {owned} of {catalog.cards.length}</p>
          <div class="album-progress" role="progressbar" aria-label="Album progress" aria-valuemin={0} aria-valuemax={catalog.cards.length} aria-valuenow={owned}>
            <span style={{ width: `${catalog.cards.length ? (owned / catalog.cards.length) * 100 : 0}%` }} />
          </div>
          <div class="filters">
            {CATEGORIES.map(([id, label]) => {
              const inCat = catalog.cards.filter((c) => c.category === id);
              const have = inCat.filter((c) => c.id in profile.collection).length;
              return (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                  {`${label} ${have}/${inCat.length}`}
                </button>
              );
            })}
          </div>
          <div class="album-grid">
            {catalog.cards.filter((c) => c.category === filter).map((c) => {
              const have = profile.collection[c.id];
              return have ? (
                <button key={c.id} type="button" class="album-card" aria-label={`${c.title}, ${have.tier}`} onClick={() => setSelected(c.id)}>
                  <CardFront card={c} tier={have.tier} size="thumb" />
                </button>
              ) : (
                <div key={c.id} class="album-card locked"><CardLocked category={c.category} /></div>
              );
            })}
          </div>
        </>
      )}

      {tab === "sets" && (
        <ul class="sets">
          {catalog.sets.map((s) => {
            const have = s.cardIds.filter((id) => id in profile.collection).length;
            const done = have === s.cardIds.length;
            const claimed = profile.claimedSets.includes(s.id);
            return (
              <li key={s.id} class={claimed ? "claimed" : undefined}>
                <div class="set-info">
                  <strong>{s.label}</strong>
                  <small>{have} / {s.cardIds.length}</small>
                  <div class="set-bar"><span style={{ width: `${(have / s.cardIds.length) * 100}%` }} /></div>
                </div>
                {claimed ? <em>Claimed</em> : done && (
                  <button type="button" class="primary" onClick={() => update((p) => claimSet(p, s))}>Claim {s.reward.pucks} Pucks</button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "shop" && (
        <>
          <div class="shop">
            {Object.entries(PACKS).filter(([, p]) => p.price > 0).map(([id, p]) => (
              <button key={id} type="button" class="pack" disabled={profile.pucks < p.price} onClick={() => buy(id)}>
                Buy {id} pack ({p.price} Pucks)
                <small>{p.size} cards</small>
              </button>
            ))}
          </div>
          {message && <p role="alert">{message}</p>}
        </>
      )}

      {reveal && (
        <div class="popup-backdrop">
          <div class="popup" role="dialog" aria-modal="true" aria-label="Your new cards">
            <CardReveal cards={reveal.cards} owned={reveal.owned} onDone={() => setReveal(null)} />
          </div>
        </div>
      )}

      {sel && selTier && (
        <CardPopup
          key={sel.id}
          card={sel}
          tier={selTier}
          pucks={profile.pucks}
          onClose={() => setSelected(null)}
          onFlipToBack={() => recordFlip(sel.id)}
          onUpgrade={upgrade}
        />
      )}
    </section>
  );
}
