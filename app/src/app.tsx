import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ReplayBar } from "./components/ReplayBar";
import { loadCatalog, loadDates, loadDay, loadMarkets, loadSchedule } from "./data";
import { createClock, type Clock } from "./game/clock";
import { Challenge } from "./screens/Challenge";
import { finishChallenge } from "./game/challenge";
import { applyAchievements } from "./game/achievements";
import { Today } from "./screens/Today";
import { dailyTasks } from "./game/tasks";
import { Tasks } from "./screens/Tasks";
import { loadProfile, saveProfile, type Profile } from "./state/profile";
import type { Catalog, DayPack, Market, ScheduledGame } from "./types";
import { Predict } from "./screens/Predict";
import { Cards } from "./screens/Cards";
import { SettleSheet } from "./components/SettleSheet";
import { claimDoor } from "./game/claim";
import { nextOpeningStep } from "./game/opening";
import { Welcome } from "./screens/Welcome";
import { GiftDeck } from "./screens/GiftDeck";
import { Recap } from "./screens/Recap";
import { settleBets, type Outcome } from "./game/predictions";

function useRoute(): string {
  const [route, setRoute] = useState(location.hash || "#/");
  useEffect(() => {
    const on = () => setRoute(location.hash || "#/");
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

function ChallengeRoute({ date, profile, update }: { date: string; profile: Profile; update(fn: (p: Profile) => Profile): void }) {
  const [pack, setPack] = useState<DayPack | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => { loadDay(date).then(setPack); }, [date]);
  if (!pack) return <p class="loading">Loading the questions…</p>;
  if (done) return <section><h1>Done for today</h1><p>Your rewards are in. Come back tomorrow at 08:00 for a new deck.</p><a class="primary" href="#/">Today</a></section>;
  const answered = Object.fromEntries(
    Object.entries(profile.answers).filter(([k]) => k.startsWith(date + ":")).map(([k, v]) => [k.slice(date.length + 1), v]),
  );
  return (
    <Challenge
      pack={pack}
      answered={answered}
      onAnswer={(id, correct) => update((p) => ({ ...p, answers: { ...p.answers, [`${date}:${id}`]: correct } }))}
      onFinish={(results) => { update((p) => finishChallenge(p, date, results)); setDone(true); }}
    />
  );
}

export function App() {
  const [dates, setDates] = useState<string[] | null>(null);
  const [schedule, setSchedule] = useState<ScheduledGame[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [profile, setProfile] = useState<Profile>(() => loadProfile(localStorage));
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const [, setTick] = useState(0);
  const route = useRoute();
  const [sheet, setSheet] = useState<{ outcomes: Outcome[]; markets: Market[] } | null>(null);
  const [giftOpen, setGiftOpen] = useState(false); // keeps the reveal mounted after the claim
  const [todayMarkets, setTodayMarkets] = useState<Market[]>([]);

  useEffect(() => { loadDates().then(setDates); loadCatalog().then(setCatalog); loadSchedule().then(setSchedule); }, []);
  const clock: Clock | null = useMemo(() => (dates ? createClock("replay", dates, localStorage) : null), [dates]);

  const update = useCallback((fn: (p: Profile) => Profile) => {
    setProfile((p) => { const next = applyAchievements(fn(p)); saveProfile(localStorage, next); return next; });
  }, []);

  const day = clock?.day();
  useEffect(() => { setGiftOpen(false); }, [day]); // a new replay day starts without the previous day's reveal
  useEffect(() => {
    if (!clock || !dates || !day) return;
    let live = true;
    (async () => {
      const earlier = await Promise.all(dates.filter((d) => d < day).map(loadMarkets));
      const today = await loadMarkets(day);
      if (!live) return;
      setTodayMarkets(today?.markets ?? []);
      const markets = earlier.flatMap((x) => x?.markets ?? []);
      const results = Object.assign({}, ...earlier.map((x) => x?.results ?? {}));
      // settle against the latest profile: the player may already have claimed today's deck
      const r = settleBets(profileRef.current, markets, results);
      if (r.outcomes.length > 0) {
        update((p) => settleBets(p, markets, results).profile);
        setSheet({ outcomes: r.outcomes, markets });
      }
    })();
    return () => { live = false; };
    // settle once per replay day
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, dates]);

  if (!dates || !catalog || !clock || !schedule) return <p class="loading">Loading The Spengler Cup…</p>;
  const common = { clock, dates, profile, update, catalog: catalog.cards };

  const step = nextOpeningStep(profile, clock.day(), dates, clock.now());
  const today = clock.day();
  let opening = null;
  if (giftOpen || step === "gift") {
    opening = (
      <GiftDeck
        key={today}
        date={today}
        collectionBefore={new Set(Object.keys(profile.collection))}
        onClaim={() => {
          const out = claimDoor(profile, today, catalog.cards, Math.random);
          update(() => out.profile);
          setGiftOpen(true);
          return out.pulled;
        }}
        onDone={() => setGiftOpen(false)}
      />
    );
  } else if (step === "welcome") {
    opening = <Welcome onContinue={() => update((p) => ({ ...p, seenWelcome: true }))} />;
  } else if (step === "recap") {
    const yesterday = dates[dates.indexOf(today) - 1];
    opening = (
      <Recap
        games={schedule.filter((g) => g.date === yesterday)}
        outcomes={sheet?.outcomes ?? []} markets={sheet?.markets ?? []} bets={profile.bets}
        onContinue={() => { update((p) => (p.seenRecaps.includes(today) ? p : { ...p, seenRecaps: [...p.seenRecaps, today] })); setSheet(null); }}
      />
    );
  }

  let screen;
  if (route.startsWith("#/challenge/")) screen = <ChallengeRoute date={route.slice("#/challenge/".length)} profile={profile} update={update} />;
  else if (route.startsWith("#/predict")) screen = <Predict markets={todayMarkets} now={clock.now()} profile={profile} update={update} />;
  else if (route.startsWith("#/cards")) screen = <Cards catalog={catalog} profile={profile} update={update} today={clock.day()} />;
  else if (route.startsWith("#/tasks")) screen = <Tasks date={clock.day()} now={clock.now()} profile={profile} update={update} />;
  else {
    const tasks = dailyTasks(clock.day());
    const tasksDone = tasks.filter((t) => profile.completedTasks.includes(t.id)).length;
    screen = <Today {...common} schedule={schedule} tasksDone={tasksDone} tasksTotal={tasks.length} />;
  }

  if (opening) {
    return (
      <>
        <ReplayBar clock={clock} onAdvance={() => setTick((n) => n + 1)} />
        <main>{opening}</main>
      </>
    );
  }

  return (
    <>
      <ReplayBar clock={clock} onAdvance={() => setTick((n) => n + 1)} />
      <main>
        {sheet && (
          <>
            <SettleSheet outcomes={sheet.outcomes} markets={sheet.markets} bets={profile.bets} />
            <button type="button" onClick={() => setSheet(null)}>Close</button>
          </>
        )}
        {screen}
      </main>
      <nav class="tabs">
        <a href="#/">Today</a><a href="#/cards">Cards</a>
        <a href={`#/challenge/${clock.day()}`}>Quiz</a><a href="#/predict">Predict</a>
      </nav>
    </>
  );
}
