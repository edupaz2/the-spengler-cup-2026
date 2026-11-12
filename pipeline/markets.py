"""Prediction markets with odds from team strength, and the results that settle them."""
from __future__ import annotations

import argparse
import glob
import json
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path

from pipeline.analytics.xg import player_impact
from pipeline.inputs import event_and_stats_paths
from pipeline.cards import slug
from pipeline.editions import Edition2025, Game2025, load_edition2025
from pipeline.load_events import load_events
from pipeline.load_stats import load_player_stats
from pipeline.questions import roster
from pipeline.schema import Event, PlayerLine

ROOT = Path(__file__).resolve().parents[1]
STRENGTH_K = 0.8  # how fast a goal-difference gap becomes a win probability
MARGIN = 0.10
ODDS_FLOOR = 1.1
STAR_OPTIONS = 3


@dataclass
class Market:
    id: str
    kind: str  # winner | star | powerplay
    date: str
    gameId: str
    lockAt: str
    options: list[dict]

    def to_json(self) -> dict:
        return asdict(self)


def odds_from_strength(a: float, b: float, margin: float = MARGIN) -> tuple[float, float]:
    """Decimal odds for two sides; implied probabilities sum to 1 + margin."""
    pa = 1 / (1 + math.exp(-STRENGTH_K * (a - b)))
    return tuple(round(max(ODDS_FLOOR, 1 / (p * (1 + margin))), 2) for p in (pa, 1 - pa))  # type: ignore[return-value]


def team_strength(played: list[Game2025]) -> dict[str, float]:
    diff: dict[str, int] = {}
    n: dict[str, int] = {}
    for g in played:
        hs, as_ = g.score
        for team, d in ((g.home, hs - as_), (g.away, as_ - hs)):
            diff[team] = diff.get(team, 0) + d
            n[team] = n.get(team, 0) + 1
    return {t: diff[t] / n[t] for t in diff}


def _lock(g: Game2025) -> str:
    return f"{g.date}T{g.start}:00+01:00"  # the tournament is played in winter (CET)


def _star_pool(events, stats) -> list[tuple[str, str, float]]:
    ranked = sorted(
        ((f"{r['line'].first_name} {r['line'].last_name}", player_impact(events, r["name"])) for r in roster(events, stats)),
        key=lambda x: (-x[1], x[0]),
    )
    return [(slug(n), n, i) for n, i in ranked[:STAR_OPTIONS]]


def _pp_rate(box: dict, side: str) -> float:
    goals, chances = box["power_play"][side]
    return goals / chances if chances else 0.0


def build_markets(
    date: str, games: list[Game2025], events: list[Event] | None, stats: list[PlayerLine] | None,
    played: list[Game2025] | None = None, final_box: dict | None = None, detail_game_id: int = 11,
) -> list[Market]:
    strength = team_strength(played or [])
    out: list[Market] = []
    for g in games:
        gid = f"g{g.id}"
        oh, oa = odds_from_strength(strength.get(g.home, 0.0), strength.get(g.away, 0.0))
        teams = [{"id": "home", "label": g.home, "odds": oh}, {"id": "away", "label": g.away, "odds": oa}]
        out.append(Market(f"{date}-{gid}-winner", "winner", date, gid, _lock(g), teams))
        if g.id != detail_game_id or events is None or stats is None:
            continue
        pool = _star_pool(events, stats)
        flat = round(max(ODDS_FLOOR, 1 / ((1 / len(pool)) * (1 + MARGIN))), 2)
        options = [{"id": i, "label": n, "odds": flat} for i, n, _ in pool]
        random.Random(f"{date}|{gid}|star").shuffle(options)
        out.append(Market(f"{date}-{gid}-star", "star", date, gid, _lock(g), options))
        if final_box:
            out.append(Market(f"{date}-{gid}-powerplay", "powerplay", date, gid, _lock(g), [dict(t) for t in teams]))
    return out


def build_results(
    date: str, games: list[Game2025], events: list[Event] | None, stats: list[PlayerLine] | None,
    final_box: dict | None = None, detail_game_id: int = 11,
) -> dict[str, str]:
    results: dict[str, str] = {}
    for g in games:
        gid = f"g{g.id}"
        hs, as_ = g.score
        if hs != as_:
            results[f"{date}-{gid}-winner"] = "home" if hs > as_ else "away"
        if g.id != detail_game_id or events is None or stats is None:
            continue
        results[f"{date}-{gid}-star"] = _star_pool(events, stats)[0][0]
        if final_box:
            h, a = _pp_rate(final_box, "home"), _pp_rate(final_box, "away")
            if h != a:
                results[f"{date}-{gid}-powerplay"] = "home" if h > a else "away"
    return results


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--data", default=None, help="folder with the organizers' CSVs (default: ./raw)")
    p.add_argument("--demo", action="store_true", help="use the synthetic fixtures instead of organizer data")
    p.add_argument("--out", default=str(ROOT / "app" / "public" / "data" / "markets"))
    a = p.parse_args()
    events_csv, stats_csv = event_and_stats_paths(a.data, a.demo)
    # The demo fixtures hold invented players on real teams: build only results-based content from them.
    events = None if a.demo else load_events(events_csv, "g11")
    stats = None if a.demo else load_player_stats(stats_csv)
    edition: Edition2025 = load_edition2025(ROOT / "content" / "edition2025.yaml")
    final_date = max(g.date for g in edition.games)
    dates = sorted({g.date for g in edition.games})
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for d in dates:
        games = [g for g in edition.games if g.date == d]
        played = [g for g in edition.games if g.date < d]
        doc = {
            "date": d,
            "markets": [m.to_json() for m in build_markets(d, games, events, stats, played, edition.final_box)],
            "results": build_results(d, games, events, stats, edition.final_box),
        }
        (out / f"{d}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "sample.json").write_text((out / f"{final_date}.json").read_text(encoding="utf-8"), encoding="utf-8")
    print("wrote", len(dates), "market days to", out)


if __name__ == "__main__":
    main()
