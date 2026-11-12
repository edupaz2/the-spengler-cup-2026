"""Generators for the three data-driven daily questions."""
from __future__ import annotations

import itertools
import random
from dataclasses import asdict, dataclass

from pipeline.analytics.xg import box_score, player_impact
from pipeline.editions import EditionRow, Game2025, titles
from pipeline.schema import Event, PlayerLine, join_key

TEMPLATES = {
    "hidden_hero": "{name} made the biggest impact: {impact:.2f} expected goals from {shots} shots and the passes behind teammates' shots.",
    "team_goals": "{win} had scored {wv} goals so far, {lose} {lv}.",
    "titles": "{win} has won {wv} Spengler Cups to {lose}'s {lv}.",
    "shots": "{win} took {wv} shots to {lose}'s {lv}.",
    "goals": "{win} scored {wv} to {lose}'s {lv}.",
    "penalty_minutes": "{win} sat {wv} minutes in the box to {lose}'s {lv}.",
    "guess_player": "{name}, number {jersey} for {team}: {goals} goal(s) on {shots} shots in {toi:.0f} minutes.",
}
METRIC_PROMPTS = {
    "shots": "Who took more shots?",
    "goals": "Who scored more goals?",
    "penalty_minutes": "Who spent more minutes in the penalty box?",
    "team_goals": "Which team had scored more goals so far?",
    "titles": "Which team has won more Spengler Cups?",
}
STAT = {"shots": "S", "goals": "G", "penalty_minutes": "PIM"}
MIN_MARGIN = 0.03


@dataclass
class HiddenHeroQuestion:
    id: str
    players: list[dict]
    answerIndex: int
    why: str
    reveal: list[dict]
    difficulty: int = 2
    kind: str = "hidden_hero"
    classic: bool = False


@dataclass
class HigherLowerQuestion:
    id: str
    metric: str
    prompt: str
    a: dict
    b: dict
    answer: str
    why: str
    difficulty: int = 1
    kind: str = "higher_lower"
    classic: bool = False


@dataclass
class GuessPlayerQuestion:
    id: str
    clues: list[str]
    options: list[str]
    answerIndex: int
    why: str
    difficulty: int = 2
    kind: str = "guess_player"
    classic: bool = False


def to_dict(q) -> dict:
    d = asdict(q)
    if not d.get("classic"):
        d.pop("classic", None)
    return d


def roster(events: list[Event], stats: list[PlayerLine]) -> list[dict]:
    """Players who appear in the events and have a stats line."""
    by_key = {(p.team, p.jersey): p for p in stats}
    seen: dict[tuple[str, str], PlayerLine] = {}
    for e in events:
        if e.player_name and e.team:
            try:
                line = by_key.get(join_key(e.team, e.player_name))
            except ValueError:
                continue
            if line:
                seen[(e.team, e.player_name)] = line
    return [{"name": n, "side": s, "line": line} for (s, n), line in sorted(seen.items())]


def _display(line: PlayerLine) -> str:
    return f"{line.first_name} {line.last_name}"


def hidden_hero(date: str, events: list[Event], stats: list[PlayerLine], classic: bool) -> HiddenHeroQuestion | None:
    rng = random.Random(f"{date}|hidden_hero")
    pool = []
    for r in roster(events, stats):
        impact = player_impact(events, r["name"])
        if impact > 0:
            pool.append({**r, "impact": impact, "box": box_score(events, r["name"])})
    rng.shuffle(pool)
    for trio in itertools.combinations(pool[:10], 3):
        top = sorted((p["impact"] for p in trio), reverse=True)
        if top[0] - top[1] >= MIN_MARGIN:
            break
    else:
        return None
    answer = max(range(3), key=lambda i: trio[i]["impact"])
    aliases = ["Player A", "Player B", "Player C"]
    winner = trio[answer]
    return HiddenHeroQuestion(
        id=f"{date}-hh",
        players=[{"alias": a, "box": {**p["box"], "toi_min": round(p["line"].stats.get("TOI (s)", 0) / 60)}}
                 for a, p in zip(aliases, trio)],
        answerIndex=answer,
        why=TEMPLATES["hidden_hero"].format(name=_display(winner["line"]), impact=winner["impact"], shots=winner["box"]["shots"]),
        reveal=[{"alias": a, "name": _display(p["line"]), "impact": round(p["impact"], 3)} for a, p in zip(aliases, trio)],
        classic=classic,
    )


