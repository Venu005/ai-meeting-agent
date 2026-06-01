# Meeting Notes Chat Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a meeting-scoped Q&A chat panel to meeting detail that only answers from meeting materials and persists
history per user+meeting with clear-chat support.

**Architecture:** Create a dedicated backend path (`/api/meetings/:id/chat`) and a new `MeetingChatMessage` persistence
model to isolate this feature from generic `/agents/chat`. On frontend, add a desktop right-rail chat panel and mobile
bottom-sheet chat trigger, both backed by a shared meeting-chat hook/service and strict availability states. Enforce
meeting-only scope through system-prompt guardrails and runtime constraints (no tools/memory/web).

**Tech Stack:** NestJS 11, Prisma, Next.js 15, React 19, Vercel AI SDK (`useChat` + stream transport), TanStack Query,
Tailwind CSS

---

## File Map

| File / directory                                                       | Action             | Responsibility                                           |
| ---------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                                     | Modify             | Add `MeetingChatMessage` model + relations/indexes       |
| `packages/db/prisma/migrations/*`                                      | Create             | DB migration for meeting chat table                      |
| `apps/server/src/meetings/dto/meeting-chat.dto.ts`                     | Create             | Request/response DTOs for meeting chat endpoints         |
| `apps/server/src/meetings/meetings.controller.ts`                      | Modify             | Add GET/POST/DELETE meeting chat routes                  |
| `apps/server/src/meetings/meetings.service.ts`                         | Modify             | History fetch, stream response, persistence, clear logic |
| `apps/server/src/meetings/meetings.service.spec.ts`                    | Modify             | Unit/integration-style coverage for new behavior         |
| `apps/web/services/meeting-chat.service.ts`                            | Create             | API client for get/send/clear meeting chat               |
| `apps/web/queries/meeting-chat.ts`                                     | Create             | Query/mutation hooks + chat orchestration helpers        |
| `apps/web/components/meetings/MeetingChatBody.tsx`                     | Create             | Shared chat list/input/disabled UI                       |
| `apps/web/components/meetings/MeetingSideChat.tsx`                     | Create             | Desktop right-panel shell                                |
| `apps/web/components/meetings/MeetingSideChatSheet.tsx`                | Create             | Mobile bottom-sheet wrapper                              |
| `apps/web/components/meetings/meeting-chat-state.ts`                   | Create             | Availability-state resolver by meeting status/content    |
| `apps/web/components/meetings/MeetingDetail.tsx`                       | Modify             | Responsive split layout + chat integration               |
| `apps/web/__tests__/meeting-chat-state.test.ts`                        | Create             | Availability matrix tests                                |
| `apps/web/__tests__/meeting-chat-body.test.tsx`                        | Create             | Disabled/enabled/chat interaction tests                  |
| `apps/web/__tests__/meeting-detail-chat-layout.test.tsx`               | Create (optional)  | Layout wiring smoke test                                 |
| `docs/superpowers/specs/2026-06-01-meeting-notes-chat-agent-design.md` | Modify (if needed) | Keep spec in sync with implementation clarifications     |

---

## Task 1: Add Meeting Chat Persistence Model

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `packages/db/prisma/migrations/<timestamp>_add_meeting_chat_messages/migration.sql`

- [ ] **Step 1: Add `MeetingChatMessage` model to Prisma schema**

```prisma
model MeetingChatMessage {
  id        String   @id @default(uuid()) @db.Uuid
  meetingId String   @db.Uuid
  userId    String   @db.Uuid
  role      String
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([meetingId, userId, createdAt])
  @@index([meetingId, userId])
  @@map("meeting_chat_messages")
}
```

- [ ] **Step 2: Add back-relations in existing models**

  - `Meeting`: `meetingChatMessages MeetingChatMessage[]`
  - `User`: `meetingChatMessages MeetingChatMessage[]`

- [ ] **Step 3: Create migration**

```bash
pnpm --filter @repo/db db:migrate
pnpm db:generate
```

- [ ] **Step 4: Verify schema generation**

```bash
pnpm --filter @repo/db db:generate
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add meeting chat message persistence model"
```

---

## Task 2: Implement Meeting Chat API in Meetings Module

**Files:**

