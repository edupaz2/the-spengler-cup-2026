import { useRef, useState } from "preact/hooks";
import type { ScheduledGame } from "../types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-12-27" -> "Sat 27 Dec" (date arithmetic in UTC, no timezone shift). */
export function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

const SWIPE_PX = 40;

export function GameRow({ game: g, played }: { game: ScheduledGame; played: boolean }) {
  return (
    <article class="game">
      <p class="game-meta">{g.stage}{g.group ? ` · Group ${g.group}` : ""}</p>
      <p class="game-teams"><span>{g.home}</span><span>{g.away}</span></p>
      {played ? (
        <p class="game-result"><strong>{g.score[0]}:{g.score[1]}</strong></p>
      ) : (
        <p class="game-result"><strong>{g.start}</strong></p>
      )}
    </article>
  );
}

export function GamesCarousel({ games, dates, today }: { games: ScheduledGame[]; dates: string[]; today: string }) {
  const withGames = new Set(games.map((g) => g.date));
  const pages = dates.filter((d) => withGames.has(d));
  if (!withGames.has(today) && !pages.includes(today)) pages.push(today);
  pages.sort();
  const [index, setIndex] = useState(() => Math.max(0, pages.indexOf(today)));
  const touchX = useRef<number | null>(null);

  const last = pages.length - 1;
  const at = Math.min(index, last);
  const go = (to: number) => setIndex(Math.min(last, Math.max(0, to)));
  const date = pages[at];
  const dayGames = games.filter((g) => g.date === date).sort((a, b) => a.start.localeCompare(b.start));
  const played = date < today;

  return (
    <section
      class="carousel"
      aria-label="Games"
      onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        const from = touchX.current;
        touchX.current = null;
        const to = e.changedTouches[0]?.clientX;
        if (from === null || to === undefined || Math.abs(to - from) < SWIPE_PX) return;
        go(at + (to < from ? 1 : -1));
      }}
    >
      <header class="carousel-head">
        <button type="button" aria-label="Previous day" disabled={at === 0} onClick={() => go(at - 1)}>‹</button>
        <div>
          <strong>{dayLabel(date)}</strong>
          {date === today && <span class="today-tag">Today</span>}
        </div>
        <button type="button" aria-label="Next day" disabled={at === last} onClick={() => go(at + 1)}>›</button>
      </header>
      <div class="carousel-page" key={date}>
        {played && dayGames.length > 0 && <p class="muted">Final score</p>}
        {dayGames.length === 0 && <p class="muted">No games</p>}
        {dayGames.map((g) => <GameRow key={g.id} game={g} played={played} />)}
      </div>
      <div class="dots">
        {pages.map((d, i) => <span key={d} class="dot" aria-current={i === at ? "true" : undefined} />)}
      </div>
    </section>
  );
}
