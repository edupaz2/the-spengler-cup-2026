# Spengler Advent: Design (v2, preliminary phase)

Working title for our entry to the HC Davos / Spengler Cup data challenge. v1 written 2026-11-03, revised 2026-11-04 after the scope discussion and the preliminary-phase brief.

## Intent and why

HC Davos has 1.3M unique visits in five days, and results and stats are the most-visited pages, but visitors leave after a few seconds. A number in a table does not tell anyone why it mattered. Our job is to give them a reason to stay and a reason to come back the next day, using the real data (event data, aggregated stats, past editions).

**Core idea: make the user want to come back tomorrow.** Every feature is judged against that.

The jury asks: Would I come back tomorrow (engagement)? Did I learn why a performance mattered (educational value)? Have I seen this before (creativity)? Could Spengler Cup launch this (feasibility)? Does it work (technical quality)? Is the data the hero (use of data)? It must work for someone who has seen 1,000 games or zero.

## The preliminary phase

Due **2026-11-14**. Team: Eduardo Paz, Fabio García, Lucia Lavaselli. The submission is:

1. A project summary.
2. A deck: title, at most 7 content slides (problem and context, solution overview, how it works, demonstrator highlights, impact and next steps, team), end, optional appendix. PPT or PDF.
3. A **demo video of 3 minutes or less** (MOV or MP4). Over 3:00 is disqualified.
4. A **public code repository** that is accessible without permission and holds the prototype's source.
5. Optional: a hosted interactive prototype using real or representative challenge data, understandable for experts and newcomers, with a coherent core journey.

So the goal for now is a convincing **vertical slice**, not the full app.

## Product: four pillars

