# Data notes

First pass written 2026-11-04 from the organizers' sample pack, the full-match CSVs, the 2025 Event Report PDF and public sources. Task 1 verifies and extends it. Nothing here is a copy of organizer files: only facts and our reading of them. The confidential Spengler Cup dataset is not in this repository; the hosted demo shows real card names and images with dataset statistics hidden.

## What we have

The confidential Spengler Cup dataset is not in this repository: raw files and everything derived from the dataset stay private. The card images are public. This file describes what the data holds and how we read it, without reproducing figures from it.

| Source | What it holds | Use |
|---|---|---|
| Full-match event CSV | Every event of one game, the 2025 Final, with coordinates, speeds and expected goals | Game of the Day detail, Hidden Hero, goalie lines, shot maps, win-probability timeline |
| Match statistics CSVs (All, P1, P2, P3) | Per-skater statistics for both teams, in many columns | Box scores, Higher or Lower, Guess the Player clues, rarity percentiles |
| Sample xlsx files | The same game, trimmed | Reference only; the pipeline reads the CSVs |
| Event Report 2025 (PDF) | All 11 games: scores by period, group tables, awards, Final box score with goalies | The 2025 tournament schedule (results level) |
| Public history (Wikipedia, to confirm on spenglercup.ch) | Winner and runner-up per year, 1923 to 2025 | Tournament History questions, Team and Moment cards |
| Final video | Ignored | Not used; never committed |

## The game with full data

HC Davos 6:3 U.S. Collegiate Selects, 31 Dec 2025, Game 11 (12:10 start), periods 1:2, 2:1, 0:3 from the Collegiate side.

- **Home is the U.S. Collegiate Selects, Away is HC Davos** in the event data (Tambellini, Davos, is tagged Away; the Collegiate goalie Gajan is Home).
- Goals by Davos: Tambellini 2, Zadina, Stransky (power play), Corvi, Asplund. By the Collegiate Selects: Fink, Musa, Walsh.
- Goalies: Gajan and Aeschlimann played; Tracy and Hollenstein did not. One Davos goal came on an empty net.
- Coaches Guy Gadowsky (Collegiate Selects) and Josh Holden (Davos). Referees Mikko Kaukokari and Joonas Kova.

## Event data

- Events are typed (puck control, pass, shot, goal, faceoff, stoppage, penalty and others). Shot results are saved, missed, blocked or goal. `ShotXG` comes with the data, so we do not need our own xG model except as a fallback: it is blank on some goals and `ShotSpeed` is 0 on some shots. Treat both as missing.
- **Coordinates exist**: shots and events carry x,y in metres, and every event lists position, speed and direction for all skaters on the ice. This allows shot maps.
- **Goalies** appear as the secondary player on shot rows (per the glossary), plus `HomeGoalieOnIce` and `AwayGoalieOnIce`. The stats file has no goalie rows.
- Players are identified as `#19 Adam Tambellini` plus a numeric id; the stats file uses team, jersey, last and first name. Join on team and jersey.
- The event glossary is inferred by the organizers, not official; flag anything that looks off.

## The 2025 tournament (from the Event Report)

Dates for games 1 to 6 are not in the pages we read; the group stage ran on the three days before 29 Dec, two games a day (inferred, confirm in Task 1b).

| Game | Date | Result (by period) |
|---|---|---|
| 1 | 26 Dec (inferred) | Fribourg-Gottéron 5:2 HC Sparta Praha (1:0, 1:0, 3:2) |
| 2 | 26 Dec (inferred) | Team Canada 3:2 U.S. Collegiate Selects (0:0, 3:1, 0:1) |
| 3 | 27 Dec (inferred) | IFK Helsinki 1:4 HC Sparta Praha (0:1, 1:2, 0:1) |
| 4 | 27 Dec (inferred) | HC Davos 3:5 U.S. Collegiate Selects (0:1, 2:2, 1:2) |
| 5 | 28 Dec (inferred) | Fribourg-Gottéron 4:3 IFK Helsinki (1:2, 2:0, 1:1) |
| 6 | 28 Dec (inferred) | Team Canada 1:4 HC Davos (0:1, 1:0, 0:3) |
| 7 | 29 Dec | HC Sparta Praha 5:1 Team Canada (0:0, 0:0, 5:1), semi-final qualification |
| 8 | 29 Dec | HC Davos 3:0 IFK Helsinki (1:0, 1:0, 1:0), semi-final qualification |
| 9 | 30 Dec | U.S. Collegiate Selects 5:3 HC Sparta Praha (2:1, 2:1, 1:1), semi-final |
| 10 | 30 Dec | Fribourg-Gottéron 1:3 HC Davos (0:0, 1:2, 0:1), semi-final |
| 11 | 31 Dec | U.S. Collegiate Selects 3:6 HC Davos (1:2, 2:1, 0:3), Final |

