import json
from pathlib import Path

import jsonschema

from pipeline.cards import CATEGORIES, build_catalog, build_sets, image_slug, rarity_for
from pipeline.editions import load_edition2025, load_history
from pipeline.tests.synthetic import match

import yaml

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "schema" / "card.schema.json").read_text())


def catalog():
    stats, events = match()
    return build_catalog(
        events, stats,
        yaml.safe_load((ROOT / "content" / "rules.yaml").read_text(encoding="utf-8")),
        yaml.safe_load((ROOT / "content" / "achievements.yaml").read_text(encoding="utf-8")),
        load_edition2025(ROOT / "content" / "edition2025.yaml"),
        load_history(ROOT / "content" / "history" / "editions.csv"),
    )


def test_rarity_cutoffs():
    assert [rarity_for(p) for p in (0, 69.9, 70, 89.9, 90, 97.9, 98, 100)] == [
        "common", "common", "rare", "rare", "epic", "epic", "legendary", "legendary"]


def test_catalog_validates_against_schema():
    cat = catalog()
    jsonschema.validate({"cards": [c.to_json() for c in cat], "sets": [s.to_json() for s in build_sets(cat)]}, SCHEMA)


def test_every_card_has_four_backs():
    for c in catalog():
        b = c.back
        assert b["normal"] and b["silver"], c.id
        assert b["gold"]["text"] and b["gold"]["visual"] in ("timeline", "shotmap", "table"), c.id
        d = b["diamond"]
        assert d["question"] and len(d["options"]) == 4 and 0 <= d["answerIndex"] < 4, c.id


def test_catalog_ids_unique():
    ids = [c.id for c in catalog()]
    assert len(ids) == len(set(ids))


def test_all_categories_present():
    assert {c.category for c in catalog()} == set(CATEGORIES)


def test_one_gotd_card_per_game_day():
    gotd = sorted(c.availableOn for c in catalog() if c.category == "gotd")
    assert gotd == ["2025-12-27", "2025-12-28", "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01"]


def test_achievement_cards_have_unlock_and_no_date():
    ach = [c for c in catalog() if c.category == "achievement"]
    assert len(ach) == 6 and all(c.unlock and c.availableOn is None for c in ach)
    assert all(c.unlock is None for c in catalog() if c.category != "achievement")


def test_sets_reference_existing_cards():
    cat = catalog()
    ids = {c.id for c in cat}
    sets = build_sets(cat)
    assert {"rulebook", "crease", "every-game-day", "trophy-cabinet"} <= {s.id for s in sets}
    for s in sets:
        assert s.cardIds and set(s.cardIds) <= ids and s.reward["pucks"] > 0
    assert next(s for s in sets if s.id == "rulebook").cardIds == sorted(c.id for c in cat if c.category == "rule")


def test_image_slug_matches_asset_names():
    assert image_slug("U.S. Collegiate Selects") == "us-collegiate-selects"
    assert image_slug("Expected goals (xG)") == "expected-goals-xg"
    assert image_slug("Marcus Sörensen") == "marcus-sorensen"
    assert image_slug("HC Fribourg-Gottéron") == "hc-fribourg-gotteron"


def test_every_card_has_an_image_slug():
    by_id = {c.id: c for c in catalog()}
    assert by_id["team-hc-davos"].image == "team_hc-davos"
    assert by_id["rule-icing"].image == "rules-and-concepts_icing"
    assert by_id["gotd-2025-12-26"].image == "game-of-the-day_team-canada-vs-us-collegiate-selects"
    assert by_id["ach-streak3"].image == "achievement_three-in-a-row"
    assert all(c.image for c in by_id.values())
