# ChatGPT prompt: card image assets for The Spengler Cup

Paste everything below the line into ChatGPT (image generation). Work in the order given in section 9, one batch per message.

How the app will use the images: fronts are full card images shown as-is. Backs are **templates**: the app overlays the live text, data visuals and quiz on top, because they change with the user's tier and must stay accurate and tappable. That is why the backs have empty content panels (details in section 6).

Data note: this lists real player names from the local build. Check the organizers' data terms before committing generated images to the public repo.

---

You are a senior trading-card designer. Create the **final card image assets** for a mobile app called **The Spengler Cup**, a daily companion for the Spengler Cup ice hockey tournament in Davos, Switzerland (26 to 31 December). Users collect cards. The cards must look and feel like **premium hockey trading cards in the style of Upper Deck** (Young Guns, SP Authentic, Series 1): glossy, full-bleed action-style artwork on the front, a bold name bar, foil accents, a framed back with a bio and a stats table. They must be **original designs**: do not use the Upper Deck name, logo or layout trademarks, and no real club crests, league logos, sponsors or real faces.

## 1. Deliverables

1. **Fronts:** one image per card per tier. 56 cards × 4 tiers = 224 fronts.
2. **Back templates:** one image per category per tier. 7 categories × 4 tiers = 28 backs. Backs are templates with empty panels (section 6), identical in structure for every card of a category.
3. **Locked card:** one generic "locked" front per category (7 images) used when the user does not own the card yet.

Format: **portrait PNG, 1024×1536**, card artwork filling the whole image, rounded corners (about 4 percent) on a **transparent** background if possible, otherwise on a plain `#07111f` background. Keep all important content inside a **6 percent safe margin**. Fronts must be readable at 160 px wide.

## 2. The design system (apply identically to every card)

### Layers of a front, bottom to top
1. **Art layer:** full-bleed illustration (section 4 gives the art style per category).
2. **Frame layer:** the border, determined by **tier** (section 3).
3. **Name bar:** a bold angled bar in the lower third with the card title in large type, in the **category colour** (section 5).
4. **Info strip:** under the name bar, 1 to 3 short lines in smaller type.
5. **Header label:** top-left, a small caps category label with a small category icon.
6. **Rarity mark:** top-right, a small emblem plus the word (section 3).
7. **Footer:** bottom, small text "THE SPENGLER CUP · 2025" centred, plus a faint alpine ridge line.

The positions, sizes and typography of layers 3 to 7 are **identical on every card**. Only the colours (tier frame, category colour) and the content change.

### Typography
One geometric sans-serif (Inter-like). Title in bold, uppercase, slightly condensed spacing, about 56 to 64 px; info lines regular, 28 to 32 px, tabular numbers. Category label in small caps, 22 px, letter-spaced.

### Motifs
Snowflake crystals, a faint alpine ridge line, rink markings (blue lines, faceoff circles), a puck. Low contrast, never behind text without a darkening gradient.

## 3. Tier and rarity (two separate things, shown separately)

**Tier = the frame material.** It is the same four looks for all categories, so the user sees an upgrade at a glance. The tier look changes only the frame, the foil accents and the sheen; layout stays identical.
- **Normal:** matte slate-grey `#8a94a6` thin frame, flat finish, no foil.
- **Silver:** brushed metallic silver `#aab4c4` frame, subtle diagonal light sweep, small silver foil stripe on the name bar.
- **Gold:** polished gold `#d4a017` frame (deep `#b8860b`, pale `#fbf1d0` highlights), gold foil lines on the name bar and corners, warm sheen.
- **Diamond:** cyan `#4fc3f7` faceted crystal frame, prismatic holographic rainbow sheen across the art, sparkle accents, the most premium look.

**Rarity = how special the card is** (fixed per card). Shown only as the top-right emblem and word, plus a faint glow behind the emblem; it does **not** change the frame:
- **Common:** grey circle emblem.
- **Rare:** blue `#2f6fdb` diamond emblem.
- **Epic:** violet `#6a4fdb` hexagon emblem.
- **Legendary:** gold star emblem with a small crown.

Also draw a small **tier badge** at the bottom-left of the front (a round medallion: N, S, G or D in the tier material) so tier is readable in thumbnails.

## 4. Art style per category (consistent within a category)

Overall rendering: stylised semi-realistic vector illustration with glossy lighting, strong rim light, subtle motion blur, depth-of-field, and a cool winter colour grade with warm rink-light highlights. Abstract and faceless; people appear as **silhouettes** or from behind, jersey number readable, never with a face.

