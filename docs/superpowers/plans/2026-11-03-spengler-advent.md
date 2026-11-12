# Spengler Advent Implementation Plan (v2, preliminary phase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** By 2026-11-14, ship a mobile web prototype of the daily loop (challenges, predictions, cards) on real sample data, plus the slides, 3-minute video and public repository the preliminary phase requires.

**Architecture:** A Python pipeline turns the organizers' data (the full 2025 Final events and box score, the 2025 results from the Event Report), a public year-by-year history table and a hand-written question bank into static JSON (day packs, markets with results, card catalog). A TypeScript/Preact PWA reads that JSON, keeps player state in localStorage, and runs every rule (economy, predictions, scoring, calendar) as pure, unit-tested modules driven by one replayable clock.

**Tech Stack:** Python 3.11 + pandas + openpyxl + pytest; TypeScript + Preact + Vite + vite-plugin-pwa + Vitest + jsdom; Playwright (one smoke test).

**Spec:** `docs/superpowers/specs/2026-11-03-spengler-advent-design.md`

## Global Constraints

- Deadline `2026-11-14`. Feature freeze end of `2026-11-11`.
- Video: MOV or MP4, at most 3:00 (target 2:45). Over 3:00 is disqualified.
- Deck: title, at most 7 content slides (Problem and Context, Solution Overview, How It Works, Demonstrator Highlights, Impact and Next Steps, Team), end, optional appendix. PPT or PDF.
- Public repository: no organizer data files, PDFs, report images, screenshots or the Final video tracked in git. Code, the processed JSON (aggregates and derived lists, never raw event rows) and a README that explains how to load the data and credits Wikipedia (CC BY-SA) for the history table.
- Replay uses the 2025 edition: six game days, 26 to 31 Dec 2025, plus a recap day on 2026-01-01. Game days have results only (`depth: "results"`; their player questions are a labelled Final spotlight); the recap day has no games and uses the Final's events and box score as yesterday's data (`depth: "events"`), and settles the Final's predictions. Every pipeline stage must build a valid day at either depth.
- Data findings live in `docs/data-notes.md`; it is the reference for column names and the home/away mapping (Home is the U.S. Collegiate Selects, Away is HC Davos).
- Predictions use Pucks only; no real money anywhere; the UI labels them play money.
- Each day has exactly 5 questions, one per category: `rules` (Hockey 101), `hidden_hero`, `higher_lower`, `guess_player`, `history`.
- Cards have seven categories: `player`, `moment`, `goalie`, `team`, `rule`, `gotd` (Game of the Day), `achievement`. `gotd` cards are available only the morning after their game (`availableOn` = game date + 1); `achievement` cards are never in a pack.
- Set bonuses: completing a set pays Pucks and a special pack, once.
- Card upgrade tiers in order: `normal`, `silver`, `gold`, `diamond`. Diamond also requires passing that card's challenge.
- Rarity from data percentile: `common` below 70, `rare` 70 to 89, `epic` 90 to 97, `legendary` 98 and above.
- All app time comes from `clock.now()`; nothing else reads `Date.now()` or `new Date()`.
- Mobile first: usable at 375px width, installable PWA.
- All economy and odds numbers live in `app/src/game/economy.config.ts` and nowhere else.

## Review Focus

- Replay mode past the last day must stop gracefully, and a prediction for a game must not settle before its replay day.
- Placing a prediction with too few Pucks, after lock time, or twice on one market must be rejected; settling twice must pay once.
- A day with results but no events (days 1 to 5) must still produce five questions, a winner market and a Game of the Day card; no day may reference a player stat from a game that has not been replayed yet, except in a card or question labelled as the classic Final spotlight.
- A day with no games shows a recap instead of markets.
- Claiming a set bonus twice must pay once, and an achievement must award its card once.
- Reloading mid-challenge, or corrupted localStorage, must not lose progress, double-award, or throw.

## Schedule (Nov 4 to Nov 14)

| Days | Goal |
|---|---|
| Wed 4 to Thu 5 | Tasks 1 and 1b (loaders; transcribe the 2025 results and the history table; the data first pass is already in `docs/data-notes.md`), Task 8 scaffold and design tokens, sample JSON committed so the UI can start |
| Fri 6 to Mon 9 | Data tasks 2 to 7, logic tasks 9 to 12 in parallel; UI tasks begin against the sample JSON |
| Mon 9 to Wed 11 | UI tasks 13 to 16, integration, replay mode wiring. **Feature freeze end of Wed 11.** |
| Thu 12 | Record the video, draft slides |
| Fri 13 | Task 17: repo cleanup, hosting, final slides, dry run |
| Sat 14 | Submit in the morning; buffer only |

