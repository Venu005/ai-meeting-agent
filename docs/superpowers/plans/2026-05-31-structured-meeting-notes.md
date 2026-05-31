# Structured Meeting Notes Implementation Plan

> **For agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render meeting notes as a single polished, reference-style document with numbered key takeaways, structured
markdown sections, and a persona-aware doc block — without DB changes or an editor.

**Architecture:** Tighten Mastra prompts so `keyPoints`, `notes`, and `structuredDoc` output consistent markdown. Add
`MeetingNotesMarkdown` (styled renderer forked from `CustomMarkdown`) and `MeetingNotesRenderer` (unified layout).
`MeetingNotesTab` resolves persona from auth and delegates.

**Tech Stack:** Mastra agents/workflows, Next.js 15, React 19, react-markdown, remark-gfm, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-05-31-structured-meeting-notes-design.md`

---

## File map

| File                                                     | Action | Responsibility                        |
| -------------------------------------------------------- | ------ | ------------------------------------- |
| `apps/agent/src/mastra/agents/notes-agent.ts`            | Modify | Required `notes` section template     |
| `apps/agent/src/mastra/workflows/meeting-processing.ts`  | Modify | `keyPointsStep` + `notesStep` prompts |
| `apps/agent/src/mastra/prompts/founder-prd.md`           | Modify | Remove duplicate Action Items         |
| `apps/agent/src/mastra/prompts/eng-rfc.md`               | Modify | Remove duplicate Action Items         |
| `apps/web/components/meetings/meeting-notes-fixtures.ts` | Create | Test fixture markdown                 |
| `apps/web/components/meetings/persona-doc-title.ts`      | Create | Persona → title label helper          |
| `apps/web/components/meetings/MeetingNotesMarkdown.tsx`  | Create | Styled markdown renderer              |
| `apps/web/components/meetings/MeetingNotesRenderer.tsx`  | Create | Unified notes layout                  |
| `apps/web/components/meetings/MeetingNotesTab.tsx`       | Modify | Thin wrapper + auth persona           |
| `apps/web/__tests__/meeting-notes-renderer.test.tsx`     | Create | RTL smoke + section assertions        |

---

## Task 1: Mastra prompt updates

**Files:**

- Modify: `apps/agent/src/mastra/agents/notes-agent.ts`
- Modify: `apps/agent/src/mastra/workflows/meeting-processing.ts`
- Modify: `apps/agent/src/mastra/prompts/founder-prd.md`
- Modify: `apps/agent/src/mastra/prompts/eng-rfc.md`

### Step 1: Replace `notes-agent.ts` instructions

```typescript
instructions: `You extract structured meeting notes from transcripts.

Output Markdown with EXACTLY these ## sections (in order):
1. ## Topics Discussed
2. ## Questions & Answers
3. ## Next Steps & Action Items

Do NOT include Key Takeaways, Attendees, or a separate Decisions section.

## Topics Discussed
Use ### sub-headings for sub-topics. Use bullets with **Label:** detail and *Completed:* / *In Progress:* where relevant.

## Questions & Answers
Use **Q1:**, **Q2:**, etc. Put each answer in a blockquote (> ...).

## Next Steps & Action Items
Use a numbered list. Append *(Owner: Name)* and *(Deadline: date)* in italics when known.

Be factual. Do not invent details not present in the transcript.`,
```

### Step 2: Update `keyPointsStep` prompt in `meeting-processing.ts`

Replace the generate string with:

```typescript
`Extract 5-10 key takeaways from this meeting titled "${inputData.meetingTitle}".
Return a JSON array of strings only.
Each string MUST use the format: **Topic label:** one-sentence takeaway
Do not wrap in markdown code fences.

Transcript:
${inputData.transcript}`;
```

### Step 3: Update `notesStep` prompt in `meeting-processing.ts`

Replace the generate string with:

```typescript
`Generate meeting notes for "${inputData.meetingTitle}" using EXACTLY these sections:
## Topics Discussed
## Questions & Answers
## Next Steps & Action Items

Do not include Key Takeaways (already extracted separately).
Do not include Attendees or a separate Decisions section.

Transcript:
${inputData.transcript}`;
```

### Step 4: Trim persona prompts

In `founder-prd.md`, delete the `## Action Items` section (lines 13–15) and add one line to the intro:

> General meeting action items are captured separately; do not include an Action Items section.

In `eng-rfc.md`, delete the `## Action Items` section (lines 13–15) and add the same line.

### Step 5: Commit

```bash
git add apps/agent/src/mastra/agents/notes-agent.ts \
        apps/agent/src/mastra/workflows/meeting-processing.ts \
        apps/agent/src/mastra/prompts/founder-prd.md \
        apps/agent/src/mastra/prompts/eng-rfc.md
git commit -m "feat(agent): structure meeting notes output with Q&A and action sections"
```

---

## Task 2: Persona title helper + fixtures

**Files:**

- Create: `apps/web/components/meetings/persona-doc-title.ts`
- Create: `apps/web/components/meetings/meeting-notes-fixtures.ts`

### Step 1: Create `persona-doc-title.ts`

```typescript
import { UserPersonaEnum } from '@repo/shared-types/enums';

const PERSONA_DOC_TITLES: Record<UserPersonaEnum, string> = {
  [UserPersonaEnum.SOLO_FOUNDER]: 'Product spec',
  [UserPersonaEnum.PRODUCT_MANAGER]: 'PRD',
  [UserPersonaEnum.ENGINEERING_LEAD]: 'Technical RFC',
};

export const getPersonaDocTitle = (persona: UserPersonaEnum | null | undefined): string => {
  if (!persona) {
    return 'Structured document';
  }
  return PERSONA_DOC_TITLES[persona];
};
```

### Step 2: Create `meeting-notes-fixtures.ts`

Export constants used by tests (and optionally Storybook later):

```typescript
export const FIXTURE_KEY_POINTS = [
  '**Project Timeline:** Development is on track for the February 25th launch.',
  '**QuickBooks Integration:** OAuth flow is complete; webhook testing remains.',
];

export const FIXTURE_NOTES = `## Topics Discussed

### QuickBooks Integration
- **Completed:** OAuth connection flow
- *In Progress:* Webhook reliability testing

## Questions & Answers

**Q1:** Will sandbox testing finish before launch?
> *Yes, targeted for February 20th.*

## Next Steps & Action Items

1. Complete webhook tests *(Owner: Dev Team)* *(Deadline: Feb 20)*`;

export const FIXTURE_STRUCTURED_DOC = `## Summary

Team aligned on February 25 launch with QuickBooks integration as the critical path.

## Key Decisions

- Proceed with existing OAuth approach`;
```

### Step 3: Commit

```bash
git add apps/web/components/meetings/persona-doc-title.ts \
        apps/web/components/meetings/meeting-notes-fixtures.ts
git commit -m "feat(web): add persona doc title helper and notes test fixtures"
```

---

## Task 3: MeetingNotesMarkdown component

**Files:**

- Create: `apps/web/components/meetings/MeetingNotesMarkdown.tsx`

### Step 1: Implement styled renderer

Fork `apps/web/components/chat/CustomMarkdown.tsx`. Key differences:

- Default wrapper classes: `prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-2`
- Custom component overrides:

```tsx
h2: ({ children }) => (
  <h2 className='mt-8 text-lg font-semibold tracking-tight first:mt-0'>{children}</h2>
),
h3: ({ children }) => (
  <h3 className='text-foreground/90 mt-6 text-base font-medium'>{children}</h3>
),
ul: ({ children }) => <ul className='my-3 list-disc space-y-2 pl-5'>{children}</ul>,
ol: ({ children }) => <ol className='my-3 list-decimal space-y-2 pl-5'>{children}</ol>,
li: ({ children }) => <li className='text-sm leading-relaxed'>{children}</li>,
blockquote: ({ children }) => (
  <blockquote className='border-muted-foreground/30 text-muted-foreground my-3 border-l-2 pl-4 italic'>
    {children}
  </blockquote>
),
```

