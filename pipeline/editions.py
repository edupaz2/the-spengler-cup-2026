"""Past editions: the year-by-year history and the 2025 results."""
from __future__ import annotations

import csv
import functools
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass(frozen=True)
class EditionRow:
    year: int
    winners: tuple[str, ...]  # empty when not held; two names for a shared title
    runner_up: str | None
    note: str | None


@dataclass(frozen=True)
class Game2025:
    id: int
    date: str
    start: str
    stage: str  # group, qualification, semi, final
    group: str | None
    home: str
    away: str
    periods: tuple[tuple[int, int], ...]

    @property
    def score(self) -> tuple[int, int]:
        return sum(p[0] for p in self.periods), sum(p[1] for p in self.periods)


@dataclass(frozen=True)
class Edition2025:
    teams: list[dict]
    games: list[Game2025]
    key_players: list[dict]
    final_box: dict


@dataclass(frozen=True)
class StandingRow:
    team: str
    played: int
    points: int
    gf: int
    ga: int


def load_history(path: Path) -> list[EditionRow]:
    with open(path, encoding="utf-8", newline="") as f:
        return [
            EditionRow(
                int(r["year"]),
                tuple(r["winner"].split("|")) if r["winner"] else (),
                r["runner_up"] or None,
                r["note"] or None,
            )
            for r in csv.DictReader(f)
        ]


def titles(rows: list[EditionRow]) -> dict[str, int]:
    c: Counter[str] = Counter()
    for r in rows:
        c.update(r.winners)
    return dict(c)


def load_edition2025(path: Path) -> Edition2025:
    d = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    games = [
        Game2025(
            id=g["id"], date=g["date"], start=g["start"], stage=g["stage"], group=g.get("group"),
            home=g["home"], away=g["away"], periods=tuple(tuple(p) for p in g["periods"]),
        )
        for g in d["games"]
    ]
    return Edition2025(d["teams"], games, d["key_players"], d["final_box"])


def standings(games: list[Game2025], group: str) -> list[StandingRow]:
    """Group table: 3 points a win, ranked by points, goal difference, goals for, then head to head."""
    played = [g for g in games if g.stage == "group" and g.group == group]
    t: dict[str, list[int]] = {}
    for g in played:
        hs, as_ = g.score
        for team, gf, ga in ((g.home, hs, as_), (g.away, as_, hs)):
            row = t.setdefault(team, [0, 0, 0, 0])
            row[0] += 1
            row[1] += 3 if gf > ga else 0
            row[2] += gf
            row[3] += ga
    rows = [StandingRow(n, *v) for n, v in t.items()]

    def head_to_head(a: str, b: str) -> int:
        for g in played:
            if {g.home, g.away} == {a, b}:
                hs, as_ = g.score
                winner = g.home if hs > as_ else g.away
                return 1 if winner == a else -1
        return 0

    def cmp(a: StandingRow, b: StandingRow) -> int:
        ka, kb = (a.points, a.gf - a.ga, a.gf), (b.points, b.gf - b.ga, b.gf)
        if ka != kb:
            return -1 if ka > kb else 1
        return -head_to_head(a.team, b.team)

    return sorted(rows, key=functools.cmp_to_key(cmp))