def _hl(qid: str, metric: str, a: tuple[str, int], b: tuple[str, int], classic: bool = False) -> HigherLowerQuestion:
    win, lose = (a, b) if a[1] > b[1] else (b, a)
    why = TEMPLATES[metric].format(win=win[0], wv=win[1], lose=lose[0], lv=lose[1])
    return HigherLowerQuestion(
        id=qid, metric=metric, prompt=METRIC_PROMPTS[metric],
        a={"label": a[0], "value": a[1]}, b={"label": b[0], "value": b[1]},
        answer="a" if a[1] > b[1] else "b", why=why, classic=classic,
    )


def _distinct_pair(rng: random.Random, items: list[tuple[str, int]]) -> tuple[tuple[str, int], tuple[str, int]] | None:
    pairs = [(x, y) for x, y in itertools.combinations(items, 2) if x[1] != y[1]]
    return rng.choice(pairs) if pairs else None


def higher_lower_players(date: str, events: list[Event], stats: list[PlayerLine], classic: bool) -> HigherLowerQuestion | None:
    rng = random.Random(f"{date}|higher_lower")
    people = roster(events, stats)
    metrics = ["shots", "goals", "penalty_minutes"]
    rng.shuffle(metrics)
    for m in metrics:
        items = []
        for r in people:
            v = box_score(events, r["name"])["shots"] if m == "shots" else r["line"].stats.get(STAT[m])
            if v is not None:
                items.append((_display(r["line"]), int(v)))
        pair = _distinct_pair(rng, items)
        if pair:
            return _hl(f"{date}-hl", m, *pair, classic=classic)
    return None


def higher_lower_teams(date: str, played: list[Game2025]) -> HigherLowerQuestion | None:
    goals: dict[str, int] = {}
    for g in played:
        hs, as_ = g.score
        goals[g.home] = goals.get(g.home, 0) + hs
        goals[g.away] = goals.get(g.away, 0) + as_
    pair = _distinct_pair(random.Random(f"{date}|higher_lower"), sorted(goals.items()))
    return _hl(f"{date}-hl", "team_goals", *pair) if pair else None


def higher_lower_titles(date: str, history: list[EditionRow], teams: list[str] | None = None) -> HigherLowerQuestion | None:
    t = titles(history)
    names = teams or sorted(t)
    pair = _distinct_pair(random.Random(f"{date}|higher_lower"), [(n, t.get(n, 0)) for n in names])
    return _hl(f"{date}-hl", "titles", *pair) if pair else None


def guess_player(date: str, events: list[Event], stats: list[PlayerLine], classic: bool) -> GuessPlayerQuestion | None:
    rng = random.Random(f"{date}|guess_player")
    need = ("TOI (s)", "Shifts", "SPD TOP (km/h)", "S", "G")
    people = [r for r in roster(events, stats) if all(k in r["line"].stats for k in need) and r["line"].stats["S"] >= 1]
    if len(people) < 4:
        return None
    pick = rng.choice(people)
    line, s = pick["line"], pick["line"].stats
    clues = [
        f"He spent {s['TOI (s)'] / 60:.0f} minutes on the ice across {int(s['Shifts'])} shifts.",
        f"His top speed was {s['SPD TOP (km/h)']:.1f} km/h.",
        f"He took {int(s['S'])} shots and scored {int(s['G'])} goal(s).",
        f"He plays for {line.team}.",
        f"His jersey number is {line.jersey}.",
    ]
    others = rng.sample([r for r in people if r is not pick], 3)
    options = [_display(r["line"]) for r in [pick, *others]]
    rng.shuffle(options)
    why = TEMPLATES["guess_player"].format(name=_display(line), jersey=line.jersey, team=line.team,
                                           goals=int(s["G"]), shots=int(s["S"]), toi=s["TOI (s)"] / 60)
    return GuessPlayerQuestion(id=f"{date}-gp", clues=clues, options=options,
                               answerIndex=options.index(_display(line)), why=why, classic=classic)