Group tables: Fribourg 6 points (9:5), Sparta 3 (6:6), Helsinki 0 (4:8); the other group ended in a three-way tie on 3 points: U.S. Collegiate Selects (7:6), Davos (7:6), Team Canada (4:6), ranked by goal difference. The group names (Cattini, Torriani) are not matched to the groups yet.

Team facts printed in the report: Fribourg-Gottéron, semi-finalist in the 2024/25 Swiss league, 4th participation, defending champion. Team Canada, 16 titles, 40th participation. HC Davos, 31 Swiss titles, 16 Spengler titles before this edition (17 after). U.S. Collegiate Selects, the first NCAA selection team. IFK Helsinki, 7 national titles, 5th participation, last in 2022. HC Sparta Praha, 8 national titles, 2 Spengler titles, 11th participation, last in 2022.

Awards pages hold key players (page 12 lists Biasca, Chlapík, Grant, McCartthy, Schneller, Irving, Jung, Dimarsico, Sörensen, Hovinen across five games) and Three Stars graphics per team (the IFK Helsinki page shows Larsen, Alnefelt, Palmu). These have names and jersey numbers but no stats.

## History (public sources)

Winner and runner-up per year from 1923 to 2025. Titles: HC Davos 17, Team Canada 16, LTC Prague 7, Dukla Jihlava 5, Spartak Moscow 5, then smaller counts. Not held in 1939, 1949, 1956, 2020; 2021 cancelled; 1940 is unlisted. Notable facts: 1923 was the first edition (Oxford University won), 1932 was a shared title after a 0:0 final, Team Canada joined in 1984, games moved indoors after 1978, the 2018 final went to a shootout (KalPa won), and 2025 brought the first NCAA selection team. Final scores exist only for 2018 and 2025 in the source we used.

Wikipedia text is CC BY-SA: credit it in the README, and cross-check names and counts against spenglercup.ch before the deadline.

## Decisions this forces

1. **Replay has seven days and two depths.** Days 1 to 6 (26 to 31 Dec) are game days with results only; the Final's events arrive as "yesterday" on day 7 (1 Jan), a recap day with no games that settles the Final's predictions. Predictions on winners work every day from real scores; best player and best power play need events, so they exist only on the Final.
2. **Player questions rely on the Final.** Hidden Hero and Guess the Player need box scores, which exist only for the Final's skaters and goalies. Earlier days use "classic final" spotlights labelled as such, or the key players with name, team and number. Decide in Task 5.
3. **Goalie cards are few:** Gajan and Aeschlimann with real lines (private build), Tracy and Hollenstein as unused backups. Other teams' goalies are not in the data.
4. **Tournament History is data-driven**, generated from the year-by-year table instead of only hand-written.
5. **Raw files and derived JSON stay private (decided by the team, 2026-11-10).** The public repo holds code plus a script that loads the organizers' data locally (`scripts/build_data.sh`); no CSVs, PDFs, report images or JSON generated from them are tracked. A `--demo` build uses synthetic fixtures. `content/edition2025.yaml` (scores typed from the Event Report) is still tracked; revisit if the organizers' terms cover it.

## Open questions

- Data terms for the CSVs and the report: can processed derivatives be published? Until the organizers say so, they stay private.
- Dates and groups for games 1 to 6, and the rest of the key-player and Three Stars pages: read the report pages in Task 1b.
- Resolved in Task 1: the empty-net goal is #44 Matej Stransky (Davos) in period 3, the only shot row with no goalie.
- Open: one goalie's shot count in the events differs by one from the report; Task 3 tolerates it and Task 1b should check the report page again.
- Normalised coordinates: after rotating each team's events to attack toward +x, shots land at positive x except the empty-net goal.
