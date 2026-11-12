# The Spengler Cup: new look and feel

Date: 2026-11-12. Status: draft for Eduardo's approval.

Lines marked **(decided)** come from Eduardo. Lines marked **(my call)** are the author's defaults and can be overruled.

## Intent

The app stops being an advent calendar. It becomes **The Spengler Cup**: an app to collect Spengler Cup cards, do quizzes, make predictions, and learn about hockey and the cup's games **(decided)**. The cards are now real images in the style of premium hockey trading cards, and the whole app takes its look from them.

Why now: the team has 259 generated card images and wants the prototype, the hosted demo and the demo video (due 2026-11-14) to show them.

## Goals

1. A morning opening that feels like a gift: welcome, a new deck, yesterday's scores, then the main window.
2. Cards shown as images everywhere: reveal, album, popup with a flip to the back.
3. One consistent dark theme taken from the card prompt (`docs/design/cards-image-prompt.md`).
4. No reference to "advent", "door" or "calendar" anywhere a user, judge or reader of the submission sees it.
5. The hosted demo shows the real card images **(decided)**, with no confidential dataset content.

## Non-goals

- No change to how the quiz, predictions or tasks work, or to the economy (Pucks, XP, pack prices, upgrade costs) **(decided: keep them as they are for now)**. They only get the new look.
- No Social features, no live mode, no new card content.
- No final visual sign-off of the images. The pack is a "QA candidate"; proofreading names and scores on all 259 images stays with the team.

## Anti-goals

- Any leftover advent or door wording.
- An app that is slow to open on a phone because of image weight.
- Text on a card back that visibly misses the template's panels.
- Tapping a locked card doing anything.

## Screens

Mockups from the brainstorm are in `.superpowers/brainstorm/28996-1794437986/content/` (`opening-flow-v2.html`, `album.html`); they are flow sketches, not pixel specifications.

### Opening sequence

Runs when the app opens, in this order. Each step has one button to continue.