## Proposed split (swap freely)

| Person | Streams |
|---|---|
| Eduardo | Game logic (8 to 12), integration, submission summary |
| Fabio | UI (13 to 16), PWA |
| Lucia | Data and content (1 to 7), question bank, slides |

All three review the video script and the slides.

---

### Task 1: Data adapter

**Files:**
- Create: `pipeline/schema.py`, `pipeline/load_events.py`, `pipeline/load_stats.py`, `pipeline/tests/test_load_events.py`, `pipeline/tests/fixtures/sample_events.csv`; Modify: `docs/data-notes.md`

**Interfaces:**
- Produces: `Event` dataclass: `game_id: str`, `event_id: str`, `clock_s: int`, `period: int`, `team: str` (`"Home"` or `"Away"`), `player_id: str | None`, `player_name: str | None`, `goalie_name: str | None` (the secondary player on shots), `kind: Literal["shot","goal","pass","entry","dump","clear","faceoff","penalty","stoppage","control","other"]`, `result: str | None` (shot result: `saved`, `missed`, `blocked`, `goal`), `xg: float | None`, `strength: str` (for example `"5v5"`), `x: float | None`, `y: float | None` (metres, centre ice origin, attacking toward +x).
- Produces: `load_events(path: Path) -> list[Event]` reading the full-match CSV (`*Match_Events*.csv`, 114 columns); `load_player_stats(path: Path) -> list[PlayerLine]` reading `*Match_Statistics*All.csv` (`PlayerLine` has team, jersey, last name, first name, and the stat columns by their header); `SIDES = {"Home": "U.S. Collegiate Selects", "Away": "HC Davos"}`.

- [ ] **Step 1:** Verify `docs/data-notes.md` against the CSVs and extend it: confirm the home/away mapping, find the empty-net goal, check that every shot row names a goalie, and record the data terms once known. The first pass is already written; this step adds only what it flags as open.
- [ ] **Step 2: Write the failing tests:** `test_maps_raw_kinds_to_canonical` (BluelineCrossing becomes `entry`, PuckControl `control`), `test_normalises_attack_direction`, `test_missing_coordinates_are_none`, `test_blank_xg_is_none_and_zero_speed_is_missing`, `test_unknown_kind_becomes_other`, `test_shot_rows_carry_goalie_name`, `test_player_stats_join_on_team_and_jersey`.
- [ ] **Step 3:** Run `pytest pipeline/tests/test_load_events.py -v`. Expected: FAIL.
- [ ] **Step 4:** Implement both loaders with pandas; the raw-to-canonical kind map is a dict at the top of the file. Tests use a synthetic 30-row fixture with invented players and the real column layout, so no organizer rows are committed.
- [ ] **Step 5:** Run the tests. Expected: PASS. Commit `feat(pipeline): load match data`.

### Task 1b: Past editions dataset

**Files:**
- Create: `content/history/editions.csv`, `content/edition2025.yaml`, `pipeline/editions.py`, `pipeline/tests/test_editions.py`

**Interfaces:**
- Produces: `EditionRow { year: int, winner: str | None, runner_up: str | None, note: str | None }` (`note` for shared, not held, cancelled or final-score facts) and `load_history(path: Path) -> list[EditionRow]`; `titles(rows: list[EditionRow]) -> dict[str, int]` (a shared title counts for each winner); `Game2025 { id: int, date: str, home: str, away: str, score: [int, int], periods: [[int, int]] (3), stage: "group"|"qualification"|"semi"|"final" }` and `load_edition2025(path: Path) -> list[Game2025]`; `standings(games: list[Game2025], group: str) -> list[...]` (points, goals for and against, ranked by points then goal difference).
- `editions.csv` is typed from the public year-by-year table (1923 to 2025) and cross-checked against spenglercup.ch. `edition2025.yaml` is typed from the Event Report pages 7 to 9 (the 11 games in `docs/data-notes.md`), plus the six team fact lines from page 6 and the awards names from pages 11 to 14.

