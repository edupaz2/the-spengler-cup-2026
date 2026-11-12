"""Typed records shared by every pipeline stage."""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# In the Wisehockey export the Final's "Home" side is the U.S. Collegiate Selects.
SIDES = {"Home": "U.S. Collegiate Selects", "Away": "HC Davos"}


@dataclass(frozen=True)
class Event:
    game_id: str
    event_id: str
    clock_s: int
    period: int
    team: str  # "Home", "Away" or "" when the row has no acting team
    kind: str
    strength: str
    player_id: str | None = None
    player_name: str | None = None
    goalie_name: str | None = None  # secondary player on shot rows
    result: str | None = None  # shot result: saved, missed, blocked, goal
    xg: float | None = None
    speed_kmh: float | None = None
    reason: str | None = None  # penalty or stoppage reason
    assists: tuple[str, ...] = field(default_factory=tuple)
    x: float | None = None  # metres, centre ice origin, attacking toward +x
    y: float | None = None


@dataclass(frozen=True)
class PlayerLine:
    team: str
    jersey: int
    last_name: str
    first_name: str
    stats: dict[str, float]


def join_key(side: str, event_name: str) -> tuple[str, int]:
    """Key matching an event player ("#19 Adam Tambellini") to a PlayerLine."""
    m = re.match(r"#(\d+)\b", event_name)
    if not m:
        raise ValueError(f"no jersey number in {event_name!r}")
    return SIDES[side], int(m.group(1))