| Category | Art treatment |
|---|---|
| Player | Dramatic action silhouette of a skater mid-shot or mid-stride, seen from behind or three-quarter, big jersey number on the back in the team colours, spray of ice, arena lights. Same camera angle and framing on every player card. |
| Goalie | Silhouette of a goalie in a deep stance, mask in focus without a face, blocker raised, puck streaking in. Net frame behind. Same framing on both. |
| Team | Large abstract monogram shield (initials) in the team colours, centred, over a rink-line pattern and snowy ridge. Same shield shape for every team. |
| Moment | Single cinematic glyph scene: goal light, trophy, clock, or puck hitting the net, with strong light beams. Same composition (centred hero object, radiating light). |
| Rules and concepts | Clean top-down rink diagram highlighting the rule (for example the offside line, the icing lane) in white and blue line art on an ice-tint gradient. Instructional, minimal. |
| Game of the Day | A stadium-scoreboard scene with the two team monograms, the score in huge numerals and the date. Same scoreboard shape on every card. |
| Achievement | A medal or badge in gold and cyan on a rink-ice background, with a small icon of the achievement. |

Team colours (jerseys and monograms only): HC Davos yellow `#f2c500` and dark blue; U.S. Collegiate Selects navy `#14274e` with red and white; Team Canada red `#d52b1e` and white; HC Sparta Praha red `#a6192e` and dark navy; HC Fribourg-Gottéron black and white with dark red; IFK Helsinki red `#c8102e` and white.

## 5. Category colour (the name bar and icon colour)

| Category | Colour |
|---|---|
| Player | blue `#2f6fdb` |
| Goalie | teal `#12a4a0` |
| Team | indigo `#4b4bb8` |
| Moment | red `#c8102e` |
| Rules and concepts | slate `#5b6a85` |
| Game of the Day | green `#1e8e4e` |
| Achievement | violet `#8a4fd6` |

Players, goalies and teams use the **team colours** in the art, but the name bar always stays in the category colour so categories stay recognisable.

## 6. Back templates (28 images)

All backs of one category share the same layout; tier changes only the frame, as on the fronts. Do **not** write any card-specific text: leave the panels empty so the app can fill them.

Layout, top to bottom, inside the tier frame, on a deep-blue `#07285f` to `#07111f` vertical gradient with faint snowflakes and ridge line:
1. **Header band** in the category colour, with the category label and icon (static text, same as the front). Leave a blank strip for the app to put the card title.
2. **Tier ladder:** four small medallions N, S, G, D, with those reached by this tier lit and the rest dimmed.
3. **Text panel:** a rounded frosted-glass rectangle, empty. (Normal and above.)
4. **Second text panel:** (Silver and above.) Same style, empty, below the first.
5. **Visual panel:** a larger rounded rectangle for a chart, empty, with a faint rink-diagram watermark. (Gold and above.)
6. **Quiz panel:** a rounded rectangle with four empty rounded answer-button outlines. (Diamond only.)
7. **Footer:** attribution line "Data: Spengler Cup 2025 · Wikipedia (CC BY-SA)" in tiny type, Gold and Diamond only; the small THE SPENGLER CUP wordmark on all.

Panels not available at a tier are simply absent on that tier's template (Normal has panels 1 to 3 only; Silver adds panel 4; Gold adds panel 5; Diamond adds panel 6). Make the back templates for the same tier visually consistent across all seven categories except for the category colour.

## 7. The cards (fronts)

Write each card exactly as given. Each front shows: the category label, the rarity mark, the art, the title, the info lines, the tier badge, the footer. Generate the 4 tier versions of each front from the **same art** with only the frame, foil and sheen changed.

### PLAYER (20)
Info lines are `#number · Team` then a stat line. For the first 13 the stat lines are not shown on the image (the app overlays them live); show only `#number · Team`. For the key players show `#number · Team` and `Key player`.
1. Aiden Fink, U.S. Collegiate Selects, Legendary, #18
2. Valentin Nussbaumer, HC Davos, Epic, #66
3. Tino Kessler, HC Davos, Epic, #72
4. Ryan Walsh, U.S. Collegiate Selects, Epic, #21
5. Chris Egli, HC Davos, Rare, #96
6. Cole Knuble, U.S. Collegiate Selects, Rare, #22
7. Matej Stransky, HC Davos, Rare, #44
8. Quinn Finley, U.S. Collegiate Selects, Rare, #19
9. Adam Tambellini, HC Davos, Rare, #19
10. Rasmus Asplund, HC Davos, Rare, #74
11. Gavin McCartthy, U.S. Collegiate Selects, Common, #2
12. Sven Jung, HC Davos, Common, #90
13. Matt Dimarsico, U.S. Collegiate Selects, Common, #14
14. Attilio Biasca, HC Fribourg-Gottéron, Rare, #17, Key player
15. Filip Chlapík, HC Sparta Praha, Rare, #14, Key player
16. Derek Grant, Team Canada, Rare, #27, Key player
17. Eric Schneller, IFK Helsinki, Rare, #65, Key player
18. Aaron Irving, HC Sparta Praha, Rare, #24, Key player
19. Marcus Sörensen, HC Fribourg-Gottéron, Rare, #9, Key player
20. Niko Hovinen, IFK Helsinki, Rare, #92, Key player

