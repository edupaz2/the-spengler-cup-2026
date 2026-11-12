"""Card catalog: players, goalies, teams, moments, rules, Game of the Day and achievements."""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import json
import random
import re
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path

import yaml

from pipeline.analytics.winprob import PERIOD_SECONDS, timeline, turning_point
from pipeline.inputs import event_and_stats_paths
from pipeline.analytics.xg import ON_GOAL, box_score, goalie_line, player_impact, shot_xg
from pipeline.editions import Edition2025, EditionRow, Game2025, load_edition2025, load_history, titles
from pipeline.load_events import load_events
from pipeline.load_stats import load_player_stats
from pipeline.questions import roster
from pipeline.schema import SIDES, Event

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = ("player", "moment", "goalie", "team", "rule", "gotd", "achievement")
STAGES = {"group": "Group stage", "qualification": "Semi-final qualification", "semi": "Semi-final", "final": "Final"}
STAGE_RARITY = {"group": "rare", "qualification": "rare", "semi": "epic", "final": "legendary"}
ALIASES = {"HC Sparta Praha": ["Sparta Prague"], "U.S. Collegiate Selects": ["U.S. Collegiate Selects"]}
TOP_PLAYERS = 10
# Placeholder rewards, to tune in playtest.
SET_REWARDS = {"squad": {"pucks": 120}, "rulebook": {"pucks": 150}, "crease": {"pucks": 100},
               "every-game-day": {"pucks": 200, "packId": "special"}, "trophy-cabinet": {"pucks": 250, "packId": "special"}}


@dataclass
class Card:
    id: str
    category: str
    title: str
    rarity: str
    front: list[str]
    back: dict
    team: str | None = None
    availableOn: str | None = None
    unlock: str | None = None
    image: str | None = None
    statsHidden: bool = False

    def to_json(self) -> dict:
        return asdict(self)


@dataclass
class SetBonus:
    id: str
    label: str
    cardIds: list[str]
    reward: dict

    def to_json(self) -> dict:
        return asdict(self)


def rarity_for(percentile: float) -> str:
    if percentile >= 98:
        return "legendary"
    if percentile >= 90:
        return "epic"
    if percentile >= 70:
        return "rare"
    return "common"


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def image_slug(title: str) -> str:
    """File-name slug of the card art: like slug(), but dots vanish ("U.S." -> "us")."""
    return slug(title.replace(".", ""))


IMAGE_PREFIX = {"player": "player", "goalie": "goalie", "team": "team", "moment": "moment", "achievement": "achievement",
                "rule": "rules-and-concepts", "gotd": "game-of-the-day"}
PRIVATE_GOLD = {"text": "Full stats are in the private build.", "visual": "table", "data": {"rows": []}}


def display(event_name: str) -> str:
    return re.sub(r"^#\d+\s+", "", event_name)


def numeric_diamond(question: str, n: int) -> dict:
    near = [n + d for d in (-2, -1, 1, 2, 3) if n + d >= 0][:3]
    options = sorted([n, *near])
    return {"question": question, "options": [str(o) for o in options], "answerIndex": options.index(n)}


def choice_diamond(cid: str, question: str, answer: str, others: list[str]) -> dict:
    options = [answer, *[o for o in others if o != answer][:3]]
    random.Random(cid).shuffle(options)
    return {"question": question, "options": options, "answerIndex": options.index(answer)}


def mmss(s: int) -> str:
    return f"{s // 60}:{s % 60:02d}"


def _shot_points(shots: list[Event]) -> list[dict]:
    return [{"x": e.x, "y": e.y, "xg": round(shot_xg(e), 3), "result": e.result} for e in shots if e.x is not None]