- [ ] **Step 1: Write the failing tests:** `test_history_covers_1923_to_2025`, `test_shared_1932_title_counts_for_both`, `test_titles_total_matches_known_counts` (Davos 17, Canada 16, LTC Prague 7), `test_unplayed_years_have_no_winner` (1939, 1949, 1956, 2020, 2021), `test_2025_has_eleven_games`, `test_period_scores_sum_to_final_score`, `test_group_tables_match_report` (Fribourg 6 points 9:5; the other group tied on 3 points ranked by goal difference).
- [ ] **Step 2:** Run `pytest pipeline/tests/test_editions.py -v`. Expected: FAIL.
- [ ] **Step 3:** Type the two data files, then implement the loaders. Read the report pages again for dates of games 1 to 6 and for the group names, and fix `docs/data-notes.md` where our inference was wrong.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(content): past editions`.

### Task 2: Win probability and turning point

**Files:** Create `pipeline/analytics/winprob.py`, `pipeline/tests/test_winprob.py`

Used by Moment cards and Game of the Day cards. No quiz depends on it.

**Interfaces:**
- Consumes: `Event`.
- Produces: `win_probability(goal_diff: int, seconds_remaining: int) -> float`; `TurningPoint(clock_s: int, delta: float, goal_event_id: str, team: str)`; `turning_point(events: list[Event]) -> TurningPoint | None`; `timeline(events: list[Event], home: str) -> list[tuple[int, float]]`.

- [ ] **Step 1: Write the failing tests:** `test_tied_start_is_half`, `test_one_goal_lead_late_is_above_point_nine`, `test_clock_zero_decides`, `test_turning_point_is_largest_swing`, `test_no_goals_returns_none`, `test_single_goal_returns_none`.
- [ ] **Step 2:** Run `pytest pipeline/tests/test_winprob.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement `win_probability` as Φ(goal_diff / sqrt(6.0 * seconds_remaining / 3600)) with the 6.0 constant defined once.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(pipeline): win probability`.

### Task 3: Shot quality and player impact

**Files:** Create `pipeline/analytics/xg.py`, `pipeline/tests/test_xg.py`

**Interfaces:**
- Produces: `shot_xg(e: Event) -> float` (the data's `xg` when present, else `fallback_xg`); `fallback_xg(x: float, y: float) -> float`; `player_impact(game_events: list[Event], player_name: str) -> float`; `box_score(game_events: list[Event], player_name: str) -> dict[str, int]` with keys `goals`, `assists`, `shots`; `goalie_line(game_events: list[Event], goalie_name: str) -> dict[str, int]` with keys `saves`, `shots_against`, `goals_against` (from shot rows that name the goalie). The data already carries `ShotXG`, so the fallback is only for rows where it is blank.

- [ ] **Step 1: Write the failing tests:** `test_blank_xg_uses_fallback`, `test_fallback_slot_shot_beats_point_shot`, `test_xg_within_unit_interval`, `test_player_without_events_has_zero_impact`, `test_pass_before_shot_credits_passer`, `test_box_score_counts`, `test_goalie_line_counts`, `test_goalie_line_matches_report` (Gajan 26 saves on 31 shots, Aeschlimann 19 on 22; run against the real CSV locally, skipped in public CI).
- [ ] **Step 2:** Run `pytest pipeline/tests/test_xg.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement `fallback_xg` as a logistic function of distance and angle with constants in a module dict; impact is shooter xG plus xG of shots within 5 s after the player's pass.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(pipeline): shot quality and impact`.

### Task 4: Question bank and daily picks

**Files:**
- Create: `content/questions/rules.yaml`, `content/questions/history.yaml`, `pipeline/bank.py`, `pipeline/tests/test_bank.py`

**Interfaces:**
- Produces: `BankQuestion { id: str, category: "rules"|"history", prompt: str, options: list[str] (4), answerIndex: int, why: str, difficulty: 1|2|3, source: str }`; `load_bank(dir: Path) -> list[BankQuestion]` (raises `BankError` listing every invalid entry); `pick_daily(date: str, bank: list[BankQuestion], per_category: int = 1) -> list[BankQuestion]` (deterministic for a date).
- `rules` questions (Hockey 101) are scenarios with a ruling ("a player shoots the puck the length of the ice from behind centre; what is the call?") and need no data. `history` questions are generated from `content/history/editions.csv` and `content/edition2025.yaml` (templates such as "Who won in 1984?", "Which team has the most titles?", "Which year had a shared title?", "Which of these years was not held?") plus a few written extras, each with a `source`. `BankQuestion` gains an optional `template: str` so generated and written questions share one schema; `load_bank` expands the templates, with the distractors drawn from other years' winners.

- [ ] **Step 1: Write the failing tests:** `test_missing_why_is_an_error`, `test_answer_index_out_of_range_is_an_error`, `test_duplicate_ids_rejected`, `test_each_category_has_at_least_eight`, `test_pick_daily_is_deterministic`, `test_pick_daily_one_per_category`.
- [ ] **Step 2:** Run `pytest pipeline/tests/test_bank.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement `load_bank` and `pick_daily` (seed a `random.Random` from the date string). Write at least 8 questions per category.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(content): question bank`.

### Task 5: Day packs

**Files:** Create `schema/day.schema.json`, `pipeline/questions.py`, `pipeline/build_days.py`, `pipeline/tests/test_questions.py`, `app/public/data/days/sample.json`