- Keep table overrides from `CustomMarkdown`
- Export props: `{ message: string; className?: string }`

### Step 2: Add inline variant for key points (optional export)

Export `MeetingNotesInlineMarkdown` — same renderer wrapped in `prose-sm` with `[&_p]:inline` for single-line key
takeaway strings, OR render key points with a minimal inline-only markdown:

```tsx
export const MeetingNotesInlineMarkdown = ({ message }: { message: string }) => (
  <MeetingNotesMarkdown message={message} className='prose-sm [&_p]:m-0 [&_p]:inline' />
);
```

### Step 3: Commit

```bash
git add apps/web/components/meetings/MeetingNotesMarkdown.tsx
git commit -m "feat(web): add MeetingNotesMarkdown styled renderer"
```

---

## Task 4: MeetingNotesRenderer

**Files:**

- Create: `apps/web/components/meetings/MeetingNotesRenderer.tsx`

### Step 1: Write failing test first

Create `apps/web/__tests__/meeting-notes-renderer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MeetingNotesRenderer from '@/components/meetings/MeetingNotesRenderer';
import {
  FIXTURE_KEY_POINTS,
  FIXTURE_NOTES,
  FIXTURE_STRUCTURED_DOC,
} from '@/components/meetings/meeting-notes-fixtures';
import { UserPersonaEnum } from '@repo/shared-types/enums';

describe('MeetingNotesRenderer', () => {
  it('renders unified layout with all sections', () => {
    render(
      <MeetingNotesRenderer
        keyPoints={FIXTURE_KEY_POINTS}
        notes={FIXTURE_NOTES}
        structuredDoc={FIXTURE_STRUCTURED_DOC}
        persona={UserPersonaEnum.PRODUCT_MANAGER}
      />
    );

    expect(screen.getByRole('heading', { name: 'Generated notes' })).toBeInTheDocument();
    expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Topics Discussed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions & Answers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next Steps & Action Items' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PRD' })).toBeInTheDocument();
  });

  it('omits empty sections', () => {
    render(<MeetingNotesRenderer keyPoints={null} notes={FIXTURE_NOTES} structuredDoc={null} persona={null} />);

    expect(screen.queryByText('Key Takeaways')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'PRD' })).not.toBeInTheDocument();
  });
});
```

Run: `pnpm --filter web test -- meeting-notes-renderer.test.tsx`  
Expected: FAIL (module not found)

### Step 2: Implement `MeetingNotesRenderer.tsx`

```tsx
'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import MeetingNotesMarkdown, { MeetingNotesInlineMarkdown } from '@/components/meetings/MeetingNotesMarkdown';
import { getPersonaDocTitle } from '@/components/meetings/persona-doc-title';
import { UserPersonaEnum } from '@repo/shared-types/enums';

type MeetingNotesRendererProps = {
  keyPoints: string[] | null;
  notes: string | null;
  structuredDoc: string | null;
  persona: UserPersonaEnum | null;
};

const MeetingNotesRenderer = ({ keyPoints, notes, structuredDoc, persona }: MeetingNotesRendererProps) => {
  const hasKeyPoints = keyPoints != null && keyPoints.length > 0;
  const hasNotes = Boolean(notes?.trim());
  const hasStructuredDoc = Boolean(structuredDoc?.trim());

  if (!hasKeyPoints && !hasNotes && !hasStructuredDoc) {
    return <EmptyMessage message='No notes available' />;
  }

  return (
    <div className='bg-card space-y-6 rounded-xl border p-6'>
      <h2 className='text-xl font-semibold tracking-tight'>Generated notes</h2>

      {hasKeyPoints && (
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold tracking-tight'>Key Takeaways</h3>
          <ul className='space-y-3'>
            {keyPoints!.map((point, index) => (
              <li key={`${index}-${point.slice(0, 24)}`} className='flex gap-3 text-sm'>
                <span className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                  {index + 1}
                </span>
                <MeetingNotesInlineMarkdown message={point} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasNotes && <MeetingNotesMarkdown message={notes!} />}

      {hasStructuredDoc && (
        <>
          <hr className='border-border/60 my-8' />
          <h2 className='text-lg font-semibold tracking-tight'>{getPersonaDocTitle(persona)}</h2>
          <MeetingNotesMarkdown message={structuredDoc!} />
        </>
      )}
    </div>
  );
};

export default MeetingNotesRenderer;
```