def _player_cards(events, stats, edition) -> list[Card]:
    people = roster(events, stats)
    for r in people:
        r["impact"] = player_impact(events, r["name"])
    ranked = sorted(people, key=lambda r: (r["impact"], r["name"]))
    n = len(ranked)
    key_last = {(k["name"].split()[-1].lower(), k["team"]) for k in edition.key_players}
    chosen = ranked[::-1][:TOP_PLAYERS]
    chosen += [r for r in ranked if r not in chosen and (r["line"].last_name.lower(), r["line"].team) in key_last]
    cards = []
    for r in chosen:
        line, s = r["line"], r["line"].stats
        name = f"{line.first_name} {line.last_name}"
        box = box_score(events, r["name"])
        shots = [e for e in events if e.kind == "shot" and e.player_name == r["name"]]
        pct = ranked.index(r) / max(n - 1, 1) * 100
        cid = f"player-{slug(name)}"
        gold = ({"text": "Every shot he took, with its chance of scoring.", "visual": "shotmap", "data": {"shots": _shot_points(shots)}}
                if shots else {"text": "His night in numbers.", "visual": "table", "data": {"rows": [["Time on ice", f"{s.get('TOI (s)', 0) / 60:.0f} min"]]}})
        cards.append(Card(
            id=cid, category="player", title=name, team=line.team, rarity=rarity_for(pct),
            front=[f"#{line.jersey} · {line.team}", f"{box['goals']}G {box['assists']}A", f"{s.get('TOI (s)', 0) / 60:.0f} min"],
            back={
                "normal": f"{name}, #{line.jersey} for {line.team}: {box['goals']} goals, {box['assists']} assists and {box['shots']} shots in {s.get('TOI (s)', 0) / 60:.0f} minutes of the 2025 Final.",
                "silver": f"His impact was {r['impact']:.2f} expected goals: his own shots plus the shots his passes set up. Top speed {s.get('SPD TOP (km/h)', 0):.1f} km/h.",
                "gold": gold,
                "diamond": numeric_diamond(f"How many shots did {name} take in the 2025 Final?", box["shots"]),
            }))
    return cards


def _key_player_cards(edition, player_cards) -> list[Card]:
    have = {(c.title.split()[-1].lower(), c.team) for c in player_cards}
    games = {g.id: g for g in edition.games}
    teams = [t["name"] for t in edition.teams]
    cards = []
    for k in edition.key_players:
        if (k["name"].split()[-1].lower(), k["team"]) in have:
            continue
        g = games[k["game"]]
        hs, as_ = g.score
        cid = f"player-{slug(k['name'])}"
        cards.append(Card(
            id=cid, category="player", title=k["name"], team=k["team"], rarity="rare",
            front=[f"#{k['number']} · {k['team']}", "Key player"],
            back={
                "normal": f"{k['name']}, #{k['number']}, was named a key player for {k['team']} in game {g.id}.",
                "silver": f"That game: {g.home} {hs}:{as_} {g.away} ({STAGES[g.stage].lower()}, {g.date}).",
                "gold": {"text": "The game by period.", "visual": "table",
                         "data": {"rows": [[f"Period {i + 1}", f"{p[0]}:{p[1]}"] for i, p in enumerate(g.periods)]}},
                "diamond": choice_diamond(cid, f"Which team did {k['name']} play for?", k["team"], teams),
            }))
    return cards


def _goalie_cards(events, edition) -> list[Card]:
    cards = []
    for g in edition.final_box["goalies"]:
        names = {e.goalie_name for e in events if e.kind == "shot" and e.goalie_name and g["name"] in e.goalie_name}
        if not names:
            continue
        name = sorted(names)[0]
        line = goalie_line(events, name)
        faced = [e for e in events if e.kind == "shot" and e.goalie_name == name]
        on_goal = [e for e in faced if e.result in ON_GOAL]
        xga = sum(shot_xg(e) for e in on_goal)
        pct = line["saves"] / line["shots_against"] * 100 if line["shots_against"] else 0.0
        cid = f"goalie-{slug(g['name'])}"
        cards.append(Card(
            id=cid, category="goalie", title=g["name"], team=g["team"], rarity="epic",
            front=[g["team"], f"{line['saves']} saves", f"{pct:.1f}%"],
            back={
                "normal": f"{g['name']} faced {line['shots_against']} shots on goal in the 2025 Final and saved {line['saves']} ({pct:.1f}%).",
                "silver": f"The shots he faced were worth {xga:.1f} expected goals; he let in {line['goals_against']}.",
                "gold": {"text": "Every shot he faced.", "visual": "shotmap", "data": {"shots": _shot_points(faced)}},
                "diamond": numeric_diamond(f"How many shots on goal did {g['name']} face?", line["shots_against"]),
            }))
    return cards


