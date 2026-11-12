import type { Catalog, DayMarkets, DayPack, ScheduledGame } from "./types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const loadDates = async () => (await getJson<{ dates: string[] }>("days/index.json")).dates;
export const loadCatalog = () => getJson<Catalog>("cards.json");
export const loadSchedule = async () => (await getJson<{ games: ScheduledGame[] }>("schedule.json")).games;
export const loadDay = (date: string) => getJson<DayPack>(`days/${date}.json`);
/** The recap day has no games and therefore no markets file. */
export const loadMarkets = (date: string) => getJson<DayMarkets>(`markets/${date}.json`).catch(() => null);
