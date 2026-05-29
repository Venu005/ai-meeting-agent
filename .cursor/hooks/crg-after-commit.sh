#!/usr/bin/env bash
# Cursor hook: nudge agent to run CRG post-commit review after git commit
set -euo pipefail

INPUT="$(cat)"

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  exit 0
fi

SHA="$(git rev-parse HEAD 2>/dev/null || true)"
if [ -z "$SHA" ]; then
  exit 0
fi

ARTIFACT=".code-review-graph/reviews/$SHA.md"
JSON_ARTIFACT=".code-review-graph/reviews/$SHA.json"

python3 - "$SHA" "$ARTIFACT" "$JSON_ARTIFACT" "$REPO_ROOT" <<'PY'
import json
import sys

sha, artifact, json_artifact, repo_root = sys.argv[1:5]
context = (
    f"A git commit just completed ({sha[:12]}). "
    "Follow the post-commit CRG review workflow in AGENTS.md:\n"
    f"1. Read `{artifact}` (fallback: `{json_artifact}`).\n"
    "2. Call detect_changes_tool with base HEAD~1, include_source false.\n"
    "3. If risk is elevated, call get_review_context_tool for changed paths only.\n"
    f"repo_root: {repo_root}"
)
print(json.dumps({"additional_context": context}))
PY

exit 0