def _team_cards(edition, history) -> list[Card]:
    won = titles(history)
    cards = []
    for t in edition.teams:
        name = t["name"]
        aliases = [name, *ALIASES.get(name, [])]
        n_titles = sum(won.get(a, 0) for a in aliases)
        n_finals = n_titles + sum(1 for r in history if r.runner_up in aliases)
        games = [g for g in edition.games if name in (g.home, g.away)]
        rows = []
        for g in games:
            hs, as_ = g.score
            rows.append([f"vs {g.away if g.home == name else g.home}", f"{hs if g.home == name else as_}:{as_ if g.home == name else hs}"])
        cid = f"team-{slug(name)}"
        rarity = "legendary" if n_titles >= 10 else "epic" if n_titles >= 2 else "rare" if n_titles >= 1 else "common"
        cards.append(Card(
            id=cid, category="team", title=name, team=name, rarity=rarity,
            front=[f"Group {t['group']}", f"{n_titles} titles"],
            back={
                "normal": t["fact"],
                "silver": f"Through 2025: {n_titles} Spengler Cup titles and {n_finals} finals reached.",
                "gold": {"text": "Their 2025 results.", "visual": "table", "data": {"rows": rows}},
                "diamond": numeric_diamond(f"How many games did {name} play in 2025?", len(games)),
            }))
    return cards


def _moment_cards(events, history) -> list[Card]:
    cards = []
    goals = sorted((e for e in events if e.kind == "goal"), key=lambda e: (e.period, e.clock_s))
    tp = turning_point(events)
    if tp:
        g = next(e for e in goals if e.event_id == tp.goal_event_id)
        cards.append(Card(
            id="moment-turning-point", category="moment", title="The turning point", team=SIDES[g.team], rarity="epic",
            front=["2025 Final", f"Period {g.period}", mmss(g.clock_s)],
            back={
                "normal": f"{display(g.player_name)} scored for {SIDES[g.team]} in period {g.period} at {mmss(g.clock_s)}, the goal that swung the game most.",
                "silver": f"It moved that team's win probability by {tp.delta * 100:.0f} points.",
                "gold": {"text": "Win probability of the U.S. Collegiate Selects through the game.", "visual": "timeline",
                         "data": {"team": SIDES["Home"], "points": [[t, round(p, 3)] for t, p in timeline(events, "Home")]}},
                "diamond": choice_diamond("moment-turning-point", "In which period did the turning point happen?", f"Period {g.period}",
                                          ["Period 1", "Period 2", "Period 3", "Overtime"]),
            }))
    scored: dict[str, list[Event]] = {}
    for g in goals:
        scored.setdefault(g.player_name, []).append(g)
    top = max(scored.items(), key=lambda kv: (len(kv[1]), kv[0]), default=None)
    if top and len(top[1]) >= 2:
        who, gl = top
        cards.append(Card(
            id="moment-multi-goal", category="moment", title=f"{display(who)} scores {len(gl)}", team=SIDES[gl[0].team], rarity="rare",
            front=["2025 Final", f"{len(gl)} goals"],
            back={
                "normal": f"{display(who)} scored {len(gl)} goals in the 2025 Final.",
                "silver": "A multi-goal night is rare in a game decided by one or two goals.",
                "gold": {"text": "His goals.", "visual": "table", "data": {"rows": [[f"Period {g.period}", mmss(g.clock_s)] for g in gl]}},
                "diamond": numeric_diamond(f"How many goals did {display(who)} score in the 2025 Final?", len(gl)),
            }))
    firsts = [("moment-first-goal", "First blood", goals[0], "scored the opening goal"),
              ("moment-last-goal", "The last word", goals[-1], "scored the final goal")] if goals else []
    for cid, title, g, line in firsts:
        cards.append(Card(
            id=cid, category="moment", title=title, team=SIDES[g.team], rarity="rare", front=["2025 Final", mmss(g.clock_s)],
            back={
                "normal": f"{display(g.player_name)} {line} for {SIDES[g.team]} in period {g.period} at {mmss(g.clock_s)}.",
                "silver": f"Assisted by {', '.join(display(a) for a in g.assists) or 'nobody (unassisted)'}.",
                "gold": {"text": "The goal in context.", "visual": "table", "data": {"rows": [["Period", str(g.period)], ["Time", mmss(g.clock_s)], ["Strength", g.strength]]}},
                "diamond": choice_diamond(cid, "Which team scored it?", SIDES[g.team], list(SIDES.values()) + ["HC Sparta Praha", "Team Canada"]),
            }))
    winners = sorted({w for r in history for w in r.winners})
    for year, title in ((1923, "Where it began"), (1932, "A shared trophy"), (2018, "Decided by a shootout"), (2025, "The first college team")):
        r = next(x for x in history if x.year == year)
        cid = f"moment-{year}"
        cards.append(Card(
            id=cid, category="moment", title=title, rarity="epic" if year in (1923, 2025) else "rare", front=["History", str(year)],
            back={
                "normal": f"{year}: {r.note}.",
                "silver": f"Winner: {' and '.join(r.winners)}" + (f", runner-up: {r.runner_up}." if r.runner_up else "."),
                "gold": {"text": "The year in brief.", "visual": "table",
                         "data": {"rows": [["Year", str(year)], ["Winner", " and ".join(r.winners)], ["Runner-up", r.runner_up or "none (shared)"]]}},
                "diamond": choice_diamond(cid, f"Who won the Spengler Cup in {year}?", r.winners[0], winners),
            }))
    return cards


