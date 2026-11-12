# The Spengler Cup UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the advent-calendar prototype into "The Spengler Cup": a dark, card-image-driven app with a morning opening (welcome, gift deck, scores), a Today screen with a games carousel, and an image album with a flip popup.

**Architecture:** The 259 generated PNGs are converted once to WebP (two sizes) and committed under `app/public/cards/`. The pipeline gives every card an `image` slug and, in `--demo` mode, builds player, goalie and final-moment cards from a small public file with dataset statistics hidden. The app gains a pure `nextOpeningStep` function that drives full-screen opening steps before the normal routes, a Today screen replacing Home, and a Cards screen rebuilt around image components. Game rules, economy, quiz, predictions and tasks logic are untouched.

**Tech Stack:** TypeScript, Preact 11, Vite 8, Vitest 5 + @testing-library/preact; Python 3.12 pipeline (pyyaml, jsonschema, pytest); Pillow for the one-off image conversion only.

**Spec:** `docs/superpowers/specs/2026-11-12-the-spengler-cup-ui-design.md`

**Branch:** create `feat/the-spengler-cup-ui` from `chore/rename-the-spengler-cup` (PR #4), or from `main` if that PR has merged.

**Commands:** app tests `PATH=$PWD/.tools/node/bin:$PATH npm test --prefix app`; type check and build `PATH=$PWD/.tools/node/bin:$PATH npm run build --prefix app`; pipeline tests `.venv/bin/pytest -q`; data `bash scripts/build_data.sh` (real, local) or `bash scripts/build_data.sh --demo`; public check `bash scripts/check_public.sh`.

## Global Constraints

- No user-visible "advent", "door" or "calendar" anywhere in the app, README or `docs/submission/`. Stored profile field names (`claimedDoors`) and the storage key `sa.profile` keep their names.
- Nothing derived from the confidential dataset is committed: `app/public/data/`, `raw/`, the 331 MB originals folder, its zip, root `manifest.json` and the two root PNGs stay out of git.
- No change to quiz, predictions, tasks or economy behaviour or numbers.
- Dark theme only. Colours: background `#07111f`, surface `#101d33`, border `#22334f`, text `#eaf0fb`, muted `#94a3bd`; blues `#07285f` `#0b3d91` `#2f6fdb`; gold `#d4a017`; red `#c8102e`; green `#1e8e4e`; tiers Normal `#8a94a6`, Silver `#aab4c4`, Gold `#d4a017`, Diamond `#4fc3f7`; category colours Player `#2f6fdb`, Goalie `#12a4a0`, Team `#4b4bb8`, Moment `#c8102e`, Rules `#5b6a85`, Game of the Day `#1e8e4e`, Achievement `#8a4fd6`.
- The daily deck unlocks at 08:00 Europe/Zurich (existing `eightZurich`).
- Tapping a locked card does nothing.
- No new runtime dependency in the app. Animations are CSS and respect `prefers-reduced-motion`.
- Converted image set under 40 MB in total; thumbnails 320 px wide, full size 768 px wide, WebP.
- Commit messages end with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Review Focus

1. A card image fails to load (offline first view, missing file): the card must show the typographic fallback, not a broken image. Test in Task 4.
2. A profile saved before this change (no `seenWelcome`, no `seenRecaps`): the app must open without error and run the opening normally. Test in Task 6.
3. The daily deck returns a number of cards other than 3 (0 when already claimed, more when a milestone pack is added): the reveal counter uses the real count and an empty deck skips the reveal. Test in Task 6.
4. Fast repeated taps on "Tear it open" or "Next card": no second claim, no index past the last card. Test in Task 6.
5. The carousel on a day with no games (the day after the final) and at the first and last day: shows "No games" and disabled arrows, no crash. Test in Task 5.

## File Structure

| File | Responsibility |
|---|---|
| `scripts/convert_card_images.py` (new) | One-off PNG to WebP conversion into `app/public/cards/{thumb,full}/` and `app/public/art/` |
| `content/cards_public.yaml` (new) | Public facts for player, goalie and final-moment cards used by the demo build |
| `pipeline/public_cards.py` (new) | Builds those cards without dataset statistics |
| `pipeline/cards.py` | `image` and `statsHidden` fields, demo wiring |
| `pipeline/build_days.py` | Also writes `schedule.json` |
| `app/src/cardImages.ts` (new) | Image URL helpers |
| `app/src/components/CardImage.tsx` (new) | Front, locked and back images with fallback |
| `app/src/components/GamesCarousel.tsx` (new) | Day-by-day games |
| `app/src/components/CardPopup.tsx`, `backLayout.ts` (new) | Enlarged card, flip, back overlay, upgrade |
| `app/src/game/opening.ts` (new) | `nextOpeningStep` |
| `app/src/screens/{Welcome,GiftDeck,Recap,Today}.tsx` (new) | Opening steps and main window |
| `app/src/screens/Cards.tsx` | Album, Sets, Shop tabs |
| `app/src/styles/{tokens,app}.css` | Dark theme |
| Deleted | `components/Door.tsx`, `screens/Calendar.tsx`, `screens/Home.tsx`, `screens/Home.test.tsx`, `components/PackOpen.tsx`, `components/PulledCards.tsx` (replaced) |

---

### Task 1: Convert and commit the card images

**Files:**
- Create: `scripts/convert_card_images.py`, `scripts/requirements-images.txt` (one line: `pillow`)
- Create (generated): `app/public/cards/thumb/*.webp`, `app/public/cards/full/*.webp`, `app/public/art/trophy.webp`, `app/public/art/deck.webp`
- Modify: `.gitignore`

**Interfaces:**
- Produces: files `app/public/cards/<size>/<name>.webp` where `<size>` is `thumb` (320 px wide) or `full` (768 px wide) and `<name>` is the source file name without `.png` (for example `front_team_hc-davos_silver`, `back_team_gold`, `locked_team`). `app/public/art/trophy.webp` and `deck.webp` are 768 px wide.

- [ ] **Step 1: Add ignores.** Append to `.gitignore`: `/spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE/`, `/spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE.zip`, `/manifest.json`, `/davos_spengler_cup_trophy_poster.png`, `/spengler_cup_2025_card_deck.png`.

- [ ] **Step 2: Write `scripts/convert_card_images.py`.** `main(src: Path, out: Path)` with defaults `spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE/assets` and `app/public`. For every `*.png` in `src`: resize preserving aspect ratio and alpha to width 320 into `cards/thumb/`, width 768 into `cards/full/`, WebP quality 80, method 6. Convert `davos_spengler_cup_trophy_poster.png` to `art/trophy.webp` and `spengler_cup_2025_card_deck.png` to `art/deck.webp` at width 768. Print file count and total bytes per folder. Exit non-zero if the source count is not 259.

- [ ] **Step 3: Run it.**

Run: `.venv/bin/pip install -r scripts/requirements-images.txt && .venv/bin/python scripts/convert_card_images.py`
Expected: `thumb: 259 files`, `full: 259 files`, `art: 2 files`.

- [ ] **Step 4: Check the budget.**

Run: `du -sm app/public/cards app/public/art`
Expected: `app/public/cards` under 40. If over, lower quality to 72 and rerun.

- [ ] **Step 5: Look at four converted files** (`full/front_player_aiden-fink_diamond.webp`, `thumb/front_team_hc-davos_normal.webp`, `full/back_team_gold.webp`, `thumb/locked_player.webp`) to confirm transparent corners survived and text is legible at thumb size. If thumb text is unreadable, note it in the commit body; do not change the size.

- [ ] **Step 6: Commit.**

```bash
bash scripts/check_public.sh
git add .gitignore scripts/convert_card_images.py scripts/requirements-images.txt app/public/cards app/public/art
git commit -m "feat: add converted card images and conversion script"
```
Expected: `check_public: ok`.

---

### Task 2: Pipeline: image slug, hidden stats, public demo catalog

**Files:**
- Modify: `pipeline/cards.py`, `schema/card.schema.json`, `app/src/types.ts`
- Create: `content/cards_public.yaml`, `pipeline/public_cards.py`, `pipeline/tests/test_public_cards.py`
- Test: `pipeline/tests/test_cards.py`, `pipeline/tests/test_public_cards.py`

**Interfaces:**
- Produces (Python): `image_slug(title: str) -> str`; `Card.image: str | None`; `Card.statsHidden: bool = False`; `public_cards(edition: Edition2025, spec: dict) -> list[Card]`; `build_catalog(..., public: dict | None = None)` (when `public` is given, player, goalie and the four final-moment cards come from `public_cards` and no card keeps a `shotmap` or `timeline` visual).
- Produces (JSON, consumed by the app): each card has `"image": "team_hc-davos"` (or `null`) and `"statsHidden": false|true`.
- Produces (TypeScript): `Card.image: string | null; Card.statsHidden?: boolean`.

Image naming rule: `image = "<prefix>_<image_slug(x)>"` with prefix `player`, `goalie`, `team`, `moment`, `achievement`, `rules-and-concepts` (category `rule`), `game-of-the-day` (category `gotd`). `x` is the card title, except for `gotd` where it is `"<home> vs <away>"`. `image_slug` strips accents, lowercases, deletes `.`, turns every other run of non-alphanumerics into `-`, and trims `-`.

- [ ] **Step 1: Write the failing tests** in `pipeline/tests/test_cards.py`:

```python
def test_image_slug_matches_asset_names():
    assert image_slug("U.S. Collegiate Selects") == "us-collegiate-selects"
    assert image_slug("Expected goals (xG)") == "expected-goals-xg"
    assert image_slug("Marcus Sörensen") == "marcus-sorensen"
    assert image_slug("HC Fribourg-Gottéron") == "hc-fribourg-gotteron"

def test_every_card_has_an_image_slug():
    by_id = {c.id: c for c in catalog()}
    assert by_id["team-hc-davos"].image == "team_hc-davos"
    assert by_id["rule-icing"].image == "rules-and-concepts_icing"
    assert by_id["gotd-2025-12-26"].image == "game-of-the-day_team-canada-vs-us-collegiate-selects"
    assert by_id["ach-streak3"].image == "achievement_three-in-a-row"
    assert all(c.image for c in by_id.values())
```

and `pipeline/tests/test_public_cards.py` (build the catalog as `test_cards.catalog()` does, passing `public=yaml.safe_load(content/cards_public.yaml)`):

```python
TIERS = ("normal", "silver", "gold", "diamond")

def test_public_catalog_has_the_56_cards():
    cards = public_catalog()
    assert len(cards) == 56
    assert sum(c.category == "player" for c in cards) == 20
    assert {c.title for c in cards if c.category == "goalie"} == {"Adam Gajan", "Sandro Aeschlimann"}

def test_public_catalog_hides_dataset_stats():
    for c in public_catalog():
        assert c.back["gold"]["visual"] == "table"
        if c.category in ("player", "goalie") and "Key player" not in c.front:
            assert c.statsHidden and c.back["gold"]["data"] == {"rows": []}
    fink = next(c for c in public_catalog() if c.title == "Aiden Fink")
    assert fink.front == ["#18 · U.S. Collegiate Selects"] and fink.rarity == "legendary"

def test_every_public_card_has_images_on_disk():
    cards_dir = ROOT / "app" / "public" / "cards"
    for c in public_catalog():
        for size in ("thumb", "full"):
            for tier in TIERS:
                assert (cards_dir / size / f"front_{c.image}_{tier}.webp").exists(), c.id
    for prefix in ("player", "goalie", "team", "moment", "achievement", "rules-and-concepts", "game-of-the-day"):
        assert (cards_dir / "thumb" / f"locked_{prefix}.webp").exists()
        for tier in TIERS:
            assert (cards_dir / "full" / f"back_{prefix}_{tier}.webp").exists()

def test_public_catalog_validates_against_schema():
    jsonschema.validate({"cards": [c.to_json() for c in public_catalog()], "sets": []}, SCHEMA)
```

- [ ] **Step 2: Run to verify they fail.**

Run: `.venv/bin/pytest -q pipeline/tests/test_cards.py pipeline/tests/test_public_cards.py`
Expected: FAIL (`image_slug` not defined, `content/cards_public.yaml` missing).

- [ ] **Step 3: Write `content/cards_public.yaml`.** Public facts only (name, number, team, rarity; goal times of the final):

```yaml
# Public facts for the hosted demo. No statistics from the confidential dataset.
players:   # the final's featured players; key players come from edition2025.yaml
  - {name: "Aiden Fink", number: 18, team: "U.S. Collegiate Selects", rarity: legendary}
  - {name: "Valentin Nussbaumer", number: 66, team: "HC Davos", rarity: epic}
  - {name: "Tino Kessler", number: 72, team: "HC Davos", rarity: epic}
  - {name: "Ryan Walsh", number: 21, team: "U.S. Collegiate Selects", rarity: epic}
  - {name: "Chris Egli", number: 96, team: "HC Davos", rarity: rare}
  - {name: "Cole Knuble", number: 22, team: "U.S. Collegiate Selects", rarity: rare}
  - {name: "Matej Stransky", number: 44, team: "HC Davos", rarity: rare}
  - {name: "Quinn Finley", number: 19, team: "U.S. Collegiate Selects", rarity: rare}
  - {name: "Adam Tambellini", number: 19, team: "HC Davos", rarity: rare}
  - {name: "Rasmus Asplund", number: 74, team: "HC Davos", rarity: rare}
  - {name: "Gavin McCartthy", number: 2, team: "U.S. Collegiate Selects", rarity: common}
  - {name: "Sven Jung", number: 90, team: "HC Davos", rarity: common}
  - {name: "Matt Dimarsico", number: 14, team: "U.S. Collegiate Selects", rarity: common}
goalies:
  - {name: "Adam Gajan", team: "U.S. Collegiate Selects"}
  - {name: "Sandro Aeschlimann", team: "HC Davos"}
moments:
  - {id: moment-turning-point, title: "The turning point", rarity: epic, team: "HC Davos", front: ["2025 Final", "Period 3", "15:21"]}
  - {id: moment-multi-goal, title: "Adam Tambellini scores 2", rarity: rare, team: "HC Davos", front: ["2025 Final", "2 goals"]}
  - {id: moment-first-goal, title: "First blood", rarity: rare, team: null, front: ["2025 Final", "11:15"]}
  - {id: moment-last-goal, title: "The last word", rarity: rare, team: null, front: ["2025 Final", "17:49"]}
```

Before committing, compare ids, titles, teams and rarities with the local `app/public/data/cards.json` (real build) and correct this file where they differ; the turning-point team is not confirmed here.

- [ ] **Step 4: Implement.**
  - `image_slug` and `Card.image`, `Card.statsHidden` in `pipeline/cards.py`; set `image` for every card in `build_catalog` by the naming rule; add both properties to `schema/card.schema.json` (`image`: string or null; `statsHidden`: boolean; neither required).
  - `pipeline/public_cards.py`: `public_cards(edition, spec)` returns the 13 player cards (front `["#<n> · <team>"]`), 2 goalie cards (front `["Goalie · <team>"]`, rarity `epic`) and 4 moment cards. Back texts, exact copy: normal `"<name> wore #<n> for <team> at the 2025 Spengler Cup."` (goalies: `"<name> kept goal for <team> in the 2025 Final."`; moments: `"A moment from the 2025 Final between the U.S. Collegiate Selects and HC Davos."`); silver = the team's `fact` from `edition.teams` (moments: `"The final finished U.S. Collegiate Selects 3:6 HC Davos."`); gold `{"text": "Full stats are in the private build.", "visual": "table", "data": {"rows": []}}`; diamond `choice_diamond(id, "Which team did <name> play for?", team, all team names)` (moments: `choice_diamond(id, "Who won the 2025 Final?", "HC Davos", all team names)`). All with `statsHidden=True`.
  - `build_catalog(..., public=None)`: with `public`, use `public_cards` in place of `_player_cards`, `_goalie_cards` and the event-derived moments (history moments stay), keep `_key_player_cards` (skipping names already present), and replace any remaining `shotmap` or `timeline` gold (the final's Game of the Day) with the "private build" table and `statsHidden=True`.
  - `main()`: when `--demo`, pass `public=load("cards_public.yaml")`.
  - `app/src/types.ts`: add `image: string | null; statsHidden?: boolean` to `Card`.

- [ ] **Step 5: Run the tests.**

Run: `.venv/bin/pytest -q`
Expected: all pass (69 existing + 6 new).

- [ ] **Step 6: Rebuild both data sets and compare.**

Run: `bash scripts/build_data.sh --demo && python3 -c "import json;c=json.load(open('app/public/data/cards.json'))['cards'];print(len(c), sum(1 for x in c if x.get('statsHidden')))"`
Expected: `56 20` (13 players, 2 goalies, 4 final moments and the final's Game of the Day).
Then run `bash scripts/build_data.sh` to restore the real local data; expected `wrote 56 cards`.

- [ ] **Step 7: Commit.**

```bash
git add pipeline schema content/cards_public.yaml app/src/types.ts
git commit -m "feat(pipeline): card image slugs and a public demo catalog without dataset stats"
```

---

### Task 3: Pipeline and app: games schedule

**Files:**
- Modify: `pipeline/build_days.py`, `app/src/data.ts`, `app/src/types.ts`
- Test: `pipeline/tests/test_questions.py` (or a new `pipeline/tests/test_schedule.py`)

**Interfaces:**
- Produces (Python): `schedule(edition: Edition2025) -> list[dict]`, written by `build_days.main` to `app/public/data/schedule.json` as `{"games": [...]}`.
- Produces (TypeScript): `interface ScheduledGame { id: string; date: string; start: string; stage: string; group: string | null; home: string; away: string; score: [number, number] }`; `loadSchedule(): Promise<ScheduledGame[]>`.

- [ ] **Step 1: Write the failing test** `pipeline/tests/test_schedule.py`:

```python
def test_schedule_lists_all_games_with_scores():
    games = schedule(load_edition2025(ROOT / "content" / "edition2025.yaml"))
    assert len(games) == 11
    assert games[0] == {"id": "g1", "date": "2025-12-26", "start": "15:10", "stage": "Group stage", "group": "A",
                        "home": "HC Fribourg-Gottéron", "away": "HC Sparta Praha", "score": [5, 2]}
    assert games[-1]["stage"] == "Final" and games[-1]["group"] is None and games[-1]["score"] == [3, 6]
```

- [ ] **Step 2: Run it.** `.venv/bin/pytest -q pipeline/tests/test_schedule.py` Expected: FAIL, `schedule` not defined.
- [ ] **Step 3: Implement `schedule`** in `pipeline/build_days.py` (stage labels from `pipeline.cards.STAGES`; if `Game2025` lacks `start` or `group`, add them in `pipeline/editions.py` from the YAML) and write the file in `main`. Add the type and `loadSchedule` to the app (`getJson<{ games: ScheduledGame[] }>("schedule.json")`).
- [ ] **Step 4: Run.** `.venv/bin/pytest -q && bash scripts/build_data.sh` Expected: all pass; `app/public/data/schedule.json` exists.
- [ ] **Step 5: Commit.** `git add pipeline app/src/data.ts app/src/types.ts && git commit -m "feat: games schedule for the app"`

---

### Task 4: Dark theme and card image components

**Files:**
- Modify: `app/src/styles/tokens.css`, `app/src/styles/app.css`
- Create: `app/src/cardImages.ts`, `app/src/components/CardImage.tsx`, `app/src/components/CardImage.test.tsx`

**Interfaces:**
- Consumes: `Card.image` (Task 2), files from Task 1.
- Produces:
  - `type ImageSize = "thumb" | "full"`
  - `frontSrc(card: Card, tier: Tier, size: ImageSize): string | null` (null when `card.image` is null)
  - `backSrc(category: CardCategory, tier: Tier): string` (always `full`)
  - `lockedSrc(category: CardCategory): string` (always `thumb`)
  - `<CardFront card tier size />` renders `<img alt="<title>, <tier>">`, and on load error or null src renders the typographic fallback (title plus `card.front` lines, class `card-fallback rarity-<rarity> tier-<tier>`).
  - `<CardLocked category />` renders `<img alt="Locked card">`.
  - URLs are `${import.meta.env.BASE_URL}cards/<size>/<name>.webp`; category prefixes `rule` → `rules-and-concepts`, `gotd` → `game-of-the-day`, others unchanged.

- [ ] **Step 1: Write the failing tests** (`CardImage.test.tsx`), with a `card()` helper like the one in `screens/cards.test.tsx` extended with `image`:

```tsx
it("builds_front_back_and_locked_urls", () => {
  expect(frontSrc(card({ image: "team_hc-davos" }), "silver", "thumb")).toMatch(/cards\/thumb\/front_team_hc-davos_silver\.webp$/);
  expect(backSrc("rule", "gold")).toMatch(/cards\/full\/back_rules-and-concepts_gold\.webp$/);
  expect(lockedSrc("gotd")).toMatch(/cards\/thumb\/locked_game-of-the-day\.webp$/);
  expect(frontSrc(card({ image: null }), "normal", "full")).toBeNull();
});
it("falls_back_to_text_when_the_image_fails", () => {
  render(<CardFront card={card({ title: "HC Davos", front: ["Group B"], image: "team_hc-davos" })} tier="normal" size="thumb" />);
  fireEvent.error(screen.getByRole("img"));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("HC Davos")).toBeTruthy();
  expect(screen.getByText("Group B")).toBeTruthy();
});
it("falls_back_to_text_when_the_card_has_no_image", () => {
  render(<CardFront card={card({ title: "Mystery", image: null })} tier="normal" size="thumb" />);
  expect(screen.getByText("Mystery")).toBeTruthy();
});
```

- [ ] **Step 2: Run.** `npm test --prefix app -- CardImage` Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `cardImages.ts` and `CardImage.tsx`. Images use `loading="lazy"`, `decoding="async"`, and CSS `aspect-ratio: 2 / 3`.
- [ ] **Step 4: Theme.** Replace `tokens.css` with the dark values from Global Constraints as the only theme (delete the `prefers-color-scheme` and `data-theme` blocks; add `--tier-*` and `--cat-*` tokens; `color-scheme: dark` on `:root`). In `app.css`: primary buttons gold `#d4a017` with text `#07111f`; body background a vertical gradient `#07285f` to `#07111f` fixed; cards and panels on `--surface`; add `<meta name="theme-color" content="#07111f">` in `app/index.html` and set `theme_color` and `background_color` in `manifest.webmanifest` to `#07111f`.
- [ ] **Step 5: Run all app tests.** `npm test --prefix app` Expected: 88 existing + 3 new pass.
- [ ] **Step 6: Commit.** `git add app && git commit -m "feat(app): dark theme and card image components"`

---

### Task 5: Today screen with the games carousel

**Files:**
- Create: `app/src/components/GamesCarousel.tsx`, `app/src/components/GamesCarousel.test.tsx`, `app/src/screens/Today.tsx`, `app/src/screens/Today.test.tsx`
- Modify: `app/src/app.tsx`, `app/src/screens/Tasks.tsx`, `app/src/styles/app.css`
- Delete: `app/src/screens/Home.tsx`, `app/src/screens/Home.test.tsx`, `app/src/screens/Calendar.tsx`, `app/src/components/Door.tsx`

**Interfaces:**
- Consumes: `ScheduledGame`, `loadSchedule` (Task 3).
- Produces:
  - `<GamesCarousel games={ScheduledGame[]} dates={string[]} today={string} />`
  - `<Today {...ScreenProps} schedule={ScheduledGame[]} tasksDone={number} tasksTotal={number} />` (`ScreenProps` = `clock, dates, profile, update, catalog, rng?`)
  - `ScreenProps` moves from `Home.tsx` to `app/src/screens/props.ts` (same shape).
  - Routes: `#/` Today, `#/cards`, `#/challenge/:date`, `#/predict`, `#/tasks`. `#/calendar` no longer exists (falls through to Today).
  - Bottom bar links, in order: `Today` (`#/`), `Cards` (`#/cards`), `Quiz` (`#/challenge/<today>`), `Predict` (`#/predict`).

Behaviour decisions:
- Carousel pages are the tournament days that have games (from `games`), plus `today` if it has none. It opens on `today`. A page for a date before `today` shows `home score:score away` with the label "Final score"; a page for `today` or later shows the start time and no score. A page with no games shows "No games". Header shows the date as "Sat 27 Dec" and "Today" on the current day. Buttons with accessible names "Previous day" and "Next day", disabled at the ends. One dot per page, the current one marked `aria-current="true"`. Horizontal swipe changes page (CSS scroll snap; the buttons set the page index).
- Header: title "The Spengler Cup", then chips `<pucks> Pucks`, `🔥 <streak>` and `Lv <level>` in one flex row with equal height (the level chip is this plan's addition so the level stays visible).
- Tiles under "Win Pucks and cards": Daily quiz (`#/challenge/<today>`, status "Done" when `<today>:challenge` is in `completedTasks`, else "5 questions"), Predict (`#/predict`), Tasks (`#/tasks`, "`<done>` of `<total>` done"), Card shop (`#/cards?tab=shop`).
- "Remind me at 08:00" stays on Today below the tiles, with the existing denied and unsupported messages.
- The "Use this week's free skip" button moves from the deleted Calendar screen to the Tasks screen (same handler, `applySkip(p, clock.now())`); `Tasks` gains a `now: Date` prop.

- [ ] **Step 1: Write the failing tests.**

```tsx
// GamesCarousel.test.tsx — GAMES: g1,g2 on 2025-12-26 (scores 5:2, 3:2), g3,g4 on 2025-12-27
it("opens_on_today_with_start_times_and_no_scores", () => {
  render(<GamesCarousel games={GAMES} dates={DATES} today="2025-12-27" />);
  expect(screen.getByText(/today/i)).toBeTruthy();
  expect(screen.getByText("15:10")).toBeTruthy();
  expect(screen.queryByText("5:2")).toBeNull();
});
it("previous_day_shows_final_scores", () => {
  render(<GamesCarousel games={GAMES} dates={DATES} today="2025-12-27" />);
  fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
  expect(screen.getByText("5:2")).toBeTruthy();
  expect(screen.getByText(/final score/i)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Previous day" })).toHaveProperty("disabled", true);
});
it("a_day_without_games_says_so_and_does_not_crash", () => {
  render(<GamesCarousel games={GAMES} dates={[...DATES, "2026-01-01"]} today="2026-01-01" />);
  expect(screen.getByText("No games")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Next day" })).toHaveProperty("disabled", true);
});
// Today.test.tsx
it("shows_chips_tiles_and_no_advent_wording", () => {
  const { container } = render(<Harness />); // profile with pucks 240, streak 2
  expect(screen.getByText("240 Pucks")).toBeTruthy();
  expect(screen.getByRole("link", { name: /daily quiz/i }).getAttribute("href")).toBe("#/challenge/2025-12-27");
  expect(screen.getByRole("link", { name: /tasks/i })).toBeTruthy();
  expect(container.textContent).not.toMatch(/door|advent|calendar/i);
});
```

- [ ] **Step 2: Run.** `npm test --prefix app -- GamesCarousel Today` Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the carousel, Today, the `props.ts` move, the Tasks skip button, and the `app.tsx` changes (load schedule alongside dates and catalog; new nav; remove the Calendar route and import; loading text "Loading The Spengler Cup…"). In `ChallengeRoute` change the done copy to "Your rewards are in. Come back tomorrow at 08:00 for a new deck." and the link label to "Today". Until Task 6 lands, Today shows a plain "Collect today's deck" button that calls `claimDoor` so the app stays usable.
- [ ] **Step 4: Fix the remaining tests** that imported `Home` or `Calendar` (`smoke.test.tsx` in particular): they now start from Today; a test that covered a deleted screen is deleted, not skipped.
- [ ] **Step 5: Run everything.** `npm test --prefix app && npm run build --prefix app` Expected: all pass, build succeeds.
- [ ] **Step 6: Commit.** `git add -A app && git commit -m "feat(app): Today screen with games carousel; remove door and calendar"`

---

### Task 6: The opening sequence

**Files:**
- Create: `app/src/game/opening.ts`, `app/src/game/opening.test.ts`, `app/src/screens/Welcome.tsx`, `app/src/screens/GiftDeck.tsx`, `app/src/screens/Recap.tsx`, `app/src/screens/opening.test.tsx`
- Modify: `app/src/state/profile.ts`, `app/src/state/profile.test.ts`, `app/src/app.tsx`, `app/src/screens/Today.tsx`, `app/src/styles/app.css`
- Delete: `app/src/components/PulledCards.tsx`, `app/src/components/PackOpen.tsx` once `Cards.tsx` no longer uses them (Task 7 if still referenced).

**Interfaces:**
- Consumes: `CardFront` (Task 4), `ScheduledGame` (Task 3), `claimDoor(p, date, catalog, rng)`, `eightZurich(date)`.
- Produces:
  - `Profile.seenWelcome: boolean` (default `false`), `Profile.seenRecaps: string[]` (default `[]`), both filled by `newProfile()` so `loadProfile` back-fills old profiles.
  - `type OpeningStep = "welcome" | "gift" | "recap" | null`
  - `nextOpeningStep(p: Profile, today: string, dates: string[], now: Date): OpeningStep`: `"welcome"` if `!p.seenWelcome`; else `"gift"` if `today` is not in `p.claimedDoors` and `eightZurich(today) <= now`; else `"recap"` if `dates.indexOf(today) > 0` and `today` is not in `p.seenRecaps`; else `null`.
  - `<Welcome onContinue />`, `<GiftDeck date onClaim={() => Card[]} collectionBefore onDone />`, `<CardReveal cards owned onDone />` (exported from `GiftDeck.tsx`, reused by the shop in Task 7), `<Recap games={ScheduledGame[]} outcomes markets bets onContinue />`.

Behaviour decisions:
- `app.tsx` computes `step = nextOpeningStep(profile, clock.day(), dates, clock.now())` and, when not null, renders that step full screen in place of `<main>` and the bottom bar (the replay bar stays). The gift step keeps showing while its reveal is in progress even though the claim already happened: `GiftDeck` holds the pulled cards in its own state and `app.tsx` keeps it mounted until `onDone`.
- Welcome copy: label "Davos · 26 to 31 December", image `art/trophy.webp` (alt "The Spengler Cup trophy"), title "The Spengler Cup", text "Six teams, six days, one trophy. A new deck of cards every morning.", button "Open my first deck". Continue sets `seenWelcome: true`.
- Gift deck copy: label "`<27 December>` · your daily gift", title "A new deck for you", image `art/deck.webp` (alt "A sealed deck of cards"), text "`<n>` cards inside" is not known before the claim, so show "Your daily cards are inside", button "Tear it open". The button calls `onClaim` once (guard with a ref so repeated taps cannot claim twice) and switches to the reveal. If `onClaim` returns no cards, call `onDone` immediately.
- Reveal: one `CardFront` (size `full`) at a time; heading "Your new cards", counter "`<i>` of `<n>`"; tag "New" if the card id was not in `collectionBefore` and has not appeared earlier in this reveal, else "Duplicate · +`<n>` Pucks" with `n` taken from `DUPLICATE_PUCKS` in `economy.config.ts` for that card; a tap on the card or the button "Next card" advances; on the last card the button reads "Continue" and calls `onDone`. The index never exceeds `n - 1`.
- Recap: title "Yesterday in Davos", the games of the previous date in `dates` with final scores, then the existing `SettleSheet` content when `outcomes` is non-empty, button "See today". Continue adds `today` to `seenRecaps`. If yesterday had no games, show "No games yesterday".
- Settlement: the existing effect in `app.tsx` keeps settling bets on day change and stores `{ outcomes, markets }`; the Recap reads that state. If outcomes arrive after the recap for today was already dismissed, the existing sheet is shown on Today as before.
- Remove the temporary "Collect today's deck" button from Today (Task 5).

- [ ] **Step 1: Write the failing tests.**

```ts
// opening.test.ts — DATES = ["2025-12-26","2025-12-27"]; at8 = eightZurich
it("first_open_starts_with_welcome", () => expect(nextOpeningStep(newProfile(), "2025-12-26", DATES, at8("2025-12-26"))).toBe("welcome"));
it("then_the_gift_deck_once_unlocked", () => {
  const p = { ...newProfile(), seenWelcome: true };
  expect(nextOpeningStep(p, "2025-12-26", DATES, at8("2025-12-26"))).toBe("gift");
  expect(nextOpeningStep(p, "2025-12-26", DATES, new Date(at8("2025-12-26").getTime() - 1))).toBeNull();
});
it("no_recap_on_the_first_day_and_one_recap_per_later_day", () => {
  const p = { ...newProfile(), seenWelcome: true, claimedDoors: ["2025-12-26", "2025-12-27"] };
  expect(nextOpeningStep(p, "2025-12-26", DATES, at8("2025-12-26"))).toBeNull();
  expect(nextOpeningStep(p, "2025-12-27", DATES, at8("2025-12-27"))).toBe("recap");
  expect(nextOpeningStep({ ...p, seenRecaps: ["2025-12-27"] }, "2025-12-27", DATES, at8("2025-12-27"))).toBeNull();
});
// profile.test.ts
it("old_profiles_get_the_new_opening_fields", () => {
  const old = JSON.stringify({ ...newProfile(), seenWelcome: undefined, seenRecaps: undefined });
  const p = loadProfile({ getItem: () => old });
  expect(p.seenWelcome).toBe(false);
  expect(p.seenRecaps).toEqual([]);
});
```

```tsx
// opening.test.tsx
it("reveals_cards_one_by_one_with_counter_and_tags", () => {
  const onDone = vi.fn();
  render(<CardReveal cards={[card("a"), card("b"), card("a")]} owned={new Set(["b"])} onDone={onDone} />);
  expect(screen.getByText("1 of 3")).toBeTruthy(); expect(screen.getByText("New")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next card" }));
  expect(screen.getByText("2 of 3")).toBeTruthy(); expect(screen.getByText(/^Duplicate/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next card" }));
  expect(screen.getByText("3 of 3")).toBeTruthy(); expect(screen.getByText(/^Duplicate/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(onDone).toHaveBeenCalledTimes(1);
});
it("tear_it_open_claims_once_even_when_tapped_twice", () => {
  const onClaim = vi.fn(() => [card("a")]);
  render(<GiftDeck date="2025-12-27" onClaim={onClaim} collectionBefore={new Set()} onDone={() => {}} />);
  const b = screen.getByRole("button", { name: "Tear it open" });
  fireEvent.click(b); fireEvent.click(b);
  expect(onClaim).toHaveBeenCalledTimes(1);
  expect(screen.getByText("1 of 1")).toBeTruthy();
});
it("an_empty_deck_skips_the_reveal", () => {
  const onDone = vi.fn();
  render(<GiftDeck date="2025-12-27" onClaim={() => []} collectionBefore={new Set()} onDone={onDone} />);
  fireEvent.click(screen.getByRole("button", { name: "Tear it open" }));
  expect(onDone).toHaveBeenCalledTimes(1);
});
it("recap_lists_yesterdays_final_scores", () => {
  render(<Recap games={GAMES_26} outcomes={[]} markets={[]} bets={[]} onContinue={() => {}} />);
  expect(screen.getByText("Yesterday in Davos")).toBeTruthy();
  expect(screen.getByText("5:2")).toBeTruthy();
});
```

Also extend `smoke.test.tsx`: a fresh profile sees "Open my first deck", then "Tear it open", then the reveal to "Continue", then Today on day one; after advancing the replay day, "Tear it open" again and then "Yesterday in Davos" before Today.

- [ ] **Step 2: Run.** `npm test --prefix app -- opening profile smoke` Expected: FAIL (modules and fields missing).
- [ ] **Step 3: Implement** per the interfaces and decisions above.
- [ ] **Step 4: Run everything.** `npm test --prefix app && npm run build --prefix app` Expected: all pass.
- [ ] **Step 5: Commit.** `git add -A app && git commit -m "feat(app): morning opening with welcome, gift deck, one-by-one reveal and scores recap"`

---

### Task 7: Album, card popup, flip and upgrade

**Files:**
- Create: `app/src/components/CardPopup.tsx`, `app/src/components/backLayout.ts`, `app/src/components/CardPopup.test.tsx`
- Modify: `app/src/screens/Cards.tsx`, `app/src/screens/cards.test.tsx`, `app/src/styles/app.css`
- Delete: `app/src/components/CardView.tsx` (its fallback markup now lives in `CardFront`), `PackOpen.tsx`, `PulledCards.tsx`

**Interfaces:**
- Consumes: `CardFront`, `CardLocked`, `backSrc` (Task 4); `CardReveal` (Task 6); `upgradeCard`, `openPack`, `claimSet`, `TIERS`, `UPGRADE_COST`, `PACKS`.
- Produces:
  - `<CardPopup card tier pucks onClose onFlipToBack onUpgrade={(passedQuiz: boolean) => { ok: boolean; reason?: string }} />`
  - `BACK_LAYOUT: Record<Tier, { title: Box; text1: Box; text2?: Box; visual?: Box; quiz?: Box }>` with `Box = { top: number; left: number; width: number; height: number }` in percent of the card.
  - `Cards` gains tabs "Album" (default), "Sets", "Shop"; `#/cards?tab=shop` opens the Shop tab.

Behaviour decisions:
- **Album:** line "My album · `<owned>` of `<total>`" with a progress bar; category tabs in this order with counts "Players 3/20": Players, Goalies, Teams, Moments, Rules, Game of the Day, Achievements (the "All" filter is removed). Grid of 3 columns. Owned card: `CardFront` thumb at the owned tier inside a button named "`<title>`, `<tier>`". Not owned: `CardLocked` in a non-interactive element (no button role, no handler, no hint text).
- **Popup:** `role="dialog"` `aria-label="<title>"`, dimmed backdrop, close button named "Close" (Escape and a backdrop tap also close). Shows `CardFront` size `full`. Under the front, the card's `front` lines as a caption. A button named "Flip card" toggles sides; so does a tap on the card image itself, and a horizontal swipe of more than 40 px on the card. Taps on any `button` inside the back do not flip. The first flip to the back in a popup session calls `onFlipToBack` (this keeps the daily "view a card back" task: `Cards` records `<today>:<cardId>` in `profile.flips` exactly as now).
- **Back:** `backSrc(card.category, tier)` as the background image, with absolutely positioned boxes from `BACK_LAYOUT[tier]`: `title` = card title; `text1` = `back.normal`; `text2` (Silver and above) = `back.silver`; `visual` (Gold and above) = `back.gold.text` plus `<Visual>`, or the text "Full stats are in the private build." when `card.statsHidden`; `quiz` (Diamond) = the diamond question with its four options, the correct one marked, not clickable. Text is clamped to its box (`overflow: hidden`, font size in `cqw` units so it scales with the card).
- **`BACK_LAYOUT` values:** open `app/public/cards/full/back_team_{normal,silver,gold,diamond}.webp`, measure each empty panel as percentages, and record them. Then check the same boxes against the other six categories for each tier; if a category differs, make the map `Record<CardCategory, Record<Tier, ...>>` instead. If a template has no usable empty panel, give that box a solid `--surface` background so text stays legible.
- **Upgrade:** below the card, "Upgrade to `<Tier>` · `<cost>` Pucks", disabled when Pucks are short; at Diamond show "Fully upgraded". Silver and Gold upgrade directly. Diamond first shows the quiz (question and four answer buttons, as today) in a panel below the card; a wrong answer shows "Not this time. Read the card back and try again." On success the popup stays open, the card element gets class `upgrade-burst to-<tier>` for 1000 ms (a radial glow in the new tier's colour, CSS keyframes), and the images switch to the new tier. Under `prefers-reduced-motion: reduce` the animation is `none`. A failed upgrade shows `role="alert"` "Upgrade failed: `<reason>`".
- **Shop tab:** the existing pack buttons; a purchase shows `CardReveal` (Task 6) in a dialog, with "You cannot afford that pack." unchanged.
- **Sets tab:** the existing list and claim buttons, restyled.

- [ ] **Step 1: Write the failing tests.**

```tsx
// CardPopup.test.tsx
it("flips_with_the_button_and_reports_the_first_back_view_once", () => {
  const onFlip = vi.fn();
  render(<CardPopup card={davos} tier="normal" pucks={0} onClose={() => {}} onFlipToBack={onFlip} onUpgrade={() => ({ ok: true })} />);
  expect(screen.queryByText(davos.back.normal)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
  expect(screen.getByText(davos.back.normal)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
  fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
  expect(onFlip).toHaveBeenCalledTimes(1);
});
it("back_shows_only_what_the_tier_has_earned", () => {
  render(<CardPopup card={davos} tier="silver" pucks={0} onClose={() => {}} onFlipToBack={() => {}} onUpgrade={() => ({ ok: true })} />);
  fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
  expect(screen.getByText(davos.back.silver)).toBeTruthy();
  expect(screen.queryByText(davos.back.gold.text)).toBeNull();
});
it("hidden_stats_show_the_private_build_note_at_gold", () => {
  render(<CardPopup card={{ ...davos, statsHidden: true }} tier="gold" pucks={0} onClose={() => {}} onFlipToBack={() => {}} onUpgrade={() => ({ ok: true })} />);
  fireEvent.click(screen.getByRole("button", { name: "Flip card" }));
  expect(screen.getByText("Full stats are in the private build.")).toBeTruthy();
});
it("upgrade_button_does_not_flip_the_card_and_close_closes", () => {
  const onClose = vi.fn(); const onUpgrade = vi.fn(() => ({ ok: true }));
  render(<CardPopup card={davos} tier="normal" pucks={500} onClose={onClose} onFlipToBack={() => {}} onUpgrade={onUpgrade} />);
  fireEvent.click(screen.getByRole("button", { name: /upgrade to silver · 50 pucks/i }));
  expect(onUpgrade).toHaveBeenCalledWith(false);
  expect(screen.queryByText(davos.back.normal)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(onClose).toHaveBeenCalled();
});
// cards.test.tsx (rewrite the grid and upgrade tests against the new markup)
it("album_shows_owned_fronts_and_inert_locked_cards", () => {
  render(<Harness owned={{ "team-hc-davos": { tier: "normal", copies: 1 } }} />);
  fireEvent.click(screen.getByRole("button", { name: /teams 1\/6/i }));
  expect(screen.getByRole("button", { name: "HC Davos, normal" })).toBeTruthy();
  const locked = screen.getAllByAltText("Locked card");
  expect(locked).toHaveLength(5);
  fireEvent.click(locked[0]);
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("upgrading_in_the_popup_switches_the_image_to_the_new_tier", () => {
  render(<Harness owned={{ "team-hc-davos": { tier: "normal", copies: 1 } }} pucks={500} />);
  fireEvent.click(screen.getByRole("button", { name: /teams/i }));
  fireEvent.click(screen.getByRole("button", { name: "HC Davos, normal" }));
  fireEvent.click(screen.getByRole("button", { name: /upgrade to silver/i }));
  const img = within(screen.getByRole("dialog")).getByRole("img") as HTMLImageElement;
  expect(img.src).toMatch(/front_team_hc-davos_silver\.webp$/);
});
```

Keep the existing shop, set-claim and diamond-quiz tests, adapted to the tabs (open the Shop or Sets tab first; the pack result is asserted through the reveal's "1 of 3").

- [ ] **Step 2: Run.** `npm test --prefix app -- CardPopup cards` Expected: FAIL.
- [ ] **Step 3: Implement** the popup, the layout map and the Cards rewrite.
- [ ] **Step 4: Measure `BACK_LAYOUT`** as described and check all 28 templates in the browser (`npm run dev --prefix app`, open a card of each category at each tier; use the replay bar and Pucks to upgrade, or temporarily seed a profile in `localStorage`). Text must sit inside the panels on a 375 px wide viewport.
- [ ] **Step 5: Run everything.** `npm test --prefix app && npm run build --prefix app` Expected: all pass.
- [ ] **Step 6: Commit.** `git add -A app && git commit -m "feat(app): image album, card popup with flip, back overlay and upgrade effect"`

---

### Task 8: Restyle the remaining screens, offline cache, wording and docs

**Files:**
- Modify: `app/src/styles/app.css`, `app/public/sw.js`, `app/src/pwa.ts`, `README.md`, `docs/data-notes.md`, `docs/submission/summary.md`, `docs/submission/slides-outline.md`, `docs/submission/video-script.md`, `.github/workflows/pages.yml` (comment only), `scripts/check_public.sh`
- Test: `app/src/smoke.test.tsx`

**Interfaces:**
- Consumes: everything above. Produces nothing for later tasks.

- [ ] **Step 1: Restyle Quiz, Predict and Tasks** in CSS only (no markup or logic change beyond class names): surfaces `#101d33`, gold primary buttons, green and red reveal borders, answer options as full-width surface buttons, market cards and task rows as surface panels, replay bar as a thin dark strip with gold text. Remove the now unused `.door*`, `.doors`, `.pulled`, `.silhouette` rules.
- [ ] **Step 2: Service worker.** In `app/public/sw.js`: cache name `the-spengler-cup-v2`; on `activate` delete every other cache; requests whose path contains `/cards/` or `/art/` are served cache-first (fetch and store on a miss); everything else stays network-first as now.
- [ ] **Step 3: Wording.** Notification text in `pwa.ts`: "Your new deck is ready. Come and open it." Update README, summary, slides outline and video script to the new concept (collect cards, quizzes, predictions, learn hockey; morning gift deck in place of the door; games carousel; image cards). In `README.md` and `docs/data-notes.md` state the organizers' rule in one sentence ("The confidential Spengler Cup dataset is not in this repository") and that the hosted demo shows real card names and images with dataset statistics hidden. `scripts/check_public.sh` already allows images under `app/public/`; add one line that fails on any tracked file under `spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE`.
- [ ] **Step 4: Verify no advent wording remains.**

Run: `grep -rniE "advent|\bdoors?\b|calendar" app/src app/index.html app/public/manifest.webmanifest app/public/sw.js README.md docs/submission docs/data-notes.md | grep -vE "claimedDoors|claimDoor|DOOR_XP|game/calendar|from \"\./calendar\"|from \"\.\./game/calendar\"|\.test\."`
Expected: no output. (Identifiers and the `game/calendar.ts` module name are internal and stay.)

- [ ] **Step 5: Full verification.**

Run: `.venv/bin/pytest -q && npm test --prefix app && npm run build --prefix app && bash scripts/check_public.sh`
Expected: all pass; `check_public: ok`.

- [ ] **Step 6: Demo-build check.** `bash scripts/build_data.sh --demo && npm run build --prefix app`, then serve `app/dist` (`npm run preview --prefix app`) and walk through: welcome, tear open, three cards, Today, carousel back and forward, album, popup, flip, upgrade, quiz, predict. Confirm a player card back at Gold shows the private-build note. Then `bash scripts/build_data.sh` to restore the real local data and repeat the popup check for a real shot map.
- [ ] **Step 7: Phone pass.** Open the preview on a real phone (same Wi-Fi, `npm run preview --prefix app -- --host`): swipe the carousel, swipe to flip, check the popup fits the screen and the bottom bar clears the home indicator. Record anything that fails in the PR description.
- [ ] **Step 8: Commit and open the PR.**

```bash
git add -A
git commit -m "feat: restyle remaining screens, cache card images, update wording and docs"
git push -u origin feat/the-spengler-cup-ui
gh pr create --base main --title "The Spengler Cup: new look, card images and morning opening"
```
PR body: summary, test results, the phone-pass notes, and the open items below.

## Open items for Eduardo (not blocking)

- The image pack is still a "QA candidate": names and scores on all 259 images need a human proofread.
- Confirm with the organizers that the trophy poster may be published.
- `content/cards_public.yaml` assumes the turning-point goal's team; Task 2 Step 3 checks it against the local build.
