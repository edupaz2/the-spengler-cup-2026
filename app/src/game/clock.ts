export interface Clock {
  now(): Date;
  day(): string;
  advanceDay(): void;
  isFinished(): boolean;
  mode: "live" | "replay";
}

const KEY = "sa.replay";
const ZONE = "Europe/Zurich";

function zurichDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** UTC instant of 08:00 Europe/Zurich on a given date (handles CET and CEST). */
export function eightZurich(date: string): Date {
  for (const offset of [1, 2]) {
    const d = new Date(`${date}T${String(8 - offset).padStart(2, "0")}:00:00Z`);
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", hour12: false }).format(d));
    if (hour === 8) return d;
  }
  return new Date(`${date}T07:00:00Z`);
}

export function createClock(
  mode: "live" | "replay",
  dates: string[],
  storage: Pick<Storage, "getItem" | "setItem">,
  serverNow: () => Date = () => new Date(),
): Clock {
  if (mode === "live") {
    return { mode, now: serverNow, day: () => zurichDate(serverNow()), advanceDay() {}, isFinished: () => false };
  }
  const last = dates.length - 1;
  let index = 0;
  try {
    const n = Number(storage.getItem(KEY));
    if (Number.isInteger(n) && n >= 0 && n <= dates.length) index = n;
  } catch { /* start from the first day */ }
  const save = () => { try { storage.setItem(KEY, String(index)); } catch { /* ignore */ } };
  return {
    mode,
    now: () => eightZurich(dates[Math.min(index, last)]),
    day: () => dates[Math.min(index, last)],
    advanceDay() {
      if (index <= last) index += 1; // index === dates.length means the replay is finished
      save();
    },
    isFinished: () => index > last,
  };
}