def _rule_cards(rules: list[dict]) -> list[Card]:
    cards = []
    for r in rules:
        cid = f"rule-{r['id']}"
        d = r["diamond"]
        cards.append(Card(
            id=cid, category="rule", title=r["title"], rarity="common", front=["Rules and concepts"],
            back={"normal": r["normal"], "silver": r["silver"],
                  "gold": {"text": r["gold_text"], "visual": "table", "data": {"rows": r.get("gold_rows", [])}},
                  "diamond": {"question": d["question"], "options": d["options"], "answerIndex": d["options"].index(d["answer"])}}))
    return cards


def _gotd_cards(edition: Edition2025, events) -> list[Card]:
    cards = []
    by_day: dict[str, list[Game2025]] = {}
    for g in edition.games:
        by_day.setdefault(g.date, []).append(g)
    for date, games in sorted(by_day.items()):
        g = min(games, key=lambda g: (abs(g.score[0] - g.score[1]), -sum(g.score), g.id))
        hs, as_ = g.score
        cid = f"gotd-{date}"
        gold = ({"text": "Win probability of the home side through the game.", "visual": "timeline",
                 "data": {"team": g.home, "points": [[t, round(p, 3)] for t, p in timeline(events, "Home")]}}
                if g.stage == "final" else
                {"text": "The game by period.", "visual": "table",
                 "data": {"rows": [[f"Period {i + 1}", f"{p[0]}:{p[1]}"] for i, p in enumerate(g.periods)]}})
        cards.append(Card(
            id=cid, category="gotd", title=f"{g.home} {hs}:{as_} {g.away}", rarity=STAGE_RARITY[g.stage],
            image=f"{IMAGE_PREFIX['gotd']}_{image_slug(f'{g.home} vs {g.away}')}",
            availableOn=(dt.date.fromisoformat(date) + dt.timedelta(days=1)).isoformat(),
            front=[date, STAGES[g.stage], f"{hs}:{as_}"],
            back={
                "normal": f"{STAGES[g.stage]}, {date}: {g.home} {hs}:{as_} {g.away}.",
                "silver": "By period: " + ", ".join(f"{p[0]}:{p[1]}" for p in g.periods) + ".",
                "gold": gold,
                "diamond": numeric_diamond(f"How many goals were scored in {g.home} against {g.away}?", hs + as_),
            }))
    return cards