- Create: `apps/server/src/meetings/dto/meeting-chat.dto.ts`
- Modify: `apps/server/src/meetings/meetings.controller.ts`
- Modify: `apps/server/src/meetings/meetings.service.ts`
- Modify: `apps/server/src/meetings/meetings.module.ts` (if needed for provider wiring)

- [ ] **Step 1: Add DTOs**

  - `CreateMeetingChatMessageDto` with `message: string` validation
  - `MeetingChatMessageDto` response shape (`id`, `role`, `content`, `createdAt`)

- [ ] **Step 2: Add controller endpoints**

  - `GET /api/meetings/:id/chat`
  - `POST /api/meetings/:id/chat` (stream response)
  - `DELETE /api/meetings/:id/chat`

- [ ] **Step 3: Implement ownership guard in service helpers**

  - Resolve meeting by `meetingId + userId`
  - Throw `NotFoundException` for mismatches (avoid leaking existence)

- [ ] **Step 4: Implement history retrieval**

  - Return ordered messages by `createdAt ASC`

- [ ] **Step 5: Implement POST streaming flow**

  - Validate availability/content before model call
  - Persist user message
  - Build strict system prompt with only: `notes`, `transcript`, `keyPoints`, `structuredDoc`
  - Stream assistant response
  - Persist assistant content at end

- [ ] **Step 6: Implement DELETE clear flow**

  - Delete only current user's messages for current meeting

