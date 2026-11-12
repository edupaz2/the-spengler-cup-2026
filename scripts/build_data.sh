#!/usr/bin/env bash
# Build the app's JSON data. Without arguments it reads the organizers' CSVs from ./raw (kept out of git);
# with --demo it uses the synthetic fixtures so a fresh clone runs without any organizer data.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
PY=${PYTHON:-.venv/bin/python}
for m in build_days cards markets; do "$PY" -m "pipeline.$m" "$@"; done