def _achievement_cards(achievements: list[dict]) -> list[Card]:
    cards = []
    for a in achievements:
        cid = f"ach-{a['id']}"
        cards.append(Card(
            id=cid, category="achievement", title=a["title"], rarity="epic", unlock=a["id"], front=["Achievement"],
            back={"normal": a["normal"], "silver": a["silver"],
                  "gold": {"text": "How to earn it.", "visual": "table", "data": {"rows": [["Unlock", a["normal"]]]}},
                  "diamond": {"question": a["question"], "options": a["options"], "answerIndex": a["options"].index(a["answer"])}}))
    return cards


def build_catalog(events, stats, rules, achievements, edition: Edition2025, history: list[EditionRow],
                  public: dict | None = None) -> list[Card]:
    if public is None:
        players = _player_cards(events, stats, edition)
        featured = [*players, *_key_player_cards(edition, players), *_goalie_cards(events, edition)]
        moments = _moment_cards(events, history)
    else:
        from pipeline.public_cards import public_cards
        featured = public_cards(edition, public)
        have = {c.title for c in featured}
        featured += [c for c in _key_player_cards(edition, []) if c.title not in have]
        moments = [c for c in _moment_cards(events, history) if c.id.removeprefix("moment-").isdigit()]
        moments = [*(c for c in featured if c.category == "moment"), *moments]
        featured = [c for c in featured if c.category != "moment"]
    cards = [*featured, *_team_cards(edition, history), *moments, *_rule_cards(rules), *_gotd_cards(edition, events),
             *_achievement_cards(achievements)]
    for c in cards:
        if c.image is None:
            c.image = f"{IMAGE_PREFIX[c.category]}_{image_slug(c.title)}"
        rule_without_rows = c.category == "rule" and not c.back["gold"]["data"]["rows"]
        if rule_without_rows or (public is not None and (c.back["gold"]["visual"] != "table" or c.category == "rule")):
            c.back["gold"] = dict(PRIVATE_GOLD)
            c.statsHidden = True
    return cards


def build_sets(catalog: list[Card]) -> list[SetBonus]:
    sets = []
    for team in sorted({c.team for c in catalog if c.category == "team"}):
        ids = sorted(c.id for c in catalog if c.team == team and c.category in ("team", "player", "goalie"))
        if len(ids) >= 2:
            sets.append(SetBonus(f"squad-{slug(team)}", f"{team} squad", ids, SET_REWARDS["squad"]))
    for sid, label, cat in (("rulebook", "The Rulebook", "rule"), ("crease", "The Crease", "goalie"),
                            ("every-game-day", "Every Game Day", "gotd"), ("trophy-cabinet", "The Trophy Cabinet", "achievement")):
        ids = sorted(c.id for c in catalog if c.category == cat)
        if ids:
            sets.append(SetBonus(sid, label, ids, SET_REWARDS[sid]))
    return sets


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--data", default=None, help="folder with the organizers' CSVs (default: ./raw)")
    p.add_argument("--demo", action="store_true", help="use the synthetic fixtures instead of organizer data")
    p.add_argument("--out", default=str(ROOT / "app" / "public" / "data" / "cards.json"))
    a = p.parse_args()
    events_csv, stats_csv = event_and_stats_paths(a.data, a.demo)
    events = load_events(events_csv, "g11")
    stats = load_player_stats(stats_csv)
    load = lambda f: yaml.safe_load((ROOT / "content" / f).read_text(encoding="utf-8"))
    rules = load("rules.yaml")
    private_gold = ROOT / ".private" / "rule_gold.yaml"  # dataset figures stay out of the repository
    if private_gold.exists() and not a.demo:
        rows = yaml.safe_load(private_gold.read_text(encoding="utf-8"))
        rules = [{**r, "gold_rows": rows.get(r["id"], [])} for r in rules]
    cat = build_catalog(events, stats, rules, load("achievements.yaml"),
                        load_edition2025(ROOT / "content" / "edition2025.yaml"), load_history(ROOT / "content" / "history" / "editions.csv"),
                        public=load("cards_public.yaml") if a.demo else None)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps({"cards": [c.to_json() for c in cat], "sets": [s.to_json() for s in build_sets(cat)]},
                                      ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", len(cat), "cards")


if __name__ == "__main__":
    main()
