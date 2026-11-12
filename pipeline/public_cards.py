"""Cards for the hosted demo, built from public facts only (no statistics from the confidential dataset)."""
from __future__ import annotations

from pipeline.cards import PRIVATE_GOLD, Card, choice_diamond, slug
from pipeline.editions import Edition2025

FINAL_SCORE = "The final finished U.S. Collegiate Selects 3:6 HC Davos."
MOMENT_NORMAL = "A moment from the 2025 Final between the U.S. Collegiate Selects and HC Davos."


def _card(cid: str, category: str, title: str, rarity: str, team: str | None, front: list[str],
          normal: str, silver: str, diamond: dict) -> Card:
    return Card(id=cid, category=category, title=title, rarity=rarity, team=team, front=front,
                back={"normal": normal, "silver": silver, "gold": dict(PRIVATE_GOLD), "diamond": diamond},
                statsHidden=True)


def public_cards(edition: Edition2025, spec: dict) -> list[Card]:
    teams = [t["name"] for t in edition.teams]
    facts = {t["name"]: t["fact"] for t in edition.teams}
    cards = []
    for p in spec["players"]:
        cid = f"player-{slug(p['name'])}"
        cards.append(_card(
            cid, "player", p["name"], p["rarity"], p["team"], [f"#{p['number']} · {p['team']}"],
            f"{p['name']} wore #{p['number']} for {p['team']} at the 2025 Spengler Cup.", facts[p["team"]],
            choice_diamond(cid, f"Which team did {p['name']} play for?", p["team"], teams)))
    for g in spec["goalies"]:
        cid = f"goalie-{slug(g['name'])}"
        cards.append(_card(
            cid, "goalie", g["name"], "epic", g["team"], [f"Goalie · {g['team']}"],
            f"{g['name']} kept goal for {g['team']} in the 2025 Final.", facts[g["team"]],
            choice_diamond(cid, f"Which team did {g['name']} play for?", g["team"], teams)))
    for m in spec["moments"]:
        cards.append(_card(
            m["id"], "moment", m["title"], m["rarity"], m["team"], list(m["front"]), MOMENT_NORMAL, FINAL_SCORE,
            choice_diamond(m["id"], "Who won the 2025 Final?", "HC Davos", teams)))
    return cards
