# Code-Review-Graph Post-Commit Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire code-review-graph into ai-meeting-agent so every git commit updates the knowledge graph, saves review
artifacts, and nudges Cursor agents to run MCP-based post-commit review.

**Architecture:** A Husky `post-commit` hook runs `scripts/crg-post-commit.sh` (graph update + detect-changes → JSON/md
artifacts). Cursor gets `.cursor/mcp.json`, `AGENTS.md` rules, and an `afterShellExecution` hook that injects review
context after `git commit`. All hooks fail open.

**Tech Stack:** bash, Husky 9, code-review-graph CLI (pipx/uv), Cursor hooks (JSON stdin/stdout), MCP stdio via
`uvx code-review-graph serve`

**Spec:** `docs/superpowers/specs/2026-05-29-code-review-graph-post-commit-design.md`

---

## File Map

| File                                | Action | Responsibility                                 |
| ----------------------------------- | ------ | ---------------------------------------------- |
| `.gitignore`                        | Modify | Ignore `.code-review-graph/`                   |
| `scripts/crg-post-commit.sh`        | Create | Graph update, detect-changes, artifact writers |
| `.husky/post-commit`                | Create | Invoke post-commit script                      |
| `.cursor/mcp.json`                  | Create | Register CRG MCP server                        |
| `AGENTS.md`                         | Create | CRG-first rules + post-commit agent workflow   |
| `.cursor/hooks.json`                | Create | Register afterShellExecution hook              |
| `.cursor/hooks/crg-after-commit.sh` | Create | Inject additional_context after git commit     |

---

### Task 1: Gitignore and scripts directory

**Files:**

- Modify: `.gitignore`
- Create: `scripts/` (directory via first script file)

- [ ] **Step 1: Add CRG ignore entry to `.gitignore`**

Append after the `# Misc` section:

```gitignore
# code-review-graph (local graph DB + review artifacts)
.code-review-graph/
```

- [ ] **Step 2: Verify ignore works**

Run:

```bash
git check-ignore -v .code-review-graph/graph.db
```

Expected: `.gitignore:NN:.code-review-graph/` (line number may vary)

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore code-review-graph local data"
```

---

### Task 2: Post-commit script

**Files:**

- Create: `scripts/crg-post-commit.sh`

- [ ] **Step 1: Create the script**

Create `scripts/crg-post-commit.sh` with this exact content:

```bash
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
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/crg-post-commit.sh
```

- [ ] **Step 3: Smoke-test the script directly**

Run:

```bash
./scripts/crg-post-commit.sh
echo "exit: $?"
ls -la .code-review-graph/reviews/ | tail -3
```

Expected:

- Exit code `0`
- stderr contains `saved review artifacts for <sha>`
- Latest `.json` and `.md` files exist for current `HEAD`

- [ ] **Step 4: Commit**

```bash
git add scripts/crg-post-commit.sh
git commit -m "feat: add CRG post-commit review artifact script"
```

---

### Task 3: Husky post-commit hook

**Files:**

- Create: `.husky/post-commit`

- [ ] **Step 1: Create `.husky/post-commit`**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

"$(dirname -- "$0")/../scripts/crg-post-commit.sh"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x .husky/post-commit
```

- [ ] **Step 3: Verify hook is registered**

Run:

```bash
test -x .husky/post-commit && echo "post-commit hook: OK"
```

Expected: `post-commit hook: OK`

- [ ] **Step 4: End-to-end test via git commit**

Run:

```bash
git commit --allow-empty -m "test: verify CRG post-commit hook"
SHA=$(git rev-parse HEAD)
test -f ".code-review-graph/reviews/$SHA.json" && test -f ".code-review-graph/reviews/$SHA.md" && echo "artifacts: OK"
```

Expected: `artifacts: OK`

- [ ] **Step 5: Commit**

```bash
git add .husky/post-commit
git commit -m "feat: run CRG graph update on post-commit"
```

Note: Step 5's commit itself triggers the hook — confirm artifacts for that commit SHA exist after.

---

### Task 4: Cursor MCP configuration

**Files:**

- Create: `.cursor/mcp.json`

- [ ] **Step 1: Create `.cursor/mcp.json`**

```json
{
  "mcpServers": {
    "code-review-graph": {
      "command": "uvx",
      "args": ["code-review-graph", "serve"],
      "type": "stdio"
    }
  }
}
```

- [ ] **Step 2: Verify MCP server starts**

Run:

```bash
timeout 3 uvx code-review-graph serve 2>&1 | head -1 || true
```

Expected: process starts without immediate error (stdio server may appear silent; timeout exit is fine)

- [ ] **Step 3: Commit**

```bash
git add .cursor/mcp.json
git commit -m "feat: register code-review-graph MCP server for Cursor"
```

---

### Task 5: AGENTS.md with CRG workflow

**Files:**

- Create: `AGENTS.md`

- [ ] **Step 1: Create `AGENTS.md`**

