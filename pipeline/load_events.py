"""Load the Wisehockey full-match event export into typed events."""
from __future__ import annotations

import csv
from pathlib import Path
from statistics import mean

from pipeline.schema import Event

KINDS = {
    "Shot": "shot",
    "Goal": "goal",
    "Pass": "pass",
    "BluelineCrossing": "entry",
    "Dump": "dump",
    "Clear": "clear",
    "Faceoff": "faceoff",
    "Penalty": "penalty",
    "StoppageOfPlay": "stoppage",
    "PuckControl": "control",
}
CONTROL_SIDE = {"HomeControl": "Home", "AwayControl": "Away"}


def _num(v: str) -> float | None:
    return float(v) if v not in ("", None) else None


def _xy(v: str) -> tuple[float | None, float | None]:
    if not v:
        return None, None
    a, b = v.split(",")
    return float(a), float(b)


def _read(path: Path) -> list[dict[str, str]]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _names_by_id(rows: list[dict[str, str]]) -> dict[str, str]:
    names: dict[str, str] = {}
    for r in rows:
        for i in range(1, 13):
            pid, name = r.get(f"StartPlayerId{i}", ""), r.get(f"StartPlayerName{i}", "")
            if pid and name:
                names[pid] = name
    return names


def _directions(rows: list[dict[str, str]]) -> dict[tuple[int, str], int]:
    """+1 when a team attacks toward +x in a period, else -1 (from its shot positions)."""
    xs: dict[tuple[int, str], list[float]] = {}
    for r in rows:
        if r["EventType"] == "Shot" and r["EventStartCoordinate"]:
            x, _ = _xy(r["EventStartCoordinate"])
            xs.setdefault((int(r["Period"]), r["EventPrimaryTeam"]), []).append(x)
    out: dict[tuple[int, str], int] = {}
    for (p, t), v in xs.items():
        out[(p, t)] = 1 if mean(v) >= 0 else -1
    periods = sorted({int(r["Period"]) for r in rows})
    for p in periods:
        for t, other in (("Home", "Away"), ("Away", "Home")):
            if (p, t) in out:
                continue
            if (p, other) in out:
                out[(p, t)] = -out[(p, other)]
            elif (p - 1, t) in out:
                out[(p, t)] = -out[(p - 1, t)]
            else:
                out[(p, t)] = 1
    return out


def load_events(path: Path, game_id: str | None = None) -> list[Event]:
    path = Path(path)
    game_id = game_id or path.stem
    rows = _read(path)
    names = _names_by_id(rows)
    dirs = _directions(rows)
    events: list[Event] = []
    for i, r in enumerate(rows):
        kind = KINDS.get(r["EventType"], "other")
        period = int(r["Period"])
        team = r["EventPrimaryTeam"] or CONTROL_SIDE.get(r["PuckControlState"], "")
        x, y = _xy(r["EventStartCoordinate"])
        if x is not None and team and dirs[(period, team)] < 0:
            x, y = -x, -y
        speed = _num(r["ShotSpeed"])
        assists = tuple(
            names[a] for a in (r["GoalAssist1Id"], r["GoalAssist2Id"]) if a and a in names
        )
        events.append(
            Event(
                game_id=game_id,
                event_id=f"{game_id}-{i}",
                clock_s=int(float(r["MatchClock"])),
                period=period,
                team=team,
                kind=kind,
                strength=r["TeamStrength"],
                player_id=r["EventPrimaryPlayerId"] or None,
                player_name=r["EventPrimaryPlayerName"] or None,
                goalie_name=(r["EventSecondaryPlayerName"] or None) if kind == "shot" else None,
                result=r["ShotResult"].lower() or None,
                xg=_num(r["ShotXG"]),
                speed_kmh=speed or None,
                reason=r["PenaltyReason"] or r["StoppageOfPlayReason"] or None,
                assists=assists,
                x=x,
                y=y,
            )
        )
    return events