**Interfaces:**
- Produces: `DayPack { date: string, games: string[], questions: Question[] }` (exactly 5 questions, one per category) where `Question` is one of:
  - `BankQuestion` with `kind: "bank"` (categories `rules` and `history`);
  - `HiddenHeroQuestion { id, kind: "hidden_hero", classic?: boolean, difficulty, players: {alias, box}[3], answerIndex, why, reveal: {alias, name, impact}[3] }`;
  - `HigherLowerQuestion { id, kind: "higher_lower", difficulty, metric: "shots"|"saves"|"goals"|"penalty_minutes"|"team_goals"|"standings_points", classic?: boolean, a: {label: string, value: number}, b: {label: string, value: number}, answer: "a"|"b", why }`;
  - `GuessPlayerQuestion { id, kind: "guess_player", classic?: boolean, difficulty, clues: string[] (5, ordered from vague to specific), options: string[] (4 names), answerIndex, why }`.
- Produces: `build_day(day: Game2025 list, events: list[Event] | None, stats: list[PlayerLine] | None, bank: list[BankQuestion]) -> DayPack`, with `DayPack.depth: "results"|"events"`. At `results` depth: Higher or Lower compares team numbers (goals, period goals, standings points) from the day's games and earlier days; Hidden Hero and Guess the Player use the Final spotlight, flagged `classic: true` and labelled in the UI; Hockey 101 and History come from the bank. At `events` depth all three data categories use the Final's real box scores and clues.

- [ ] **Step 1: Write the failing tests:** `test_pack_validates_against_schema`, `test_pack_has_one_question_per_category`, `test_hidden_hero_excludes_players_without_events`, `test_hidden_hero_answer_has_highest_impact`, `test_higher_lower_never_has_equal_values`, `test_guess_player_clues_never_contain_the_name`, `test_day_without_games_has_only_bank_questions`, `test_pack_is_deterministic`, `test_results_depth_day_still_has_five_questions`, `test_results_depth_player_questions_are_flagged_classic`, `test_results_depth_higher_lower_uses_only_played_games`.
- [ ] **Step 2:** Run `pytest pipeline/tests/test_questions.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement; `why` strings come from a `TEMPLATES` dict filled with the real numbers. Commit a `sample.json` by the end of Thu 5 so the UI team can start.
- [ ] **Step 4:** Run the tests. Expected: PASS. Run `python -m pipeline.build_days --out app/public/data/days/`. Commit `feat(pipeline): day packs`.

### Task 6: Card catalog

**Files:** Create `schema/card.schema.json`, `pipeline/cards.py`, `content/rules.yaml`, `content/achievements.yaml`, `pipeline/tests/test_cards.py`, `app/public/data/cards.json`

**Interfaces:**
- Produces: `Card { id, category: "player"|"moment"|"goalie"|"team"|"rule"|"gotd"|"achievement", title, team: string | null, availableOn: string | null, unlock: string | null, rarity: "common"|"rare"|"epic"|"legendary", front: string[], back: { normal: string, silver: string, gold: { text: string, visual: "timeline"|"shotmap"|"table", data: object }, diamond: { question: string, options: string[], answerIndex: number } } }`; `rarity_for(percentile: float) -> str`; `build_catalog(events, stats, rules, achievements) -> list[Card]`.
- Produces: `SetBonus { id: string, label: string, cardIds: string[], reward: { pucks: number, packId?: string } }` and `build_sets(catalog: list[Card]) -> list[SetBonus]`: one set per team (its team card plus its player and goalie cards), the Rulebook (all `rule` cards), the Crease (all `goalie` cards), Every Game Day (all `gotd` cards) and the Trophy Cabinet (all `achievement` cards).
- A `gotd` card has `availableOn` set to the day after its game, so its result is known. An `achievement` card has `unlock` set to an achievement id and appears in no pack. Target about 40 cards. All cards are typographic.
- Sources: Player cards from the Final's skaters (top by percentile) plus the named key players from the report (name, team and number only); Goalie cards for Gajan and Aeschlimann from the box score and shot rows; Team cards for the six 2025 teams (report fact line plus all-time titles and finals from `editions.csv`); Moment cards from the Final's goals and biggest swings and from history (1923, the 1932 shared title, the 2018 shootout, the first NCAA team in 2025); one `gotd` card per game day, with period scores always and the timeline and shot map (`gold.visual` `"timeline"` or `"shotmap"`) only on the Final, `"table"` elsewhere. Team sets for teams with only key-player data have two or three cards.

- [ ] **Step 1: Write the failing tests:** `test_rarity_cutoffs` (69.9 common, 70 rare, 90 epic, 98 legendary), `test_catalog_validates_against_schema`, `test_every_card_has_four_backs`, `test_catalog_ids_unique`, `test_all_categories_present`, `test_one_gotd_card_per_game_day`, `test_achievement_cards_have_unlock_and_no_date`, `test_sets_reference_existing_cards`.
- [ ] **Step 2:** Run `pytest pipeline/tests/test_cards.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement. Player, goalie and moment cards come from the data, team cards from stats, rule and achievement cards from the YAML files, and one `gotd` card per game day from that day's most decisive game.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(pipeline): card catalog`.