1. **Welcome** (first ever open only) **(decided)**. The trophy poster image (`davos_spengler_cup_trophy_poster.png`) as the hero above the title "The Spengler Cup", two short lines about the tournament, and a button "Open my first deck".
2. **Gift deck** (once per day, when today's deck has not been collected) **(decided)**. The wrapper image (`spengler_cup_2025_card_deck.png`) in the centre, "3 cards inside", button "Tear it open". This is the existing free daily pack and the existing daily claim; only the presentation changes **(my call)**. It becomes available at 08:00 Europe/Zurich, as the door did **(my call)**. Before 08:00, or once collected, the step is skipped.
3. **Cards one by one** **(decided)**. After the tear, one card fills the screen at a time. A tap on the card or a "Next card" button shows the following one. Shows a counter ("2 of 3") and a "New" or "Duplicate" tag, with the Pucks paid for a duplicate **(my call)**. After the last card the button reads "Continue".
4. **Yesterday's scores** (from the second tournament day, once per day) **(decided)**. The final scores of yesterday's games. It also shows how the user's predictions on those games settled and the Pucks won **(my call)**; this replaces the separate settlement sheet shown on day change today. Button "See today".
5. Lands on **Today**.

A user who quits mid-sequence resumes at the first step not yet completed **(my call)**.

### Today (main window)

- Header: app title on the left; Pucks and streak chips on the right, same height, on one line **(decided)**.
- **Games carousel** **(decided)**: one tournament day per page, moved with a swipe or with back and forward arrows, with one dot per tournament day. Opens on the current day. Past days show final scores; today and future days show start times. Arrows are disabled at the first and last day.
- **Win Pucks and cards**: tiles for Daily quiz, Predict, Tasks and the card shop, each with a one-line status (for example "5 questions", "2 of 3 done") **(my call on the exact tiles)**.
- Bottom bar: **Today, Cards, Quiz, Predict** **(my call)**. Tasks is reached from its tile.

### Cards (album)

- Progress line ("3 of 56") and category tabs with per-category counts.
- Grid of all cards of the category. A card the user owns shows its front image at the tier the user has reached. A card the user does not own shows the category's locked image **(decided)**. Tapping a locked card does nothing **(decided)**.
- Sets and the card shop stay in this area as their own tabs, restyled only **(my call)**.

### Card popup

- Tapping an owned card enlarges it over the dimmed album, with a close button **(decided)**.
- A swipe or a tap flips it to the back, and again to the front **(decided)**. The flip tap must not fire when the user presses a control on the back (upgrade button, quiz answers); a visible flip button is also provided **(my call)**.
- **Front:** the image as it is. Lines that are not printed on the image (box-score lines of the 13 final players) appear as a caption under the card **(my call)**.
- **Back:** the back template image for the card's category and current tier, with the app drawing the content on top: card title in the header strip, the Normal text, the Silver text (Silver and above), the Gold visual (Gold and above), the Diamond quiz (Diamond). The upgrade button sits below the card.
- **Upgrade** **(decided)**: a flashy effect in the colour of the new tier (silver, gold, cyan), then the card's images switch to the new tier while the popup stays open. About one second; replaced by a plain swap when the device asks for reduced motion **(my call)**.

### Quiz, Predict, Tasks

Same behaviour and content as now. Restyled with the theme below.

## Theme

Dark only **(my call)**: the card images are designed for a dark surface, and one theme halves the styling work before the deadline.

- Background `#07111f`, surfaces `#101d33`, borders `#22334f`, text `#eaf0fb`, muted text `#94a3bd`.
- Blues `#07285f`, `#0b3d91`, `#2f6fdb`; gold `#d4a017` for primary buttons and highlights; red `#c8102e` sparingly; green `#1e8e4e` for correct or won.
- Tier colours: Normal `#8a94a6`, Silver `#aab4c4`, Gold `#d4a017`, Diamond `#4fc3f7`.
- Category colours as in the image prompt (Player blue, Goalie teal, Team indigo, Moment red, Rules slate, Game of the Day green, Achievement violet).
- System sans-serif font, bold tight headings, small-caps labels, 14 px radius, a faint alpine ridge and snow motif used sparingly.

## Removing advent

- Delete the Door component, the Calendar screen and the `#/calendar` route.
- Replace user-facing wording: "door" becomes "today's deck"; the reminder notification, README, project summary, slides outline and video script are updated to the new concept.
- Stored profile fields keep their current names (for example `claimedDoors`) so existing profiles keep working; only what the user reads changes **(my call)**.
- The old spec and plan under `docs/superpowers/` stay as history.

## Images

Source: `spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE/assets/`: 224 fronts (`front_<category>_<card>_<tier>.png`), 28 backs (`back_<category>_<tier>.png`), 7 locked (`locked_<category>.png`), all 1024×1536 PNG, 331 MB in total. Plus the trophy poster and the deck wrapper in the repo root.

- The originals are too heavy for a phone. A script converts them to WebP in two sizes, a grid thumbnail (about 320 px wide) and a popup size (about 768 px wide), into `app/public/cards/`. Target: the whole converted set under about 40 MB, a thumbnail under about 40 KB **(my call)**.
- The converted images are committed to the public repo and shipped in the hosted demo **(decided: upload the images for demo purposes)**. The 331 MB originals, the zip and the root-level `manifest.json` stay out of git **(my call)**.
- Images load lazily; the service worker caches each image when first viewed, so the app does not download the whole set on install **(my call)**.
- Each catalog card must resolve to its image files. Card ids and file names differ (`gotd-2025-12-26` vs `game-of-the-day_team-canada-vs-us-collegiate-selects`, `rule-…` vs `rules-and-concepts_…`, `ach-streak3` vs `achievement_three-in-a-row`), so an explicit mapping is needed. A test must prove every card has a front in all four tiers and every category has four backs and a locked image.
- If an image is missing or fails to load, the app falls back to today's typographic card.
- `scripts/check_public.sh` currently rejects tracked PNGs outside allowed directories; it needs a rule for `app/public/cards/`.

## Left to the builder

- Exact positions of the text, visual and quiz panels on the back templates. The author has not looked inside the images. The 28 backs are reported as standardised, so one set of positions, in percentages of the card, should serve all; verify by eye on each category and tier.
- The upgrade and tear-open animations (CSS only, no new dependency preferred).
- The carousel mechanics (CSS scroll snapping is enough).
- Where the app gets the game schedule for the carousel. `content/edition2025.yaml` has all 11 games with dates, start times and period scores and is tracked, so it can feed both the real and the demo build.
- The conversion tool (the Mac's `sips` may not write WebP).
- How the opening sequence remembers which steps were seen (a small addition to the stored profile, tolerant of older profiles).

## Testing

- Existing tests keep passing after the Door and Calendar removal (tests that cover them are removed or rewritten).
- New tests: the order and once-only rules of the opening sequence; the one-by-one reveal; the carousel's past and future days; locked cards ignoring taps; flip not triggering on back controls; upgrade switching the tier image; image mapping completeness.
- A manual pass on a real phone for the popup, flip and carousel gestures.

## Data in the hosted demo

The organizers have stated the rule: **keep the confidential Spengler Cup dataset out of the public repository** **(decided, organizers' instruction, 2026-11-12)**. This overrides the earlier "show real stats" choice.

- Nothing derived from the dataset is committed or hosted: no box-score lines, save percentages, shot maps, expected goals, win-probability timelines, or quiz questions and markets built from the dataset. `app/public/data/` stays out of git, as now.
- The card images are committed and hosted **(decided: upload the images for demo purposes)**. They carry names, teams, jersey numbers, final scores and title counts, which are public facts, and no dataset statistics **(my call that this is within the rule; the team should confirm with the organizers if unsure)**.
- The hosted demo shows the real card list so that it matches its images **(my call)**: a small hand-written public catalog (title, team, category, rarity, the public front lines, and non-statistical back texts) is committed under `content/`. In the hosted build the Gold visual and any statistic are left out, and a back shows a short "Full stats in the private build" note in their place. The Diamond quiz appears only where its question is not derived from the dataset.
- The local build, made from the raw files, keeps the full backs. This is the build to record for the demo video only if the organizers allow dataset content in the video; otherwise record the hosted build.
- Quizzes and predictions in the hosted demo keep using the made-up demo data, so player names there will not match the cards. Accepted for the preliminary phase **(my call)**.
- `scripts/check_public.sh` gets a rule allowing images only under `app/public/cards/` and keeps rejecting `app/public/data/`.

## Risks

- The official trophy image and any cup logo belong to the organizers; confirm they may be used in the app and the public repo.
- The image pack is not signed off: a misspelt name on an image is baked in and needs regenerating, not a code fix.
- Grey area: which players got a card, and their rarities, were chosen using the dataset. The names themselves are public, but the selection is dataset-informed.
- `content/edition2025.yaml` (scores typed from the organizers' event report) is tracked. Final scores are public, but the file's source is an organizer document.
- Time: the preliminary deadline is 2026-11-14.