```markdown
# AGENTS.md

Guidance for AI agents working in **ai-meeting-agent** (pnpm monorepo: Next.js 15 frontend, NestJS 11 backend, Prisma).

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the code-review-graph MCP tools BEFORE using Grep/Glob/Read
to explore the codebase.** The graph is faster, cheaper (fewer tokens), and gives you structural context (callers,
dependents, test coverage) that file scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                             | Use when                                               |
| -------------------------------- | ------------------------------------------------------ |
| `detect_changes_tool`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context_tool`        | Need source snippets for review — token-efficient      |
| `get_impact_radius_tool`         | Understanding blast radius of a change                 |
| `get_affected_flows_tool`        | Finding which execution paths are impacted             |
| `query_graph_tool`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview_tool` | Understanding high-level codebase structure            |
| `build_or_update_graph_tool`     | Initialize or refresh graph if stale                   |

### Workflow

1. The graph auto-updates after every git commit (via Husky post-commit hook).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

### After every git commit (agent workflow)

Right after any commit lands (or when the user asks for a post-commit review), run **code-review-graph** before broad
file reads:

1. Read `.code-review-graph/reviews/<HEAD-sha>.md` (fallback: `.json`) for the saved artifact from the post-commit hook.
2. Call **`detect_changes_tool`** with `base: HEAD~1`, **`include_source: false`**, `max_depth: 2`, and `repo_root` set
   to this repo (`/home/venusai/Desktop/skill-enhance/ai-meeting-agent`). Rely on risk score and `review_priorities`
   first.
3. If **`review_priorities`** is non-empty, **`risk_score`** is elevated, or the user wants line-level detail, call
   **`get_review_context_tool`** with `include_source: true` and `max_lines_per_file` of 120–200 **only for changed
   paths**.
4. Commits that touch **only docs/markdown** may show zero graph nodes and risk 0 — summarize that for the user instead
   of forcing file-wide reads.

Follow steps 1–4 by default after commits in this project.
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md with CRG-first exploration and post-commit review"
```

---

### Task 6: Cursor afterShellExecution hook

**Files:**

- Create: `.cursor/hooks.json`
- Create: `.cursor/hooks/crg-after-commit.sh`

- [ ] **Step 1: Create `.cursor/hooks/crg-after-commit.sh`**

```bash
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
```

- [ ] **Step 2: Make executable**

```bash
chmod +x .cursor/hooks/crg-after-commit.sh
```

- [ ] **Step 3: Create `.cursor/hooks.json`**

```json
{
  "version": 1,
  "hooks": {
    "afterShellExecution": [
      {
        "command": ".cursor/hooks/crg-after-commit.sh",
        "matcher": "git\\s+commit",
        "timeout": 15
      }
    ]
  }
}
```

- [ ] **Step 4: Smoke-test hook script**

Run:

```bash
echo '{"command":"git commit -m test"}' | .cursor/hooks/crg-after-commit.sh
```

Expected: JSON on stdout with `"additional_context"` containing commit SHA and artifact paths.

- [ ] **Step 5: Commit**

```bash
git add .cursor/hooks.json .cursor/hooks/crg-after-commit.sh
git commit -m "feat: nudge Cursor agent for CRG review after git commit"
```

---

### Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run full manual test checklist from spec**

```bash
# 1. Post-commit artifacts
git commit --allow-empty -m "test: final CRG verification"
SHA=$(git rev-parse HEAD)
test -f ".code-review-graph/reviews/$SHA.json" && test -f ".code-review-graph/reviews/$SHA.md" && echo "PASS: artifacts"

# 2. Graph refreshed
code-review-graph status --repo . | grep -i "last updated" && echo "PASS: status"

# 3. Cursor hook output
echo '{"command":"git commit -m foo"}' | .cursor/hooks/crg-after-commit.sh | python3 -c "import json,sys; d=json.load(sys.stdin); assert 'additional_context' in d; print('PASS: cursor hook')"

# 4. Fail-open when CRG missing (optional — only if safe to test)
# PATH_SAVE=$PATH; export PATH=/usr/bin:/bin
# ./scripts/crg-post-commit.sh; echo "exit: $?"
# export PATH=$PATH_SAVE
```

Expected: three `PASS:` lines (or four if fail-open test run)

- [ ] **Step 2: Confirm no spec files left uncommitted**

```bash
git status --short
```

Expected: clean working tree for CRG-related files (unrelated local changes may remain)

---

## Spec Coverage Checklist

| Spec requirement                             | Task                           |
| -------------------------------------------- | ------------------------------ |
| `.gitignore` for `.code-review-graph/`       | Task 1                         |
| `scripts/crg-post-commit.sh`                 | Task 2                         |
| `.husky/post-commit`                         | Task 3                         |
| `.cursor/mcp.json`                           | Task 4                         |
| `AGENTS.md` CRG rules + post-commit workflow | Task 5                         |
| `.cursor/hooks.json` + `crg-after-commit.sh` | Task 6                         |
| Fail open on missing CRG                     | Task 2 (script), Task 6 (hook) |
| `--skip-flows` on update                     | Task 2                         |
| JSON + MD artifacts                          | Task 2                         |
| Manual testing checklist                     | Task 7                         |

## Prerequisites (developer setup)

```bash
pipx install code-review-graph
# or: uv tool install code-review-graph
```

Restart Cursor after MCP/hooks files are added so `.cursor/mcp.json` and `.cursor/hooks.json` reload.