### Task 7: Markets and results

**Files:** Create `schema/markets.schema.json`, `pipeline/markets.py`, `pipeline/tests/test_markets.py`, `app/public/data/markets/sample.json`

**Interfaces:**
- Produces: `Market { id: str, kind: "winner"|"star"|"powerplay", date: str, gameId: str, lockAt: str (ISO, game start), options: {id: str, label: str, odds: float}[] }`; `build_markets(date: str, events: list[Event], stats: dict) -> list[Market]`; `build_results(date: str, events: list[Event]) -> dict[str, str]` (market id to winning option id); `odds_from_strength(a: float, b: float, margin: float = 0.10) -> tuple[float, float]`.
- The `winner` market exists for every game day and settles on the real 2025 score. `star` and `powerplay` markets exist only at `events` depth (the Final): `star` options are the game's three highest-impact players, `powerplay` options are the two teams, decided by power-play goals per power-play chance (Davos 2 from 4, Collegiate Selects 0 from 1). A results-depth day with two games has two winner markets and no others.
- `build_markets` takes the day's `Game2025` list; `lockAt` is the game start time from the report (for example 12:10 for the Final).

- [ ] **Step 1: Write the failing tests:** `test_odds_reflect_strength_gap`, `test_odds_include_margin` (implied probabilities sum to more than 1), `test_odds_floor_is_1_1`, `test_results_cover_every_market`, `test_no_games_gives_no_markets`.
- [ ] **Step 2:** Run `pytest pipeline/tests/test_markets.py -v`. Expected: FAIL.
- [ ] **Step 3:** Implement using team strength from the aggregated stats (goal difference per game).
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(pipeline): markets and results`.

### Task 8: App scaffold, profile and clock

**Files:** Create `app/` (Vite, Preact, TypeScript, Vitest, jsdom), `app/src/types.ts`, `app/src/state/profile.ts`, `app/src/game/clock.ts`, `app/src/styles/tokens.css`, `app/src/state/profile.test.ts`, `app/src/game/clock.test.ts`

**Interfaces:**
- Produces: `Tier = "normal"|"silver"|"gold"|"diamond"`; `Bet { marketId: string, optionId: string, stake: number }`; `Profile { pucks: number, xp: number, streak: number, skipsUsedWeek: string | null, claimedDoors: string[], collection: Record<string, { tier: Tier, copies: number }>, answers: Record<string, boolean>, bets: Bet[], settled: string[], completedTasks: string[], openedRequests: string[], claimedSets: string[], achievements: string[], version: 1 }`; `newProfile(): Profile`; `loadProfile(s: Pick<Storage,"getItem">): Profile`; `saveProfile(s: Pick<Storage,"setItem">, p: Profile): void`.
- Produces: `Clock { now(): Date; day(): string; advanceDay(): void; isFinished(): boolean; mode: "live"|"replay" }`; `createClock(mode: "live"|"replay", dates: string[], storage: Pick<Storage,"getItem"|"setItem">, serverNow?: () => Date): Clock`. In replay, `now()` returns 08:00 Europe/Zurich on the current replay date.
- `types.ts` exports `DayPack`, `Question`, `Card`, `Market` mirroring the schemas.

- [ ] **Step 1: Write the failing tests:** `corrupted_json_gives_new_profile`, `throwing_storage_is_tolerated`, `wrong_version_gives_new_profile`, `profile_round_trip`, `replay_starts_on_first_date`, `advance_past_last_day_stays_and_is_finished`, `replay_position_survives_reload`, `live_mode_uses_server_time`.
- [ ] **Step 2:** Run `npm test --prefix app`. Expected: FAIL.
- [ ] **Step 3:** Implement. `tokens.css` holds colours and type scale; hockey blue and gold, light and dark themes.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): scaffold, profile and clock`.

### Task 9: Economy

**Files:** Create `app/src/game/economy.config.ts`, `economy.ts`, `economy.test.ts`

