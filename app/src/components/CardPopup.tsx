import { useEffect, useRef, useState } from "preact/hooks";
import { backSrc } from "../cardImages";
import { TIERS, UPGRADE_COST } from "../game/economy.config";
import type { Card, Tier } from "../types";
import { BACK_LAYOUT, type Box } from "./backLayout";
import { CardFront } from "./CardImage";
import { Visual } from "./Visual";

const SWIPE_PX = 40;
const BURST_MS = 1000;
const LONG_TITLE = 24; // characters; longer titles use a smaller font to fit the title bar
const tierName = (t: Tier) => t[0].toUpperCase() + t.slice(1);
const place = (b: Box) => ({ top: `${b.top}%`, left: `${b.left}%`, width: `${b.width}%`, height: `${b.height}%` });

function CardBack({ card, tier }: { card: Card; tier: Tier }) {
  const L = BACK_LAYOUT[tier];
  const quiz = card.back.diamond;
  return (
    <div class="card-back" style={{ backgroundImage: `url(${backSrc(card.category, tier)})` }}>
      <div class={`back-box back-title${card.title.length > LONG_TITLE ? " long" : ""}`} style={place(L.title)}>{card.title}</div>
      <div class="back-box back-text" style={place(L.text1)}><p>{card.back.normal}</p></div>
      {L.text2 && <div class="back-box back-text" style={place(L.text2)}><p>{card.back.silver}</p></div>}
      {L.visual && (
        <div class="back-box back-visual" style={place(L.visual)}>
          {card.statsHidden ? <p class="back-note">Full stats are in the private build.</p> : (
            <>
              <p>{card.back.gold.text}</p>
              <Visual gold={card.back.gold} />
            </>
          )}
        </div>
      )}
      {L.quiz && (
        <div class="back-box back-quiz" style={place(L.quiz)}>
          <p>{quiz.question}</p>
          <ol>
            {quiz.options.map((o, i) => (
              <li key={o} class={i === quiz.answerIndex ? "correct" : undefined}>
                <span>{o}</span>{i === quiz.answerIndex && <span class="sr-only"> (correct answer)</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function CardPopup({ card, tier, pucks, onClose, onFlipToBack, onUpgrade }: {
  card: Card; tier: Tier; pucks: number; onClose(): void; onFlipToBack(): void;
  onUpgrade(passedQuiz: boolean): { ok: boolean; reason?: string };
}) {
  const [flipped, setFlipped] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [message, setMessage] = useState("");
  const [burst, setBurst] = useState<Tier | null>(null);
  const reportedBack = useRef(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeRef = useRef<HTMLButtonElement>(null);
  const latestClose = useRef(onClose);
  latestClose.current = onClose;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") latestClose.current(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); clearTimeout(burstTimer.current); };
  }, []);

  const flip = () => {
    if (!flipped && !reportedBack.current) { reportedBack.current = true; onFlipToBack(); }
    setFlipped(!flipped);
  };
  const next = TIERS[TIERS.indexOf(tier) + 1] as Exclude<Tier, "normal"> | undefined;
  const upgrade = (passedQuiz: boolean) => {
    if (!next) return;
    const r = onUpgrade(passedQuiz);
    if (!r.ok) { setMessage(`Upgrade failed: ${r.reason}`); return; }
    setMessage("");
    setBurst(next);
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(null), BURST_MS);
  };
  const answer = (i: number) => {
    setQuiz(false);
    if (i === card.back.diamond.answerIndex) upgrade(true);
    else setMessage("Not this time. Read the card back and try again.");
  };

  return (
    <div class="popup-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="popup" role="dialog" aria-modal="true" aria-label={card.title}>
        <button ref={closeRef} type="button" class="popup-close" aria-label="Close" onClick={onClose}>×</button>
        <div
          class={`popup-card tier-${tier}${burst ? ` upgrade-burst to-${burst}` : ""}`}
          onPointerDown={(e) => { swiped.current = false; swipeStart.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={(e) => {
            const s = swipeStart.current;
            swipeStart.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y)) { swiped.current = true; flip(); }
          }}
          onClick={(e) => {
            if (swiped.current) { swiped.current = false; return; }
            if ((e.target as Element).closest("button")) return;
            flip();
          }}
        >
          <div class="popup-face" key={flipped ? "back" : "front"}>
            {flipped ? <CardBack card={card} tier={tier} /> : <CardFront card={card} tier={tier} size="full" />}
          </div>
        </div>
        {!flipped && card.image && <p class="popup-caption">{card.front.map((l) => <span key={l}>{l}</span>)}</p>}
        <button type="button" class="popup-flip" onClick={flip}>Flip card</button>

        <div class="popup-upgrade">
          {next ? (
            <button
              type="button"
              class="primary"
              disabled={pucks < UPGRADE_COST[next]}
              onClick={() => { setMessage(""); if (next === "diamond") setQuiz(true); else upgrade(false); }}
            >
              Upgrade to {tierName(next)} · {UPGRADE_COST[next]} Pucks
            </button>
          ) : <p class="fully-upgraded">Fully upgraded</p>}
          {quiz && next === "diamond" && (
            <div class="diamond-challenge">
              <p>{card.back.diamond.question}</p>
              {card.back.diamond.options.map((o, i) => (
                <button key={o} type="button" onClick={() => answer(i)}>{o}</button>
              ))}
            </div>
          )}
          {message && <p role="alert">{message}</p>}
        </div>
      </div>
    </div>
  );
}
