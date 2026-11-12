"""Shot quality, player impact, box scores and goalie lines from events."""
from __future__ import annotations

import math

from pipeline.schema import Event

GOAL_X = 26.0  # metres from centre ice to the goal line
XG_MODEL = {"b0": -0.4, "dist": 0.14, "angle": 1.0}
DEFAULT_XG = 0.03  # a shot with no coordinates and no xG
ASSIST_WINDOW_S = 5
ON_GOAL = ("saved", "goal")


def fallback_xg(x: float, y: float) -> float:
    dist = math.hypot(GOAL_X - x, y)
    angle = math.atan2(abs(y), max(GOAL_X - x, 0.01))
    z = XG_MODEL["b0"] - XG_MODEL["dist"] * dist - XG_MODEL["angle"] * angle
    return 1 / (1 + math.exp(-z))


def shot_xg(e: Event) -> float:
    if e.xg is not None:
        return e.xg
    if e.x is None or e.y is None:
        return DEFAULT_XG
    return fallback_xg(e.x, e.y)


def player_impact(game_events: list[Event], player_name: str) -> float:
    """Own shot xG plus the xG of teammates' shots within 5 s after the player's pass."""
    shots = [e for e in game_events if e.kind == "shot"]
    total = sum(shot_xg(s) for s in shots if s.player_name == player_name)
    for p in (e for e in game_events if e.kind == "pass" and e.player_name == player_name):
        for s in shots:
            if (
                s.team == p.team
                and s.period == p.period
                and s.player_name != player_name
                and 0 <= s.clock_s - p.clock_s <= ASSIST_WINDOW_S
            ):
                total += shot_xg(s)
    return total


def box_score(game_events: list[Event], player_name: str) -> dict[str, int]:
    goals = assists = shots = 0
    for e in game_events:
        if e.kind == "goal":
            goals += e.player_name == player_name
            assists += player_name in e.assists
        elif e.kind == "shot" and e.player_name == player_name:
            shots += 1
    return {"goals": goals, "assists": assists, "shots": shots}


def goalie_line(game_events: list[Event], goalie_name: str) -> dict[str, int]:
    faced = [e for e in game_events if e.kind == "shot" and e.goalie_name == goalie_name and e.result in ON_GOAL]
    goals = sum(e.result == "goal" for e in faced)
    return {"saves": len(faced) - goals, "shots_against": len(faced), "goals_against": goals}