**Interfaces:**
- Consumes: `Profile`, `Card`, `Tier`.
- Produces: config `PACKS: Record<string, { price: number, size: number }>` (`daily` costs 0), `UPGRADE_COST`, `DUPLICATE_PUCKS`, `PITY_EVERY`, `LEVEL_XP`, `START_PUCKS`; `openPack(p: Profile, packId: string, catalog: Card[], rng: () => number, requestId: string, today: string): { profile: Profile, pulled: Card[] }` (idempotent on `requestId`; the pool excludes `achievement` cards and any `gotd` card whose `availableOn` is not `today`; the `daily` pack always includes `today`'s `gotd` card as one of its cards); `upgradeCard(p, cardId, challengePassed): { ok: true, profile } | { ok: false, reason: "pucks"|"max"|"challenge"|"not-owned" }`; `levelFor(xp: number): number`.

- [ ] **Step 1: Write the failing tests:** `pack_deducts_price_and_adds_cards`, `duplicate_converts_to_pucks_by_rarity`, `pity_guarantees_rare_every_n_packs`, `same_request_id_does_not_double_spend`, `insufficient_pucks_rejected`, `upgrade_never_goes_negative`, `diamond_requires_challenge`, `cannot_upgrade_past_diamond`, `level_thresholds`, `daily_pack_includes_game_of_the_day`, `achievement_cards_never_in_packs`, `other_days_game_of_the_day_never_in_packs`.
- [ ] **Step 2:** Run `npm test --prefix app -- economy`. Expected: FAIL.
- [ ] **Step 3:** Implement with immutable returns; placeholder numbers marked "tune in playtest".
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): economy`.

### Task 10: Scoring

**Files:** Create `app/src/game/scoring.ts`, `scoring.test.ts`

**Interfaces:**
- Produces: `answerScore(correct: boolean, ms: number): number` (0 if wrong; 100 plus a speed bonus up to 50 falling linearly to 0 at 15000 ms); `guessScore(cluesUsed: number, correct: boolean): number` (100, 80, 60, 40, 20 for 1 to 5 clues; 0 if wrong); `streakAfter(p: Profile, date: string): Profile`; `knowledgeRating(p: Profile): number` (percent correct over answered questions, weighted by difficulty).

- [ ] **Step 1: Write the failing tests:** `wrong_answer_scores_zero`, `faster_scores_more_up_to_cap`, `guess_player_fewer_clues_scores_more`, `guess_player_wrong_scores_zero`, `rating_is_zero_with_no_answers`.
- [ ] **Step 2:** Run `npm test --prefix app -- scoring`. Expected: FAIL.
- [ ] **Step 3:** Implement. Commit after the tests pass: `feat(app): scoring`.

### Task 11: Calendar, daily tasks, achievements and sets

**Files:** Create `app/src/game/calendar.ts`, `tasks.ts`, `achievements.ts`, `sets.ts` and a `.test.ts` for each

**Interfaces:**
- Consumes: `Clock`, `Profile`.
- Produces: `unlockedDates(all: string[], now: Date): string[]` (a date unlocks at 08:00 Europe/Zurich on the following day); `cumulativeDays(p: Profile): number`; `milestoneReward(days: number): { pucks: number, packId?: string } | null` (milestones at 2, 3, 5, 10, 15); `applySkip(p: Profile, now: Date): Profile` (one free skip per ISO week); `Task { id, label, goal: number, reward: number, metric: "answers"|"correct"|"cardsFlipped"|"predictions" }`; `dailyTasks(date: string): Task[]` (3 per day); `progress(p: Profile, t: Task): number`.
- Produces: `ACHIEVEMENTS: { id: string, label: string, cardId: string, earned(p: Profile): boolean }[]` (`streak3`, `perfect_day`, `first_prediction_win`, `three_prediction_wins`, `first_upgrade`, `first_set`); `newlyEarned(p: Profile): string[]` (earned and not yet in `p.achievements`); `completedSets(p: Profile, sets: SetBonus[]): string[]` (ids of sets whose cards are all owned and not in `p.claimedSets`); `claimSet(p: Profile, set: SetBonus): Profile` (adds `set.reward.pucks`, records `set.id` in `claimedSets`, idempotent).

- [ ] **Step 1: Write the failing tests:** `door_locked_before_0800_zurich`, `door_unlocks_at_0800_zurich`, `dst_change_days_still_unlock_at_0800` (2026-10-25 and 2027-03-28), `missed_day_keeps_cumulative_count`, `second_skip_in_week_rejected`, `milestone_table`, `daily_tasks_deterministic_per_date`, `perfect_day_needs_all_five_correct`, `newly_earned_excludes_already_awarded`, `incomplete_set_not_claimable`, `claiming_set_twice_pays_once`.
- [ ] **Step 2:** Run `npm test --prefix app -- calendar tasks`. Expected: FAIL.
- [ ] **Step 3:** Implement with `Intl.DateTimeFormat` and `timeZone: "Europe/Zurich"`.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): calendar and tasks`.

