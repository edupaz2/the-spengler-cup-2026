# The Spengler Cup

A hockey card game for the Spengler Cup: collect cards, play quizzes, make play-money predictions and learn hockey, built on the real data. Entry to the HC Davos / Spengler Cup data challenge (preliminary phase) by Eduardo Paz, Fabio García and Lucia Lavaselli.

**Idea:** make the user want to come back tomorrow, and teach them why a performance mattered while they are here.

## What the prototype does

- **Morning gift deck** (08:00 Europe/Zurich): a welcome, a deck you tear open, three cards revealed one by one, and a recap of yesterday's scores. It gives a free pack, a streak and XP.
- **Today:** a games carousel (swipe through the tournament's games) and tiles for the quiz, predictions and tasks.
- **Daily Challenges:** five questions, one per category: Hockey 101, Hidden Hero, Higher or Lower, Guess the Player, Tournament History. Every answer ends in a "why it mattered" reveal.
- **Predictions:** stake Pucks (play money only) on game winners; the next morning's results settle them. On the Final: best player and best power play.
- **Cards:** image cards for players, goalies, teams, moments, rules, Game of the Day and achievements, in an Album, Sets and a Shop. Tap a card to flip it; tiers Normal, Silver, Gold, Diamond; set bonuses.
- **Replay mode:** the 2026 tournament has not happened, so the app replays the 2025 edition day by day (26 Dec to 1 Jan). The "Advance day" bar moves time forward.

It is an installable web app (PWA) with no accounts and no backend. State lives in the browser.

## Data

| Layer | Source |
|---|---|
| 2025 Final event data (with coordinates and expected goals) and box score | organizers' sample data pack (not in this repo) |
| 2025 results of all 11 games | organizers' Event Report 2025 (typed into `content/edition2025.yaml`) |
| Winners 1923 to 2025 | Wikipedia (CC BY-SA 4.0), `content/history/editions.csv`; to be cross-checked on spenglercup.ch |
| Hockey 101 questions and rule cards | written by the team (`content/`) |

**The confidential Spengler Cup dataset is not in this repository.** The hosted demo shows real card names and images with dataset statistics hidden ("Full stats are in the private build.") and made-up quiz and prediction data.

Raw files and everything derived from the dataset (the generated JSON, shot maps, box-score figures) stay private and local; the card images are public and are in the repository. The repo holds code plus a script that loads the data locally. `.gitignore` excludes the organizers' files and the JSON generated from them (`app/public/data/`), and `scripts/check_public.sh` fails if any is tracked. Tests use small synthetic fixtures. To get the real data you must have the organizers' files yourself:

```bash
mkdir raw   # put the match-event and statistics CSVs here (git ignores it)
bash scripts/build_data.sh            # builds app/public/data from ./raw
bash scripts/build_data.sh --demo     # or: synthetic demo data, no organizer files needed
```

See `docs/data-notes.md` for what the data holds and how we read it.

## Run it

Needs Python 3.11+ and Node 20+.

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/pytest                      # pipeline tests
bash scripts/build_data.sh --demo     # data for the app (see Data)
npm install --prefix app
npm test --prefix app                 # app tests, including an end-to-end smoke test of the core journey
npm run dev --prefix app              # http://localhost:5173
npm run build --prefix app            # static site in app/dist (card images add to this)
bash scripts/check_public.sh          # fails if organizer data is tracked
```

The app needs `app/public/data`, so run `scripts/build_data.sh` (or `--demo`) once before `npm run dev`.

## Hosted prototype

A GitHub Actions workflow (`.github/workflows/pages.yml`) builds the app and publishes it to GitHub Pages on every push to `main`. The hosted site is a demo build (`--demo`): real card names and images, dataset statistics hidden, synthetic quiz and prediction data, because the organizers' data is not in the repository. One-time setup: repository Settings, Pages, Source: GitHub Actions.

## Layout

- `pipeline/` Python: loaders, analytics (win probability, xG, box scores), question generation, cards, markets.
- `content/` written content and typed tables. `schema/` JSON schemas for the generated files.
- `app/` TypeScript, Preact, Vite. Pure game logic in `app/src/game/`, screens in `app/src/screens/`.
- `docs/` design, plan, data notes and the submission pack.

## Credits and licence

Tournament history from Wikipedia, licensed CC BY-SA 4.0. Spengler Cup and HC Davos names belong to their owners. Licence for our code: to be chosen before the repository goes public.