1. **Daily Challenges.** Five questions a day, one per category: **Hockey 101** (what's the call? icing, offside, penalties), **Hidden Hero** (rank three players shown only by box score), **Higher or Lower** (which team or player had more of something yesterday), **Guess the Player** (clues appear one at a time, fewer clues score more), **Tournament History**. Hockey 101 comes from a small written bank, Tournament History is generated from the year-by-year results with a few written extras, and Hidden Hero, Higher or Lower and Guess the Player are generated from the data. On the five days without event data, Higher or Lower uses team results, and the two player categories use a clearly labelled spotlight on the Final. Every answer ends in a "why it mattered" reveal.
2. **Predictions.** Players stake Pucks (play money only) on daily outcomes: game winner, best player of the day, best power play. The next day's results settle them. This is the strongest "come back tomorrow" hook.
3. **Cards.** Seven categories: **Players**, **Moments** (hat trick, comeback, shutout), **Goalies**, **Teams**, **Rules and concepts**, **Game of the Day** (obtainable only the morning after that game, since the card shows its result; the daily pack always holds it), and **Achievements** (earned by what you do, never found in a pack). Cards come from the daily pack, quizzes and by exchanging Pucks. They upgrade Normal, Silver, Gold, Diamond; each tier unlocks deeper explanation, and Diamond requires passing that card's challenge. **Set bonuses:** completing a set pays Pucks and a special pack. Sets are one per team (team card plus its players and goalies), the Rulebook (all rule cards), the Crease (all goalies), Every Game Day, and the Trophy Cabinet (all achievements).
4. **Social (version 2).** Connect with other users and exchange cards. Shown as a design slide only; card ownership is modelled so trading can be added later.

## Mobile

An **installable web app (PWA)**: home-screen icon, full-screen, works offline for the day's content, and a "remind me at 08:00" prompt. Real push notifications need a backend and are a next step. A native app is a launch-path option, not a prototype goal.

## Replay mode

The 2026 tournament has not happened, so Predictions cannot settle on real results. The app has a **tournament time machine**: it replays the 2025 edition day by day (six game days, 26 to 31 Dec, plus a recap day on 1 Jan that settles the Final's predictions), and the demo can advance a day. All app time goes through one clock so live and replay behave the same.

The data has two depths. Every game of 2025 has a real result (score by period, group tables) from the Event Report. Only the Final has event data (events with coordinates and xG) and a full box score. So game-winner predictions settle on real results on all six days, while best player and best power play exist only on the Final day. See `docs/data-notes.md`.

## Goals

- A daily loop playable end to end on real sample data: claim the door and a pack, place a prediction, play a challenge with its reveal, upgrade a card, see yesterday's predictions settle.
- Understandable by a newcomer in the first minute.
- Launchable by Spengler Cup: static site, precomputed data, no accounts, no real money.

## Non-goals and anti-goals

- Not a stats table, not a fantasy-league clone, not real-money gambling. Predictions use Pucks only and are labelled as play money.
- No accounts, no backend, no live trading in the prototype.
- No organizers' data files or documents in the public repository (see constraints).

## Constraints and open questions

- **Public repo:** the organizers' sample data and PDFs must not be published unless their terms allow it. Default: they stay out of git, the repo holds code plus a script that loads the data locally, and the app ships a small processed sample. To confirm.
- **Data size (read 2026-11-04):** event data and box scores cover one game, the 2025 Final (events with coordinates and xG, plus the full box score). The other ten games of 2025 have results only. Replay therefore has two data depths and the pipeline builds each day to the depth it has. Details in `docs/data-notes.md`.
- **Coordinates exist** (metres, plus all 12 skaters per event), and `ShotXG` comes with the data. Shot maps are possible; the Rookie question stays cut for time.
- **Goalies:** the stats file has no goalie rows. Goalie cards use the Final's box score and the shot rows (two goalies with real lines, two unused backups). Other teams' goalies are not in the data.
- **Images:** none needed. Cards are typographic. Logo, mascot and historic-player cards are deferred until the organizers supply assets. The 13.7 GB Final video is not used and never committed.
- **Past editions:** the organizers give only 2025. Earlier editions come from public sources: winner and runner-up per year, 1923 to 2025 (Wikipedia, CC BY-SA, cross-checked on spenglercup.ch). This drives Tournament History questions and the Team and Moment cards.
- **Content beyond the data** (Hockey 101 rules, rule cards) is written by the team into a question bank and a rules file.
- **Deadline time of day** on Nov 14 is unknown; we plan to submit by the morning.

## Decided by the user

Core idea (come back tomorrow), the four pillars and their descriptions, Social deferred to v2, mobile priority, Pucks buy packs and upgrades, EA FC Mobile as the reference for daily login, tasks and kickoff missions. Quiz categories: Hockey 101, Hidden Hero, Higher or Lower, Guess the Player, Tournament History. Card categories: Players, Moments, Goalies, Teams, Rules and concepts, Game of the Day, Achievements. Set bonuses are in.

## My calls (change freely)

- Predictions are Pucks-only, named "Predictions", with odds derived from team strength and a margin.
- PWA over native. TypeScript, Preact, Vite for the app; Python for the data pipeline; state in localStorage.
- Each day has exactly five questions, one per category. Guess the Player gives 5 clues and scores 100, 80, 60, 40, 20 by clues used.
- The daily pack holds 3 cards and always includes that day's Game of the Day card. A missed Game of the Day card is gone in the prototype.
- Set bonus rewards (Pucks and a special pack) and achievement list are placeholders to tune.
- Upgrade tier contents, 08:00 Europe/Zurich unlock, rarity cutoffs at 70, 90 and 98.
- Cards from the data: Player and Goalie cards from the Final; Team cards from the six 2025 teams (report facts plus all-time titles); Moment cards from goals and swings in the Final and from history (the 1923 start, the 1932 shared title, the 2018 shootout, the first NCAA team in 2025). Game of the Day exists for all six days; only the Final's has the full timeline and shot map.
- The best-power-play market exists only on the Final day, and the best-player market only where a box score exists; other days offer the winner market alone.
- Cut for the preliminary phase: Turning Point and Rookie questions, Kickoff chain, full Elo-style IQ, share grid, logo, mascot and historic-player cards.
