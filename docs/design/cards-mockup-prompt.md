# ChatGPT prompt: The Spengler Cup card mockups

Paste everything below the line into ChatGPT (image generation / GPT-Image). Ask for one category per message if the output gets crowded; the prompt is written so you can say "do category 3 now".

Note: this contains the real-data card names from the local build (player names and stats come from the organizers' data). Keep this file out of any public material if the data terms require it; the card names themselves are public event facts.

---

You are a senior mobile game/UI designer. Design **trading-card mockups** for a mobile app called **The Spengler Cup**: a daily-ritual companion for the real Spengler Cup, the ice hockey tournament in Davos, Switzerland, held from 26 to 31 December. Users open one "door" per day like an advent calendar, answer hockey questions, make play-money predictions, and **collect cards**.

## 1. What to produce

For **every card listed in section 6**, produce:
1. **FRONT**: one mockup.
2. **BACKS**: four mockups, one per tier (Normal, Silver, Gold, Diamond).

That is 56 fronts and 224 backs. Work **one category at a time**, starting with the category I name. For each category first produce a **design sheet**: a grid of all fronts of that category at the same scale, so I can judge consistency. Then produce the backs for one representative card per category (all four tiers side by side). When I say "all backs for X", produce them for the full list.

Output as **PNG images at 5:7 portrait ratio** (card size 750×1050 px), flat vector-like illustration style, readable at phone size (cards show about 160 px wide in a grid and about 340 px wide when opened). Use real text, not lorem ipsum, and keep every text legible. No photos of real people, no real logos, no copyrighted club crests: use abstract, original graphics (see section 3).

## 2. Theme and mood

- **Feel:** Swiss alpine winter, festive but crisp. Think premium Swiss sports-brand meets friendly advent calendar. Clean, modern, confident, a bit warm. Not cartoonish, not gritty.
- **Palette (use these exact colours):**
  - Primary deep blue `#0b3d91`, darkest blue `#07285f`, bright blue `#2f6fdb`, ice tint `#e3edfc`
  - Gold accent `#d4a017` (deep gold `#b8860b`, pale gold `#fbf1d0`)
  - Red accent `#c8102e` (Swiss red, use sparingly)
  - Success green `#1e8e4e`
  - Neutrals: light background `#f6f8fc`, white `#ffffff`, text `#0e1a2f`, muted text `#5b6a85`, border `#d6deec`
  - Dark theme variants: background `#07111f`, surface `#101d33`, text `#eaf0fb`. **Produce all cards on the dark surface by default**; show one light-theme version of one card per category as an alternate.
- **Tier colours:** Normal `#8a94a6` (grey), Silver `#aab4c4` (cool metallic), Gold `#d4a017`, Diamond `#4fc3f7` (icy cyan with a subtle faceted shimmer).
- **Typography:** one clean geometric sans-serif (like Inter or the system font). Bold, tight headlines; small caps for labels. Tabular numbers for stats.
- **Motifs:** snow crystals, a subtle alpine ridge line, ice-rink line markings (blue lines, faceoff circles), small advent-door shapes, a puck. Keep decorative elements low-contrast so text stays dominant.
- **Corner radius:** 14 px on cards, rounded chips.

## 3. Card system rules

**Rarity** (shown on the front as border and glow; a card has exactly one rarity):
- **Common:** thin neutral grey border, flat background, no glow.
- **Rare:** blue border `#2f6fdb`, soft blue glow, ice-blue corner flourish.
- **Epic:** violet-blue border (a purple-leaning blue, e.g. `#6a4fdb`), stronger glow, subtle foil sheen.
- **Legendary:** gold border `#d4a017`, warm glow, gold foil highlights and a small crown/star mark.

**Tier** (how upgraded the user's copy is; every card has four tiers, and the user starts at Normal and pays Pucks to upgrade). Tier is shown as a **badge** on the front and as the **frame treatment** of the back:
- **Normal:** plain frame.
- **Silver:** metallic silver inner frame.
- **Gold:** gold inner frame plus a visual panel (see back layouts).
- **Diamond:** cyan faceted frame with sparkle, plus a quiz block.

**Card states** (design these for one card per category):
- **Owned:** full colour.
- **Unowned / locked:** dark silhouette with a "?" and a one-line hint ("Unlocks 28 Dec" or "Win a prediction").

**Imagery without photos or logos:** each category has its own **art motif**, drawn as an abstract illustration in the top half of the front (see per-category notes). For people, use a **stylised number-on-jersey emblem** (a big jersey number on a simple jersey silhouette in the team colour), never a face. For teams, use an **abstract monogram shield** (initials in a shield shape), not a real crest.

**Team colours** (jersey and monogram only):
- HC Davos: yellow `#f2c500` and dark blue
- U.S. Collegiate Selects: navy `#14274e` with red and white
- Team Canada: red `#d52b1e` and white
- HC Sparta Praha: red `#a6192e` and dark navy
- HC Fribourg-Gottéron: black and white with a dark red accent
- IFK Helsinki: red `#c8102e` and white

## 4. Static versus dynamic fields

**STATIC** = designed once, identical on every card. **DYNAMIC** = filled in by the app at runtime from data; in the mockup show realistic sample values, and mark each dynamic field with a small **orange dashed outline** and a tiny tag (for example `{title}`) on the **annotated version** only. Produce each design sheet twice: once clean, once annotated.

### FRONT

| Element | Type | Notes |
|---|---|---|
| Card frame, background pattern, corner radius | Static | Per rarity |
| Category label ("PLAYER", "GOALIE", "TEAM", "MOMENT", "RULES AND CONCEPTS", "GAME OF THE DAY", "ACHIEVEMENT") | Dynamic | Text per category; small caps, top-left, with a small category icon (static per category) |
| Rarity name and rarity styling (border, glow, foil) | Dynamic | Common, Rare, Epic or Legendary |
| Tier badge (Normal, Silver, Gold, Diamond) | Dynamic | Top-right; changes with the user's upgrades |
| Art panel (jersey emblem, shield monogram, icon) | Dynamic | Illustration pattern is static per category; the number, initials, team colours and icon are dynamic |
| Title (player name, team name, moment name) | Dynamic | Max about 26 characters, 1 or 2 lines, bold |
| Info lines (1 to 3 short lines) | Dynamic | Examples: `#18 · U.S. Collegiate Selects`, `1G 1A`, `16 min`, `Group B`, `17 titles` |
| Team colour accent stripe | Dynamic | Only if the card has a team |
| Collection number / small footer ("The Spengler Cup · 2025 edition") | Static | Footer text static, no number needed |
| Unowned silhouette, "?" and hint line | Dynamic | The hint text is dynamic |

### BACK (same structure on all tiers; extra sections appear as the tier rises)

| Element | Type | Appears at |
|---|---|---|
| Frame (plain, silver, gold, cyan faceted) | Static per tier | All |
| Small header strip: card title and rarity chip | Dynamic | All |
| Tier ladder (four dots, current tier highlighted) | Static graphic, dynamic highlight | All |
| **Normal text**: 1 to 2 short sentences of context (about 140 characters) | Dynamic | All tiers |
| **Silver text**: a longer paragraph (about 280 characters) with a deeper fact | Dynamic | Silver and above |
| **Gold visual panel** (see below) plus 1 to 2 sentences of caption | Dynamic | Gold and above |
| **Diamond quiz**: question (one line), 4 answer buttons, correct one highlighted green after answering | Dynamic | Diamond only |
| Upgrade button ("Upgrade to Silver: 50 Pucks", "to Gold: 150", "to Diamond: 400") | Static layout, dynamic label and price | All except Diamond |
| Data attribution line: "Data: Spengler Cup 2025 · Wikipedia (CC BY-SA)" | Static | Gold and above |

**Gold visual panel types** (the back of every Gold card has one; the type depends on the card, listed per card in section 6):
- **Shot map:** a top-down half-rink outline (goal at the top, blue line, two faceoff circles) with dots for shot locations; goals shown as filled gold dots, saved or missed shots as hollow dots, coloured by team. Include a small legend.
- **Timeline:** a horizontal win-probability line chart across three periods (period dividers at 20:00 and 40:00), with a marker for the key moment and its time label.
- **Table:** a compact 2-column or 3-column fact table (3 to 5 rows, label on the left in muted text, value on the right in bold).

## 5. Set the stage: layout of one front

Top to bottom, inside the frame: header row (category label left, tier badge right), art panel (about 55 percent of the card height), title, up to three info lines, thin footer. Leave a safe margin of 6 percent on all sides. The rarity effect hugs the border only; it must not reduce text contrast.

## 6. The full card list

Format: **Title**, team, rarity, front info lines. For each, the back text and gold visual type are given where fixed; other text you may write yourself in a factual, friendly tone (2 sentences for Normal, a short paragraph for Silver, a caption for Gold, a 4-option question for Diamond). Never invent specific scores or stats beyond those given; if you need a number, use the one listed or leave a clearly generic phrase.

### Category 1: PLAYER (20 cards). Art: jersey with the player's number, in the team's colours.

Final stars (front lines: `#number · Team`, `goals G assists A`, `minutes min`; Gold visual: shot map unless stated):
1. **Aiden Fink**, U.S. Collegiate Selects, **Legendary**, #18
2. **Valentin Nussbaumer**, HC Davos, Epic, #66
3. **Tino Kessler**, HC Davos, Epic, #72 (Gold visual: **table**)
4. **Ryan Walsh**, U.S. Collegiate Selects, Epic, #21
5. **Chris Egli**, HC Davos, Rare, #96
6. **Cole Knuble**, U.S. Collegiate Selects, Rare, #22
7. **Matej Stransky**, HC Davos, Rare, #44
8. **Quinn Finley**, U.S. Collegiate Selects, Rare, #19
9. **Adam Tambellini**, HC Davos, Rare, #19
10. **Rasmus Asplund**, HC Davos, Rare, #74
11. **Gavin McCartthy**, U.S. Collegiate Selects, Common, #2
12. **Sven Jung**, HC Davos, Common, #90
13. **Matt Dimarsico**, U.S. Collegiate Selects, Common, #14

Key players of the tournament (all Rare; front lines: `#number · Team`, `Key player`; Gold visual: **table**):
14. **Attilio Biasca**, HC Fribourg-Gottéron, #17
15. **Filip Chlapík**, HC Sparta Praha, #14
16. **Derek Grant**, Team Canada, #27
17. **Eric Schneller**, IFK Helsinki, #65
18. **Aaron Irving**, HC Sparta Praha, #24
19. **Marcus Sörensen**, HC Fribourg-Gottéron, #9
20. **Niko Hovinen**, IFK Helsinki, #92

### Category 2: GOALIE (2 cards, both Epic). Art: goalie mask and blocker, in the team's colours, jersey number small.
1. **Adam Gajan**, U.S. Collegiate Selects. Front: saves and save rate. Gold visual: shot map (shots faced).
2. **Sandro Aeschlimann**, HC Davos. Front: saves and save rate. Gold visual: shot map (shots faced).

### Category 3: TEAM (6 cards). Art: abstract monogram shield in the team's colours.
1. **HC Davos**, Legendary. Front: `Group B`, `17 titles`. Gold: table.
2. **Team Canada**, Legendary. Front: `Group B`, `16 titles`. Gold: table.
3. **HC Sparta Praha**, Epic. Front: `Group A`, `2 titles`. Gold: table.
4. **HC Fribourg-Gottéron**, Rare. Front: `Group A`, `1 title`. Gold: table.
5. **IFK Helsinki**, Common. Front: `Group A`, `0 titles`. Gold: table.
6. **U.S. Collegiate Selects**, Common. Front: `Group B`, `0 titles`. Gold: table.

(Pluralise correctly: "1 title", "0 titles", "17 titles".)

### Category 4: MOMENT (8 cards). Art: a bold single-glyph illustration (a goal light, a trophy, a clock, a puck in a net), abstract and minimal.

From the 2025 Final (U.S. Collegiate Selects vs HC Davos):
1. **The turning point**, Epic. Front: `Period 3 · 15:21`. Gold: **timeline**.
2. **Adam Tambellini scores 2**, Rare. Team: HC Davos. Gold: table.
3. **First blood**, Rare. Front: `Period 1 · 11:15`. Gold: table.
4. **The last word**, Rare. Front: `Period 3 · 17:49`. Gold: table.

From Spengler Cup history (no team; front line is the year):
5. **Where it began**, Epic. Front: `1923`. Gold: table.
6. **A shared trophy**, Rare. Front: `1932`. Gold: table.
7. **Decided by a shootout**, Rare. Front: `2018`. Gold: table.
8. **The first college team**, Epic. Front: `2025`. Gold: table.

### Category 5: RULES AND CONCEPTS (8 cards, all Common). Art: a rink diagram or icon explaining the rule (for example the offside line, the icing lane), minimal line art on an ice-tint background. Front has only the title and the line "Rules and concepts". Gold: **table** (key facts) or a small rink diagram.
1. **Icing**
2. **Offside**
3. **Power play**
4. **High-sticking**
5. **Faceoff**
6. **Assist**
7. **Expected goals (xG)** (for this card the Gold panel is a small shot map showing shot quality as dot size)
8. **The blue lines**

### Category 6: GAME OF THE DAY (6 cards). Art: a scoreboard graphic with the two team monograms and the score in large type. Front lines: `date · stage`, `score`. Available the morning after the game.
1. **26 Dec**, Team Canada **3:2** U.S. Collegiate Selects, Rare, Group stage. Gold: table.
2. **27 Dec**, HC Davos **3:5** U.S. Collegiate Selects, Rare, Group stage. Gold: table.
3. **28 Dec**, HC Fribourg-Gottéron **4:3** IFK Helsinki, Rare, Group stage. Gold: table.
4. **29 Dec**, HC Davos **3:0** IFK Helsinki, Rare, Semi-final qualification. Gold: table.
5. **30 Dec**, U.S. Collegiate Selects **5:3** HC Sparta Praha, **Epic**, Semi-final. Gold: table.
6. **31 Dec (Final)**, U.S. Collegiate Selects **3:6** HC Davos, **Legendary**, Final. Gold: **timeline**.

### Category 7: ACHIEVEMENT (6 cards, all Epic, earned by actions, never in packs). Art: a medal or badge icon in gold and cyan, no team. Front has the title and one line saying how it was earned. No Gold data: the Gold panel is a **progress/milestone strip** (small stylised icons) instead of data; the Diamond quiz is a light "hockey fun" question.
1. **Three in a row**: open the app three days in a row.
2. **Perfect day**: answer all five daily questions correctly.
3. **Called it**: win your first prediction.
4. **On a roll**: win three predictions.
5. **Level up**: upgrade a card for the first time.
6. **Set complete**: claim your first complete set.

## 7. Sets (design one extra "set page" mockup)

A set is a group of cards that pays a reward when complete. Produce one **Set screen** mockup: a title, a progress bar, a grid of the set's card slots (owned in colour, missing as silhouettes) and a reward chip (Pucks, plus a special pack icon for two of them). Sets:
- Six team squads (reward 120 Pucks each): HC Davos (9 cards), U.S. Collegiate Selects (8), HC Fribourg-Gottéron (3), HC Sparta Praha (3), IFK Helsinki (3), Team Canada (2).
- The Rulebook (8 rules): 150 Pucks.
- The Crease (2 goalies): 100 Pucks.
- Every Game Day (6 Game of the Day cards): 200 Pucks and a special pack.
- The Trophy Cabinet (6 cards): 250 Pucks and a special pack.

## 8. Style constraints and quality checks

- Keep all text spelled exactly as given (names with diacritics: Chlapík, Sörensen).
- One consistent visual system across all seven categories: the frame, tier badge, header row and footer must sit in exactly the same place on every card.
- Rarity must be recognisable at a glance in a 160 px thumbnail; tier must be recognisable in the back thumbnail.
- WCAG-friendly contrast for all text on both the dark and the light theme.
- No real club crests, league logos, sponsor names or player faces.
- Do not add extra cards or fields. If something is unclear, make a reasonable choice and list your assumptions after the images.

## 9. Start now

Begin with **Category 3: TEAM** (6 cards): first the clean design sheet of the six fronts, then the annotated version marking static versus dynamic fields, then the four back tiers of **HC Davos** side by side. After that, wait for me to say which category to do next.
