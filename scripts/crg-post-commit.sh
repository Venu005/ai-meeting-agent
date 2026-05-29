#!/usr/bin/env bash
# code-review-graph: post-commit graph update + review artifact
# Fail open — never block git commits.
set -euo pipefail

if ! command -v code-review-graph >/dev/null 2>&1; then
  echo "crg-post-commit: code-review-graph not found on PATH; skipping graph update" >&2
  exit 0
fi

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "crg-post-commit: not inside a git repository; skipping" >&2
  exit 0
fi

SHA="$(git rev-parse HEAD)"
REVIEWS_DIR="$REPO_ROOT/.code-review-graph/reviews"
JSON_PATH="$REVIEWS_DIR/$SHA.json"
MD_PATH="$REVIEWS_DIR/$SHA.md"

mkdir -p "$REVIEWS_DIR"

if ! code-review-graph update --skip-flows --repo "$REPO_ROOT" >/dev/null 2>&1; then
  echo "crg-post-commit: graph update failed; continuing with detect-changes" >&2
fi

if ! code-review-graph detect-changes --repo "$REPO_ROOT" > "$JSON_PATH" 2>/dev/null; then
  echo "crg-post-commit: detect-changes failed" >&2
  exit 0
fi

python3 - "$JSON_PATH" "$MD_PATH" "$SHA" "$REPO_ROOT" <<'PY'
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

json_path, md_path, sha, repo_root = sys.argv[1:5]
data = json.loads(Path(json_path).read_text(encoding="utf-8"))
summary = data.get("summary", "").strip()
risk = data.get("risk_score", 0.0)
priorities = data.get("review_priorities") or []
test_gaps = data.get("test_gaps") or []
changed_functions = data.get("changed_functions") or []

lines = [
    f"# CRG Review — `{sha[:12]}`",
    "",
    f"- **Repository:** {repo_root}",
    f"- **Commit:** `{sha}`",
    f"- **Generated:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}",
    f"- **Risk score:** {risk}",
    "",
    "## Summary",
    "",
    summary or "_No summary returned._",
    "",
]

if priorities:
    lines += ["## Review priorities", ""]
    for item in priorities:
        if isinstance(item, dict):
            lines.append(f"- {item.get('message') or item.get('name') or item}")
        else:
            lines.append(f"- {item}")
    lines.append("")

if changed_functions:
    lines += ["## Changed functions", ""]
    for fn in changed_functions[:20]:
        if isinstance(fn, dict):
            lines.append(f"- `{fn.get('qualified_name') or fn.get('name') or fn}`")
        else:
            lines.append(f"- `{fn}`")
    if len(changed_functions) > 20:
        lines.append(f"- _…and {len(changed_functions) - 20} more_")
    lines.append("")

if test_gaps:
    lines += ["## Test gaps", ""]
    for gap in test_gaps[:10]:
        if isinstance(gap, dict):
            lines.append(f"- {gap.get('message') or gap.get('name') or gap}")
        else:
            lines.append(f"- {gap}")
    lines.append("")

lines += [
    "## Agent next steps",
    "",
    "1. Call `detect_changes_tool` with `base: HEAD~1`, `include_source: false`.",
    "2. If risk is elevated, call `get_review_context_tool` for changed paths only.",
    f"3. Full JSON: `.code-review-graph/reviews/{sha}.json`",
    "",
]

Path(md_path).write_text("\n".join(lines), encoding="utf-8")
PY

echo "crg-post-commit: saved review artifacts for $SHA" >&2
exit 0