- [ ] **Step 7: Add runtime constraints**

  - Max user message length guard
  - Refusal fallback when unrelated/unsupported
  - Disable tool/memory/web behavior for this endpoint

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/meetings
git commit -m "feat(server): add meeting-scoped chat endpoints and streaming"
```

---

## Task 3: Add Backend Tests for Scope, Ownership, and Persistence

**Files:**

- Modify: `apps/server/src/meetings/meetings.service.spec.ts`
- Create (if preferred): `apps/server/src/meetings/meeting-chat.service.spec.ts`

- [ ] **Step 1: Add tests for ownership enforcement**

  - Cannot read/write/clear chat for another user's meeting

- [ ] **Step 2: Add tests for content availability rules**

  - `PROCESSING` or missing content yields disabled/blocked response behavior

- [ ] **Step 3: Add tests for persistence**

  - POST stores user and assistant messages
  - GET returns timeline in correct order
  - DELETE clears only target meeting+user records

- [ ] **Step 4: Add tests for scope guardrails**

  - Unrelated prompt returns refusal content
  - Missing requested info returns explicit "not available in this meeting"

- [ ] **Step 5: Run tests**

```bash
pnpm --filter server test -- meetings.service.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/meetings/*.spec.ts
git commit -m "test(server): cover meeting chat ownership and scope rules"
```

---

## Task 4: Build Frontend Meeting Chat Data Layer

**Files:**

- Create: `apps/web/services/meeting-chat.service.ts`
- Create: `apps/web/queries/meeting-chat.ts`
- Create: `apps/web/components/meetings/meeting-chat-state.ts`
- Create: `apps/web/__tests__/meeting-chat-state.test.ts`

- [ ] **Step 1: Add service methods**

  - `getChat(meetingId)`
  - `clearChat(meetingId)`
  - `chatApiUrl(meetingId)` helper for stream transport

- [ ] **Step 2: Implement chat state resolver**

  - Function that maps meeting status + content presence to:
    - `enabled: boolean`
    - `reason: string | null`

- [ ] **Step 3: Add query/hook wrappers**

  - Query for history fetch
  - Mutation for clear
  - Hook adapter to pair history + `useChat` stream transport

- [ ] **Step 4: Test state matrix**

  - All states from spec table (`SCHEDULED`, `PROCESSING`, `COMPLETED` content/no-content, `FAILED`, etc.)

- [ ] **Step 5: Run tests**

```bash
pnpm --filter web test -- meeting-chat-state.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/services/meeting-chat.service.ts apps/web/queries/meeting-chat.ts apps/web/components/meetings/meeting-chat-state.ts apps/web/__tests__/meeting-chat-state.test.ts
git commit -m "feat(web): add meeting chat service, hooks, and availability state"
```

---

## Task 5: Build Chat UI Components (Desktop + Mobile)

**Files:**

- Create: `apps/web/components/meetings/MeetingChatBody.tsx`
- Create: `apps/web/components/meetings/MeetingSideChat.tsx`
- Create: `apps/web/components/meetings/MeetingSideChatSheet.tsx`
- Create: `apps/web/__tests__/meeting-chat-body.test.tsx`

- [ ] **Step 1: Build `MeetingChatBody`**

  - Message timeline UI (`user` vs `assistant`)
  - Disabled banner rendering
  - Input + send button + loading/streaming states
  - Empty-state prompt chips (optional but recommended)

- [ ] **Step 2: Build `MeetingSideChat`**

  - Header title ("Ask about this meeting")
  - Clear chat action with confirm dialog
  - Embed `MeetingChatBody`

- [ ] **Step 3: Build `MeetingSideChatSheet`**

  - Mobile trigger and sheet container
  - Reuse same body + actions

- [ ] **Step 4: Add component tests**

  - Disabled state locks input
  - Enabled state allows send
  - Clear action calls handler

- [ ] **Step 5: Run tests**

```bash
pnpm --filter web test -- meeting-chat-body.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/meetings apps/web/__tests__/meeting-chat-body.test.tsx
git commit -m "feat(web): add meeting chat panel and mobile sheet UI"
```

---

## Task 6: Integrate Chat into Meeting Detail Layout

**Files:**

- Modify: `apps/web/components/meetings/MeetingDetail.tsx`
- Create (optional): `apps/web/__tests__/meeting-detail-chat-layout.test.tsx`

- [ ] **Step 1: Refactor `MeetingDetail` layout**

  - Keep existing header/status components unchanged
  - Add responsive split wrapper below status:
    - left content (tabs)
    - right desktop chat panel

- [ ] **Step 2: Wire mobile ask trigger**

  - Render floating ask button only on small screens
  - Open `MeetingSideChatSheet`

- [ ] **Step 3: Pass meeting state/content into chat hooks**

  - Ensure disabled reasons map correctly
  - Keep existing notes/transcript behavior intact

- [ ] **Step 4: Add/adjust integration smoke test (optional)**

  - Ensure `MeetingDetail` renders chat components when completed

- [ ] **Step 5: Run targeted tests**

```bash
pnpm --filter web test -- meeting-notes-renderer.test.tsx meeting-chat-body.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/meetings/MeetingDetail.tsx apps/web/__tests__
git commit -m "feat(web): integrate meeting chat into detail page layout"
```

---

## Task 7: End-to-End Verification and Cleanup

**Files:**

- Modify any touched files for fixes

- [ ] **Step 1: Run backend verification**

```bash
pnpm --filter server test
pnpm --filter server lint
```

- [ ] **Step 2: Run frontend verification**

```bash
pnpm --filter web test
pnpm --filter web lint
```

- [ ] **Step 3: Manual QA checklist**

  1. Completed meeting with content answers grounded questions.
  2. Unrelated asks ("write code in python") are refused.
  3. Per-meeting history isolation works.
  4. Clear chat removes only current meeting thread.
  5. Mobile Ask sheet opens and behaves correctly.
  6. Processing/failed meetings show disabled banner with correct reason.

- [ ] **Step 4: Final cleanup**

  - Remove debug logs
  - Ensure error messages are user-safe
  - Ensure no accidental changes outside scope

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: add meeting-scoped notes/transcript chat assistant"
```

---

## Risk Notes

- **Streaming persistence race:** assistant content must persist after full stream completion; guard partial writes.
- **Scope leakage risk:** avoid reusing generic chat prompt/tools path to prevent unrelated answers.
- **Layout regression risk:** `MeetingDetail` recently changed for notes redesign; verify no breakage in
  notes/transcript tabs.
- **Test instability:** existing `apps/web` test suite has unrelated failures; use targeted tests during development and
  report known baseline failures separately.

---

## Definition of Done

- Dedicated meeting chat endpoints exist and are auth/ownership-safe.
- Chat answers only from meeting materials and refuses unrelated requests.
- Desktop right-side chat + mobile Ask sheet shipped with disabled states.
- History persists per user+meeting and Clear chat works.
- Relevant backend/frontend tests pass and manual QA checklist is complete.