### GOALIE (2, both Epic)
1. Adam Gajan, U.S. Collegiate Selects, info: `Goalie · U.S. Collegiate Selects`
2. Sandro Aeschlimann, HC Davos, info: `Goalie · HC Davos`

### TEAM (6)
1. HC Davos, Legendary, `Group B`, `17 titles`
2. Team Canada, Legendary, `Group B`, `16 titles`
3. HC Sparta Praha, Epic, `Group A`, `2 titles`
4. HC Fribourg-Gottéron, Rare, `Group A`, `1 title`
5. IFK Helsinki, Common, `Group A`, `0 titles`
6. U.S. Collegiate Selects, Common, `Group B`, `0 titles`

### MOMENT (8)
1. The turning point, Epic, `2025 Final · Period 3 · 15:21`
2. Adam Tambellini scores 2, Rare, `2025 Final · HC Davos`
3. First blood, Rare, `2025 Final · Period 1 · 11:15`
4. The last word, Rare, `2025 Final · Period 3 · 17:49`
5. Where it began, Epic, `1923`
6. A shared trophy, Rare, `1932`
7. Decided by a shootout, Rare, `2018`
8. The first college team, Epic, `2025`

### RULES AND CONCEPTS (8, all Common, info line: `Rules and concepts`)
Icing, Offside, Power play, High-sticking, Faceoff, Assist, Expected goals (xG), The blue lines.

### GAME OF THE DAY (6)
Title is the match-up; info lines are `date · stage` and the score.
1. Team Canada vs U.S. Collegiate Selects, Rare, `26 Dec · Group stage`, `3:2`
2. HC Davos vs U.S. Collegiate Selects, Rare, `27 Dec · Group stage`, `3:5`
3. HC Fribourg-Gottéron vs IFK Helsinki, Rare, `28 Dec · Group stage`, `4:3`
4. HC Davos vs IFK Helsinki, Rare, `29 Dec · Semi-final qualification`, `3:0`
5. U.S. Collegiate Selects vs HC Sparta Praha, Epic, `30 Dec · Semi-final`, `5:3`
6. U.S. Collegiate Selects vs HC Davos, Legendary, `31 Dec · Final`, `3:6`

### ACHIEVEMENT (6, all Epic)
1. Three in a row: `Open the app three days in a row`
2. Perfect day: `Answer all five daily questions correctly`
3. Called it: `Win your first prediction`
4. On a roll: `Win three predictions`
5. Level up: `Upgrade a card for the first time`
6. Set complete: `Claim your first complete set`

## 8. Locked card (7 images, one per category)
Same layout as the front, Normal tier frame, the art replaced by a dark silhouette on a dark gradient with a large "?" and the category colour name bar saying "LOCKED". No card text, no rarity mark.

## 9. Order of work and quality checks

1. **Calibrate first.** Produce for **Category TEAM**: the HC Davos front in all four tiers side by side, then the TEAM back template in all four tiers side by side. Stop and wait for my feedback. Do not continue until I approve the system.
2. Then, one category per message, in this order: TEAM, PLAYER, GOALIE, MOMENT, GAME OF THE DAY, RULES AND CONCEPTS, ACHIEVEMENT. For each: all fronts at Normal tier first as a contact sheet, then the other three tiers once approved.
3. After each batch, list the file names using this pattern: `front_<category>_<card-slug>_<tier>.png`, `back_<category>_<tier>.png`, `locked_<category>.png`.

Quality rules:
- Spelling exactly as given, including diacritics (Chlapík, Sörensen).
- Layers 3 to 7 are in the same position on every card, to the pixel.
- Tier is distinguishable at 160 px wide; rarity emblem too.
- No faces, no real logos or crests, no sponsor names, no copyright imagery.
- Do not invent extra text, scores or stats. If an image generator garbles text, tell me which cards need a text fix instead of silently shipping them.