### Task 12: Predictions logic

**Files:** Create `app/src/game/predictions.ts`, `predictions.test.ts`

**Interfaces:**
- Consumes: `Profile`, `Market`, `Bet`.
- Produces: `placeBet(p: Profile, m: Market, optionId: string, stake: number, now: Date): { ok: true, profile: Profile } | { ok: false, reason: "locked"|"funds"|"stake"|"duplicate"|"option" }` (stake between `MIN_STAKE` and `MAX_STAKE` in the config; one bet per market); `settleBets(p: Profile, markets: Market[], results: Record<string, string>): { profile: Profile, outcomes: { marketId: string, won: boolean, payout: number }[] }` (payout is `round(stake * odds)` on a win; idempotent through `profile.settled`).

- [ ] **Step 1: Write the failing tests:** `bet_after_lock_rejected`, `bet_over_balance_rejected`, `duplicate_bet_on_market_rejected`, `unknown_option_rejected`, `win_pays_stake_times_odds`, `loss_pays_nothing_and_stake_stays_deducted`, `settling_twice_pays_once`, `settle_ignores_markets_without_results`.
- [ ] **Step 2:** Run `npm test --prefix app -- predictions`. Expected: FAIL.
- [ ] **Step 3:** Implement. The stake is deducted when the bet is placed.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): predictions`.

### Task 13: Home, calendar, tasks and PWA

**Files:** Create `app/src/app.tsx`, `screens/Home.tsx`, `screens/Calendar.tsx`, `screens/Tasks.tsx`, `components/Door.tsx`, `components/ReplayBar.tsx`, `public/manifest.webmanifest`, `app/src/screens/Home.test.tsx`, `app/src/pwa.test.ts`; Modify `app/vite.config.ts`

**Interfaces:**
- Consumes: `Clock`, `unlockedDates`, `openPack`, `milestoneReward`, `dailyTasks`.
- Produces: routes `#/`, `#/challenge/:date`, `#/predict`, `#/cards`, `#/tasks`; `<ReplayBar clock />` showing the replay day with an "Advance day" button (hidden in live mode); an installable PWA manifest (name, 192 and 512 icons, `display: "standalone"`, `start_url: "./"`) and a "Remind me at 08:00" button that requests notification permission and shows a sample notification.

- [ ] **Step 1: Write the failing tests:** `locked_door_shows_unlock_time`, `claiming_door_opens_daily_pack_once`, `red_dot_for_unclaimed_door`, `replay_bar_advances_day`, `manifest_is_installable` (fields above), `reminder_button_tolerates_denied_permission`.
- [ ] **Step 2:** Run `npm test --prefix app -- Home pwa`. Expected: FAIL.
- [ ] **Step 3:** Implement. Home shows XP level, Pucks, streak, tomorrow's teaser, and one primary "Play today" button.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): home, calendar, tasks, pwa`.

### Task 14: Challenge and reveal

**Files:** Create `app/src/screens/Challenge.tsx`, `components/QuestionView.tsx`, `components/GuessPlayer.tsx`, `components/HigherLower.tsx`, `components/Reveal.tsx`, `app/src/screens/challenge.test.tsx`

**Interfaces:**
- Consumes: `DayPack`, `answerScore`, `guessScore`, `Profile`.
- Produces: `<Challenge pack onFinish(results: { id: string, correct: boolean, score: number }[]) />`; `<Reveal why detail onNext />` shown after every answer.

- [ ] **Step 1: Write the failing tests:** `shows_category_label_per_question`, `reveal_always_follows_an_answer`, `hidden_hero_reveals_real_names_after_answer`, `guess_player_shows_one_clue_at_a_time`, `higher_lower_shows_both_values_after_answer`, `reload_mid_challenge_resumes_without_double_award`, `finishing_awards_xp_and_pucks_once`.
- [ ] **Step 2:** Run `npm test --prefix app -- challenge`. Expected: FAIL.
- [ ] **Step 3:** Implement. Guess the Player shows one clue at a time and each extra clue lowers the score.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): challenge and reveal`.

### Task 15: Predictions screen

**Files:** Create `app/src/screens/Predict.tsx`, `components/MarketCard.tsx`, `components/SettleSheet.tsx`, `app/src/screens/predict.test.tsx`

**Interfaces:**
- Consumes: `Market`, `placeBet`, `settleBets`, `Clock`.
- Produces: `<Predict markets results />` listing today's markets with odds and a stake picker; `<SettleSheet outcomes />` showing yesterday's results, payouts and the why.

- [ ] **Step 1: Write the failing tests:** `shows_play_money_label`, `stake_picker_respects_min_max`, `bet_button_disabled_when_locked_or_short`, `settle_sheet_lists_wins_and_losses`, `day_without_games_shows_recap_not_markets`.
- [ ] **Step 2:** Run `npm test --prefix app -- predict`. Expected: FAIL.
- [ ] **Step 3:** Implement. On advancing the replay day, settle the previous day's bets and open the sheet.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): predictions screen`.