### Step 3: Run tests

Run: `pnpm --filter web test -- meeting-notes-renderer.test.tsx`  
Expected: PASS

### Step 4: Commit

```bash
git add apps/web/components/meetings/MeetingNotesRenderer.tsx \
        apps/web/__tests__/meeting-notes-renderer.test.tsx
git commit -m "feat(web): add unified MeetingNotesRenderer layout"
```

---

## Task 5: Wire MeetingNotesTab

**Files:**

- Modify: `apps/web/components/meetings/MeetingNotesTab.tsx`

### Step 1: Replace implementation

```tsx
'use client';

import MeetingNotesRenderer from '@/components/meetings/MeetingNotesRenderer';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingNotesTabProps {
  notes: string | null;
  structuredDoc: string | null;
  keyPoints: string[] | null;
}

const MeetingNotesTab = ({ notes, structuredDoc, keyPoints }: MeetingNotesTabProps) => {
  const user = useAuth();

  return (
    <MeetingNotesRenderer
      keyPoints={keyPoints}
      notes={notes}
      structuredDoc={structuredDoc}
      persona={user?.persona ?? null}
    />
  );
};

export default MeetingNotesTab;
```

Remove `CustomMarkdown` import. Empty state is handled inside renderer.

### Step 2: Lint + test

```bash
pnpm --filter web lint
pnpm --filter web test -- meeting-notes-renderer.test.tsx
```

### Step 3: Commit

```bash
git add apps/web/components/meetings/MeetingNotesTab.tsx
git commit -m "feat(web): delegate MeetingNotesTab to structured renderer"
```

---

## Task 6: Manual verification

### Step 1: Existing meeting (legacy data)

Open a completed meeting that already has notes. Confirm:

- Single card with "Generated notes"
- Legacy flat text still readable (no crash)
- No duplicate "Meeting notes" / "Structured document" section headers from old UI

### Step 2: New meeting (after agent changes)

Process a new meeting (or temporarily patch DB with `FIXTURE_*` strings via Prisma Studio). Confirm:

- Numbered key takeaways with bold labels
- Topics / Q&A / Action Items sections styled
- Persona block titled Product spec / PRD / Technical RFC
- No duplicate Action Items in persona doc

### Step 3: Partial data

Test meeting with only `notes` populated — Key Takeaways and persona block omitted.

### Step 4: Persona null edge case

Persona title falls back to "Structured document".

---

## Integration checklist

| Requirement                          | Verified by              |
| ------------------------------------ | ------------------------ |
| Single flowing card                  | Task 4 test + manual     |
| Key takeaways numbered + bold labels | Task 4 + agent prompt    |
| notes: Topics / Q&A / Actions        | Agent Task 1 + renderer  |
| Persona title from auth              | Task 2 helper + Task 5   |
| No duplicate Action Items            | Agent prompt trim Task 1 |
| Legacy meetings degrade gracefully   | Manual Task 6            |
| No DB / API changes                  | Spec                     |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-31-structured-meeting-notes.md`.

**Two execution options:**

1. **Subagent-driven (this session)** — implement task-by-task with review between tasks
2. **Parallel session** — open a new chat with executing-plans for batch execution

Which approach?
