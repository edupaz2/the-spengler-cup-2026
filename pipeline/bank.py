"""Hand-written and data-generated questions for Hockey 101 and Tournament History."""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from pipeline.editions import EditionRow, load_history, titles

CATEGORIES = {"rules.yaml": "rules", "history.yaml": "history"}


class BankError(Exception):
    """Raised with one line for every invalid question."""


@dataclass
class BankQuestion:
    id: str
    category: str  # "rules" | "history"
    prompt: str
    options: list[str]
    answerIndex: int
    why: str
    difficulty: int
    source: str
    kind: str = "bank"
    template: str | None = None


def _validate(raw: dict, category: str) -> tuple[BankQuestion | None, list[str]]:
    qid = raw.get("id", "<no id>")
    problems = []
    for key in ("prompt", "why", "source"):
        if not raw.get(key):
            problems.append(f"missing {key}")
    options = raw.get("options")
    if not isinstance(options, list) or len(options) != 4 or len({str(o) for o in options}) != 4:
        problems.append("options must be 4 distinct values")
        options = options if isinstance(options, list) else []
    if raw.get("difficulty") not in (1, 2, 3):
        problems.append("difficulty must be 1, 2 or 3")
    idx = raw.get("answerIndex")
    if idx is None and "answer" in raw:
        idx = options.index(raw["answer"]) if raw["answer"] in options else None
    if not isinstance(idx, int) or not 0 <= idx < len(options):
        problems.append("answerIndex out of range")
    if problems:
        return None, [f"{qid}: {p}" for p in problems]
    return (
        BankQuestion(
            id=qid, category=category, prompt=raw["prompt"], options=[str(o) for o in options],
            answerIndex=idx, why=raw["why"], difficulty=raw["difficulty"], source=raw["source"],
            template=raw.get("template"),
        ),
        [],
    )


def _arrange(qid: str, answer: str, distractors: list[str], numeric: bool = False) -> dict:
    options = [answer, *distractors[:3]]
    if numeric:
        options.sort(key=float)
    else:
        random.Random(qid).shuffle(options)
    return {"options": options, "answer": answer}


def _expand(raw: dict, rows: list[EditionRow]) -> dict:
    """Turn a template entry into a plain question using the year-by-year data."""
    by_year = {r.year: r for r in rows}
    t = titles(rows)
    qid, kind = raw["id"], raw["template"]
    winners = sorted({w for r in rows for w in r.winners})
    if kind == "winner_of_year":
        r = by_year[raw["year"]]
        (win,) = r.winners
        others = random.Random(qid).sample([w for w in winners if w != win], 3)
        why = f"{win} won in {r.year}" + (f", beating {r.runner_up} in the final." if r.runner_up else ".")
        if r.note:
            why += f" {r.note}."
        return {**raw, "prompt": f"Who won the Spengler Cup in {r.year}?", "why": why, **_arrange(qid, win, others)}
    if kind == "runner_up_of_year":
        r = by_year[raw["year"]]
        others = random.Random(qid).sample([x for x in sorted({x.runner_up for x in rows if x.runner_up}) if x != r.runner_up], 3)
        why = f"{r.winners[0]} beat {r.runner_up} in the {r.year} final."
        return {**raw, "prompt": f"Who lost the {r.year} Spengler Cup final?", "why": why, **_arrange(qid, r.runner_up, others)}
    if kind == "most_titles":
        ranked = sorted(t.items(), key=lambda kv: (-kv[1], kv[0]))
        why = "Titles: " + ", ".join(f"{n} {c}" for n, c in ranked[:4]) + "."
        return {**raw, "prompt": "Which team has won the most Spengler Cups?", "why": why,
                **_arrange(qid, ranked[0][0], [n for n, _ in ranked[1:4]])}
    if kind == "titles_of":
        n = t[raw["team"]]
        return {**raw, "prompt": f"How many Spengler Cups has {raw['team']} won (through 2025)?",
                "why": f"{raw['team']} has {n} titles.", **_arrange(qid, str(n), [str(n - 2), str(n + 2), str(n + 4)], numeric=True)}
    if kind == "year_not_held":
        r = by_year[raw["year"]]
        played = [y for y, x in by_year.items() if x.winners and abs(y - r.year) <= 12]
        others = random.Random(qid).sample(played, 3)
        return {**raw, "prompt": "In which of these years was the Spengler Cup not played?",
                "why": f"{r.year}: {r.note}.", **_arrange(qid, str(r.year), [str(y) for y in others], numeric=True)}
    raise BankError(f"{qid}: unknown template {kind}")


def load_bank(dir: Path, history_csv: Path | None = None) -> list[BankQuestion]:
    dir = Path(dir)
    history_csv = history_csv or dir.parent / "history" / "editions.csv"
    rows = load_history(history_csv) if history_csv.exists() else None
    bank: list[BankQuestion] = []
    errors: list[str] = []
    for fname, category in CATEGORIES.items():
        for raw in yaml.safe_load((dir / fname).read_text(encoding="utf-8")) or []:
            if "template" in raw:
                if rows is None:
                    errors.append(f"{raw.get('id')}: template needs {history_csv}")
                    continue
                try:
                    raw = _expand(raw, rows)
                except (KeyError, ValueError, BankError) as exc:
                    errors.append(f"{raw.get('id')}: template failed ({exc})")
                    continue
            q, problems = _validate(raw, category)
            errors += problems
            if q:
                bank.append(q)
    ids = [q.id for q in bank]
    errors += [f"{i}: duplicate id" for i in sorted({i for i in ids if ids.count(i) > 1})]
    if errors:
        raise BankError("\n".join(errors))
    return bank


def pick_daily(date: str, bank: list[BankQuestion], per_category: int = 1) -> list[BankQuestion]:
    picked: list[BankQuestion] = []
    for cat in sorted({q.category for q in bank}):
        pool = sorted((q for q in bank if q.category == cat), key=lambda q: q.id)
        picked += random.Random(f"{date}|{cat}").sample(pool, min(per_category, len(pool)))
    return picked
