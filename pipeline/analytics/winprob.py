"""Win probability from goal difference and time left, and the goal that swung a game most."""
from __future__ import annotations

import math
from dataclasses import dataclass

from pipeline.schema import Event

GAME_SECONDS = 3600
PERIOD_SECONDS = 1200
GOAL_RATE_PER_GAME = 6.0  # both teams combined; sets how fast a lead becomes safe


@dataclass(frozen=True)
class TurningPoint:
    clock_s: int  # elapsed game seconds
    delta: float  # win-probability gain of the scoring team
    goal_event_id: str
    team: str


def _phi(z: float) -> float:
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def win_probability(goal_diff: int, seconds_remaining: int) -> float:
    if seconds_remaining <= 0:
        return 0.5 if goal_diff == 0 else (1.0 if goal_diff > 0 else 0.0)
    sigma = math.sqrt(GOAL_RATE_PER_GAME * seconds_remaining / GAME_SECONDS)
    return _phi(goal_diff / sigma)


def _elapsed(e: Event) -> int:
    return (e.period - 1) * PERIOD_SECONDS + e.clock_s


def _goals(events: list[Event]) -> list[Event]:
    return sorted((e for e in events if e.kind == "goal"), key=_elapsed)


def timeline(events: list[Event], home: str) -> list[tuple[int, float]]:
    """Win probability of side `home` ("Home" or "Away") at the start and after each goal."""
    out = [(0, 0.5)]
    diff = 0
    for g in _goals(events):
        diff += 1 if g.team == home else -1
        t = _elapsed(g)
        out.append((t, win_probability(diff, GAME_SECONDS - t)))
    return out


def turning_point(events: list[Event]) -> TurningPoint | None:
    goals = _goals(events)
    if len(goals) < 2:
        return None
    best: TurningPoint | None = None
    diff = 0  # Home minus Away
    for g in goals:
        t = _elapsed(g)
        scorer_sign = 1 if g.team == "Home" else -1
        before = win_probability(scorer_sign * diff, GAME_SECONDS - t)
        diff += scorer_sign
        after = win_probability(scorer_sign * diff, GAME_SECONDS - t)
        if best is None or after - before > best.delta:
            best = TurningPoint(t, after - before, g.event_id, g.team)
    return best