### Task 16: Cards screens

**Files:** Create `app/src/screens/Cards.tsx`, `components/CardView.tsx`, `components/PackOpen.tsx`, `app/src/screens/cards.test.tsx`

**Interfaces:**
- Consumes: `Card`, `openPack`, `upgradeCard`, `PACKS`, `UPGRADE_COST`.
- Produces: `<CardView card tier owned />` (flip shows the back for the current tier only); `<Cards catalog profile />` with category filter, set progress and bonus claims, shop packs and the upgrade flow including the diamond challenge.

- [ ] **Step 1: Write the failing tests:** `unowned_cards_are_silhouettes`, `flip_shows_back_for_current_tier_only`, `upgrade_disabled_when_pucks_short`, `diamond_needs_challenge`, `shop_pack_reduces_pucks`, `category_filter_shows_only_that_category`, `set_progress_counts_owned_cards`, `claim_set_button_only_when_complete`, `locked_achievement_card_shows_how_to_unlock`.
- [ ] **Step 2:** Run `npm test --prefix app -- cards`. Expected: FAIL.
- [ ] **Step 3:** Implement. Rarity is colour and edge, tier is a badge.
- [ ] **Step 4:** Run the tests. Expected: PASS. Commit `feat(app): cards screens`.

### Task 17: Submission pack

**Files:** Create `scripts/check_public.sh`, `.gitignore`, `README.md`, `docs/submission/slides-outline.md`, `docs/submission/video-script.md`, `docs/submission/summary.md`, `app/e2e/smoke.spec.ts`

- [ ] **Step 1: Write the failing check.** `scripts/check_public.sh` exits non-zero if `git ls-files` contains any `.xlsx`, `.pdf`, `.png`, `.mp4` or `.csv` outside `app/public`, `content/history`, `pipeline/tests/fixtures` and `docs/submission`, or any path containing `OneDrive` or `Screenshot`. Run it. Expected: FAIL on the current repo.
- [ ] **Step 2:** Add the organizers' files and screenshots to `.gitignore`; if any are tracked, untrack them with `git rm --cached`. Run the check. Expected: PASS.
- [ ] **Step 3:** Write the Playwright smoke test at 375x812: claim a door, open the pack, place a prediction, finish a challenge and read a reveal, advance the replay day, see the settle sheet, upgrade a card to silver. Assert no console errors. Run `npx playwright test`. Expected: FAIL until wiring is complete, then PASS.
- [ ] **Step 3b:** Run `npm run build --prefix app`. Expected: `app/dist` under 5 MB. Host it publicly (GitHub Pages or Netlify) and open it on a phone.
- [ ] **Step 4:** Write `docs/submission/summary.md` (the project summary: how it addresses the theme, objectives, potential impact, innovation), `slides-outline.md` mapped to the nine required slides, and `video-script.md` timed to 2:45: problem 20 s, the loop on a phone 2:00, the insight 15 s, next steps 10 s.
- [ ] **Step 5:** Record the video at the final build, check it is under 3:00 in the exported file's properties, and test the public repo link in a private browser window.
- [ ] **Step 6:** Commit `chore: submission pack`.

## Deferred (version 2)

Social and card trading, push notifications and a backend, Kickoff onboarding chain, Elo-style Hockey IQ with percentiles, share grid, Turning Point and Rookie questions, logo, mascot and historic-player cards with real art.

## Risks

- **Only the Final has event data:** Days 1 to 5 build from results alone, and their player questions use a labelled Final spotlight. If the organizers release more games, `build_day` already takes optional events and stats per day, so adding games needs no schema change.
- **Report transcription:** The 2025 results are typed from report images; a typo breaks questions and markets. Task 1b tests the sums (periods to scores, group tables) to catch it.
- **Data terms:** Do not publish the organizers' files until the terms are confirmed. Only processed aggregates go in the repo; Wikipedia history needs credit and a cross-check.
- **Content volume:** The question bank (at least 16 questions, 8 Hockey 101 and 8 History) and the rule cards are the long pole for Lucia; start them on day one, in parallel with the pipeline.
- **Scope:** If anything slips, cut in this order: daily tasks, powerplay market, achievements, set bonuses, Game of the Day cards.
