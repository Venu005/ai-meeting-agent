# Structured Meeting Notes — Design Spec

**Date:** 2026-05-31  
**Status:** Approved (self-reviewed)  
**Scope:** Read-only Notes tab — reference-style layout with persona-aware subheadings

---

## Summary

Replace the current flat markdown display in the meeting Notes tab with a single, polished document layout matching the
reference UI: numbered key takeaways, structured sections (Topics Discussed, Q&A, Action Items), and a persona-specific
document block (Product Spec / PRD / Technical RFC). No TipTap, no editing, no DB schema changes.

---

## Decisions

| Topic            | Decision                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Interaction      | Read-only display (no user editing in v1)                                                                |
| Editor           | None — rich markdown rendering, not TipTap                                                               |
| Data model       | Keep existing fields: `keyPoints` (JSON array), `notes` (text), `structuredDoc` (text)                   |
| Layout           | Single flowing card (Option A), not three separate titled blocks                                         |
| Persona headings | Persona-specific title + sections from agent prompts (trimmed — see dedup rule)                          |
| Persona source   | Signed-in user's `persona` from `AuthContext` (`UserProfile.persona`)                                    |
| Action items     | Live only in `notes` (`## Next Steps & Action Items`); removed from persona prompts to avoid duplication |
| Out of scope     | Reprocessing old meetings, editable notes, JSON schema migration, Transcript tab changes                 |

---

## Notes tab layout

One scrollable card inside the existing Notes tab. Render order:

1. **Card title:** `Generated notes` (single `h2`)
2. **Key Takeaways** — custom numbered list from `keyPoints[]` (not markdown h2)
3. **Meeting body** — entire `notes` string rendered in one `MeetingNotesMarkdown` pass (contains `## Topics Discussed`,
   `## Questions & Answers`, `## Next Steps & Action Items` as the model outputs them)
4. **Divider** — only if `structuredDoc` is present
5. **Persona doc title** — mapped label (e.g. PRD), then entire `structuredDoc` in one `MeetingNotesMarkdown` pass

```
┌─────────────────────────────────────────┐
│  Generated notes          (card h2)     │
├─────────────────────────────────────────┤
│  Key Takeaways          (keyPoints[])   │
│  ① **Label:** detail    (inline md)     │
├─────────────────────────────────────────┤
│  {notes markdown — single render}       │
│  ## Topics Discussed                    │
│  ## Questions & Answers                 │
│  ## Next Steps & Action Items           │
├─────────────────────────────────────────┤
│  ─── divider (if structuredDoc) ───     │
│  {Persona title}          (mapped h2)   │
│  {structuredDoc markdown — single pass} │
└─────────────────────────────────────────┘
```

### Persona title mapping

| `UserPersonaEnum`  | Section title |
| ------------------ | ------------- |
| `SOLO_FOUNDER`     | Product spec  |
| `PRODUCT_MANAGER`  | PRD           |
| `ENGINEERING_LEAD` | Technical RFC |

Persona doc subheadings come from prompt files (`founder-prd.md`, `pm-prd.md`, `eng-rfc.md`), minus removed Action Items
sections (see AI changes).

**Persona label source:** `useAuth()?.persona` from `AuthContextType`. Persona is set once at onboarding and is not
updatable via API today, so it matches the role used when Mastra processed the meeting.

---

## AI / Mastra changes

### `notes-agent.ts`

**Replace** current instructions (`Attendees, Topics Discussed, Decisions, Action Items`) with this required `notes`
template:

```markdown
## Topics Discussed

### {Sub-topic title}

- **Label:** detail
- _Completed:_ item
- _In Progress:_ item

## Questions & Answers

**Q1:** Question text?

> _Answer text in blockquote._

## Next Steps & Action Items

1. Task description _(Owner: Name)_ _(Deadline: date if mentioned)_
```

Rules:

- Use `##` with **exact** section titles above
- Do **not** include Key Takeaways in `notes` (handled by `keyPointsStep`)
- Do **not** include Attendees or a separate Decisions section (fold decisions into Topics or Action Items)
- Q&A: `Q1`, `Q2`, … with answers as blockquotes
- Do not invent owners, deadlines, or facts absent from the transcript

### `meeting-processing.ts` — `notesStep`

Pass the section template explicitly in the generate prompt. No workflow schema change.

### `keyPointsStep`

Keep output as `string[]` (no JSON schema change). Prompt: each string must use `**Topic label:** one-sentence takeaway`
so the frontend can render bold labels via inline markdown.

Do **not** duplicate key takeaways inside the `notes` field.

### Persona agents — prompt trim (dedup)

Remove standalone `## Action Items` from:

- `apps/agent/src/mastra/prompts/founder-prd.md`
- `apps/agent/src/mastra/prompts/eng-rfc.md`

(PM prompt has no Action Items section — unchanged.)

General meeting actions appear only in `notes`. Persona docs focus on deliverable content (Summary, Key Decisions, Rough
Spec / Problem, MoSCoW / Architecture, RFC Draft, etc.).

---

## Frontend changes

### New: `MeetingNotesMarkdown.tsx`

