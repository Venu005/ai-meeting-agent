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
