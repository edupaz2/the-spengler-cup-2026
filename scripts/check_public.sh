#!/usr/bin/env bash
# Fails if git tracks files that must stay private: organizer data, documents, screenshots, video.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
bad=$(git ls-files | grep -E '\.(xlsx|pdf|png|mp4|csv|pptx)$' \
  | grep -v -E '^(app/public/|content/history/|pipeline/tests/fixtures/|docs/submission/)' || true)
bad="$bad"$'\n'$(git ls-files | grep -E 'OneDrive|Screenshot|SIC_DataHack' || true)
bad="$bad"$'\n'$(git ls-files | grep -E '^app/public/data/' || true)
bad="$bad"$'\n'$(git ls-files | grep -E '^spengler_2025_259_ASSETS_UPDATED_MASTER_QA_CANDIDATE' || true)
bad=$(printf '%s\n' "$bad" | sed '/^$/d' | sort -u)
if [ -n "$bad" ]; then
  echo "Private files are tracked:" >&2
  printf '%s\n' "$bad" >&2
  exit 1
fi
echo "check_public: ok"
