"""Small invented match used to test builders that need events and stats."""
from pipeline.schema import SIDES, Event, PlayerLine

NAMES = [("Ann", "Home"), ("Bob", "Home"), ("Cid", "Home"), ("Dee", "Home"),
         ("Eli", "Away"), ("Fay", "Away"), ("Gus", "Away"), ("Hal", "Away")]


def match():
    lines, events = [], []
    for i, (n, side) in enumerate(NAMES, start=1):
        lines.append(PlayerLine(SIDES[side], i, n, "Test", {
            "TOI (s)": 800 + i * 10, "Shifts": 20 + i, "SPD TOP (km/h)": 30 + i * 0.5,
            "S": i, "G": i % 2, "A": 1, "P": 1 + i % 2, "PIM": 2 * (i % 3), "Dist (m)": 4000 + i,
        }))
        for k in range(i):
            events.append(Event("g", f"s{i}-{k}", 100 + k, 1, side, "shot", "5v5", player_name=f"#{i} {n} Test",
                                result="saved", xg=0.1, x=20.0, y=float(k), goalie_name="#30 Adam Gajan" if side == "Away" else "#29 Sandro Aeschlimann"))
    for eid, period, clock, side, name in [("g1", 1, 300, "Home", "#1 Ann Test"), ("g2", 2, 400, "Away", "#5 Eli Test"),
                                           ("g3", 3, 1000, "Away", "#6 Fay Test"), ("g4", 3, 1100, "Away", "#5 Eli Test")]:
        events.append(Event("g", eid, clock, period, side, "goal", "5v5", player_name=name, assists=("#2 Bob Test",) if side == "Home" else ()))
    return lines, events
