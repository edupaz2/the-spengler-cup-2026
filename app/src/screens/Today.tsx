import { useState } from "preact/hooks";
import { GamesCarousel } from "../components/GamesCarousel";
import { levelFor } from "../game/economy";
import type { ScheduledGame } from "../types";
import { requestReminder, browserNotifier } from "../pwa";
import type { ScreenProps } from "./props";

export function Today({ clock, dates, profile, update, schedule, tasksDone, tasksTotal }: ScreenProps & { schedule: ScheduledGame[]; tasksDone: number; tasksTotal: number }) {
  const today = clock.day();
  const [reminder, setReminder] = useState("");
  const quizDone = profile.completedTasks.includes(`${today}:challenge`);

  return (
    <section class="today">
      <header class="today-head">
        <h1>The Spengler Cup</h1>
        <div class="chips">
          <span class="chip">{profile.pucks} Pucks</span>
          <span class="chip">🔥 {profile.streak}</span>
          <span class="chip">Lv {levelFor(profile.xp)}</span>
        </div>
      </header>
      <GamesCarousel games={schedule} dates={dates} today={today} />
      <h2>Win Pucks and cards</h2>
      <div class="tiles">
        <a class="tile" href={`#/challenge/${today}`}><strong>Daily quiz</strong><small>{quizDone ? "Done" : "5 questions"}</small></a>
        <a class="tile" href="#/predict"><strong>Predict</strong><small>Back your picks</small></a>
        <a class="tile" href="#/tasks"><strong>Tasks</strong><small>{tasksDone} of {tasksTotal} done</small></a>
        <a class="tile" href="#/cards?tab=shop"><strong>Card shop</strong><small>Spend your Pucks</small></a>
      </div>
      <button type="button" onClick={async () => setReminder(await requestReminder(browserNotifier()))}>Remind me at 08:00</button>
      {reminder === "denied" && <p class="muted">Notifications are blocked. Open the app each morning at 08:00 instead.</p>}
      {reminder === "unsupported" && <p class="muted">This browser cannot show notifications.</p>}
    </section>
  );
}