Fork of `CustomMarkdown` with meeting-notes prose — not shared with chat.

| Element                | Style                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `h2` inside notes/doc  | `text-lg font-semibold mt-8 first:mt-0`                                                 |
| `h3`                   | `text-base font-medium text-foreground/90 mt-6`                                         |
| `ul` / `ol`            | `space-y-2`, nested indent                                                              |
| `strong` in list items | foreground bold (label pattern)                                                         |
| `blockquote`           | `border-l-2 border-muted-foreground/30 pl-4 italic text-muted-foreground` (Q&A answers) |
| `p`                    | `leading-relaxed` (more breathing room than chat `prose-p:my-1`)                        |

Custom `components` map for `h2`, `h3`, `ul`, `ol`, `li`, `blockquote`, `strong`, tables (reuse table styling from
`CustomMarkdown`).

### New: `MeetingNotesRenderer.tsx`

Props: `keyPoints`, `notes`, `structuredDoc`, `persona: UserPersonaEnum | null`

- Single outer `bg-card rounded-xl border p-6`
- Key takeaways: numbered circle UI (from current `MeetingNotesTab`) + `MeetingNotesMarkdown` per line with
  `allowedElements` limited to inline (`strong`, `em`) OR wrap each point in a one-line markdown render
- `notes`: one `<MeetingNotesMarkdown message={notes} />` — do not split or parse sections in code
- Persona block: divider + mapped title + `<MeetingNotesMarkdown message={structuredDoc} />`

### Update: `MeetingNotesTab.tsx`

Resolve persona via `useAuth()?.persona`, delegate to `MeetingNotesRenderer`. Remove three separate `<section>`
wrappers.

### `MeetingDetail.tsx`

No changes.

---

## Edge cases

| Case                                 | Behavior                                                       |
| ------------------------------------ | -------------------------------------------------------------- |
| Missing `keyPoints`                  | Skip Key Takeaways block                                       |
| Missing `notes`                      | Skip meeting body markdown                                     |
| Missing `structuredDoc`              | Skip divider and persona block                                 |
| All empty                            | Existing `EmptyMessage`                                        |
| `persona` null                       | Persona title → `"Structured document"`                        |
| Old meetings (legacy `notes` format) | Render as markdown; may lack Q&A sections until reprocessed    |
| `notes` missing `##` headings        | Renders as paragraphs — acceptable degradation for legacy data |
| Processing state                     | Unchanged — tabs hidden until `COMPLETED`                      |

---

## Files touched

| File                                                    | Change                                         |
| ------------------------------------------------------- | ---------------------------------------------- |
| `apps/agent/src/mastra/agents/notes-agent.ts`           | New section template; drop Attendees/Decisions |
| `apps/agent/src/mastra/workflows/meeting-processing.ts` | Prompt tweaks in `keyPointsStep`, `notesStep`  |
| `apps/agent/src/mastra/prompts/founder-prd.md`          | Remove `## Action Items`                       |
| `apps/agent/src/mastra/prompts/eng-rfc.md`              | Remove `## Action Items`                       |
| `apps/web/components/meetings/MeetingNotesMarkdown.tsx` | New                                            |
| `apps/web/components/meetings/MeetingNotesRenderer.tsx` | New                                            |
| `apps/web/components/meetings/MeetingNotesTab.tsx`      | Delegate to renderer                           |

**Not changed:** Prisma schema, API DTOs, `CustomMarkdown`, Transcript tab, email templates.

---

## Testing

**Manual**

1. Complete a meeting (or use test data) for each persona
2. Notes tab: single card, Generated notes title, numbered takeaways, three `notes` sections styled
3. Persona block title and sections; no duplicate Action Items list
4. Partial/empty fields — no orphan headings
5. Legacy flat `notes` — still readable

**Automated (optional)**

- RTL smoke test: `MeetingNotesRenderer` with fixture markdown per persona

---

## Non-goals

- TipTap or WYSIWYG editing
- Structured JSON from Mastra
- Backfill/reprocess existing meetings
- Email template restyling
- Storing `persona` on the `Meeting` row (auth persona is sufficient for v1)

---

## Self-review (2026-05-31)

| Check                  | Result    | Action taken                                                                                   |
| ---------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| Placeholders / TBD     | Pass      | —                                                                                              |
| Internal consistency   | **Fixed** | Clarified single markdown pass for `notes` and `structuredDoc`; card title vs section headings |
| Duplicate action items | **Fixed** | Removed `## Action Items` from founder + eng persona prompts; actions only in `notes`          |
| notes-agent drift      | **Fixed** | Documented intentional replacement of old sections (Attendees, Decisions)                      |
| keyPoints format       | **Fixed** | Removed JSON option; committed to `**Label:** detail` strings only                             |
| Persona label accuracy | **Fixed** | Documented persona set once at onboarding; auth context is safe for v1                         |
| Scope                  | Pass      | 7 files, one vertical slice                                                                    |
| Codebase alignment     | Pass      | Fields and auth types verified against `UserProfile` / `MeetingNotesTab`                       |

**Verdict:** Spec is internally consistent and ready for implementation planning.
