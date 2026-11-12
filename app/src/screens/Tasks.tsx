import { applySkip } from "../game/calendar";
import { dailyTasks, progress } from "../game/tasks";
import type { Profile } from "../state/profile";

export function Tasks({ date, now, profile, update }: { date: string; now: Date; profile: Profile; update(fn: (p: Profile) => Profile): void }) {
  return (
    <section class="tasks">
      <h1>Today's tasks</h1>
      <ul>
        {dailyTasks(date).map((t) => {
          const done = progress(profile, t);
          const claimed = profile.completedTasks.includes(t.id);
          return (
            <li key={t.id}>
              <span>{t.label}</span> <small>{Math.min(done, t.goal)} / {t.goal}</small>
              {claimed ? <em>Claimed</em> : (
                <button
                  type="button"
                  disabled={done < t.goal}
                  onClick={() => update((p) => p.completedTasks.includes(t.id) ? p : { ...p, pucks: p.pucks + t.reward, completedTasks: [...p.completedTasks, t.id] })}
                >
                  Claim {t.reward} Pucks
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => update((p) => applySkip(p, now))}>Use this week's free skip</button>
    </section>
  );
}
