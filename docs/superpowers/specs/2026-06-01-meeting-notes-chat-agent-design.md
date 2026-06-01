# Meeting Notes Chat Agent — Design Spec

**Date:** 2026-06-01  
**Status:** Approved (self-reviewed)  
**Scope:** Meeting detail page chat panel that answers only from meeting outputs (notes, transcript, key points,
structured doc)

---

## Summary

Add a dedicated, meeting-scoped Q&A assistant to the meeting detail page. The assistant appears as a right-side panel on
desktop and an "Ask" bottom-sheet flow on mobile. It is always visible in the UI but can be disabled depending on
meeting status/content readiness.

The assistant must strictly answer only from the current meeting's outputs (`notes`, `transcript`, `keyPoints`,
`structuredDoc`) and refuse unrelated requests (e.g., coding help or general knowledge).

---

## Decisions

| Topic            | Decision                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| Persistence      | Persist messages per user + meeting, with a Clear Chat action                          |
| Availability     | Panel always visible; disabled with contextual reason until content is available       |
| Data sources     | Use all meeting outputs: notes, transcript, key points, structured doc                 |
| Desktop layout   | Split view: content left (~60%), chat right (~40%)                                     |
| Mobile layout    | Keep notes/transcript flow; use floating "Ask" trigger + bottom sheet                  |
| Isolation        | Build dedicated meeting-chat backend path (not generic `/agents/chat`)                 |
| Tools/memory/web | Disabled for meeting chat agent                                                        |
| Out of scope     | Editing notes/transcript, cross-meeting search, team shared threads, model fine-tuning |

---

## UX and Layout

### Desktop (`lg+`)

- Keep existing meeting header/status area.
- Under header, render a two-column layout:
  - Left: existing tabs (`Notes`, `Transcript`)
  - Right: new `MeetingSideChat` panel

### Mobile

- Keep existing single-column tabs experience.
- Add floating "Ask" button.
- Button opens `MeetingSideChatSheet` bottom sheet with the same chat body.

### Enabled/disabled behavior

Always render panel entry points. Set state by meeting readiness:

| Meeting condition                         | Chat state | Message                                                   |
| ----------------------------------------- | ---------- | --------------------------------------------------------- |
| `SCHEDULED`, `BOT_JOINING`, `IN_PROGRESS` | Disabled   | "Meeting is not ready for questions yet."                 |
| `PROCESSING`                              | Disabled   | "Notes are still processing. Try again in a few minutes." |
| `COMPLETED` + no content fields           | Disabled   | "No notes or transcript available for this meeting yet."  |
| `COMPLETED` + any content field available | Enabled    | Normal chat UI                                            |
| `FAILED`, `CANCELLED`                     | Disabled   | "This meeting is not available for Q&A."                  |

---

## Backend Architecture

### Data model

Add a dedicated table for meeting-scoped chat history:

- `MeetingChatMessage`
  - `id` (`uuid`)
  - `meetingId` (`uuid`, FK -> `Meeting`)
  - `userId` (`uuid`, FK -> `User`)
  - `role` (`user` | `assistant`)
  - `content` (`text`)
  - `createdAt`, `updatedAt`

Indexes:

- `(meetingId, userId, createdAt)` for timeline retrieval
- `(meetingId, userId)` for clear/delete

### API surface

Under Meetings module:

- `GET /api/meetings/:id/chat`
  - Return current user's messages for one meeting.
- `POST /api/meetings/:id/chat`
  - Accept one user message.
  - Stream assistant response.
  - Persist both user message and assistant response.
- `DELETE /api/meetings/:id/chat`
  - Clear current user's chat history for one meeting.

### Access and ownership

- Require auth (`JwtAuthGuard`).
- Verify meeting belongs to current user before any chat read/write.
- Return 404/403-safe responses without leaking data existence for other users.

---

## Meeting-Only Guardrails

System prompt hard constraints:

1. You may answer only using this meeting's:
   - notes
   - transcript
   - key points
   - structured document
2. If question is unrelated, refuse with scoped reply:
   - "I can only answer questions about this meeting's materials (notes, transcript, key points, and structured
     document)."
3. Do not provide code, general trivia, external references, or advice beyond meeting content.
4. If requested info is missing in meeting data, say it is not available in this meeting.

Runtime constraints:

- No external tools.
- No memory lookup.
- No web access.
- Max input length check.

---

## Frontend Architecture

### New components

- `apps/web/components/meetings/MeetingSideChat.tsx`

  - Desktop right-rail shell: title, status badge, Clear action, chat body.

- `apps/web/components/meetings/MeetingSideChatSheet.tsx`

  - Mobile bottom-sheet container with same body.

- `apps/web/components/meetings/MeetingChatBody.tsx`
  - Shared UI: messages list, input, send/stop states, disabled banner.

### New hook/service

- `apps/web/services/meeting-chat.service.ts`

  - `getChat(meetingId)`
  - `sendMessage(meetingId, message)` (stream transport)
  - `clearChat(meetingId)`

- `apps/web/queries/meeting-chat.ts` (or local hook in component if preferred by current patterns)
  - load history
  - wire streaming chat
  - expose clear action and disabled reason

### Integration

- Update `MeetingDetail.tsx` to:
  - keep existing tabs/content
  - wrap with responsive split layout
  - pass `meeting` state + availability into chat components

---

## Data Flow

1. `MeetingDetail` fetches meeting (existing query).
2. Chat hook checks availability state from meeting.
3. `GET /api/meetings/:id/chat` loads persisted history.
4. User sends message -> `POST /api/meetings/:id/chat` stream.
5. Assistant stream renders in UI and is persisted.
6. User clicks Clear -> confirm -> `DELETE /api/meetings/:id/chat` -> local state reset.

---

## Error Handling

| Case                            | Handling                                                                 |
| ------------------------------- | ------------------------------------------------------------------------ |
| Unauthorized/ownership mismatch | API rejects; UI shows generic "Unable to load meeting chat."             |
| Missing meeting content         | Keep disabled state + scoped message                                     |
| Model failure during stream     | Return fallback assistant error line and keep prior chat intact          |
| Clear chat failure              | Keep local messages, show toast error                                    |
| Empty history                   | Show friendly starter prompts ("Ask about decisions, risks, next steps") |

---

## Testing

### Backend

- Unit tests for prompt builder scope enforcement.
- Integration tests:
  - user can only access own meeting chat
  - POST persists user+assistant messages
  - DELETE clears only messages for that user+meeting

### Frontend

- Component tests:
  - disabled banner per meeting status
  - desktop panel renders; mobile trigger opens sheet
  - clear chat confirmation and success/failure handling
- Hook tests (if extracted):
  - history load
  - stream append
  - clear reset

### Manual

1. Completed meeting with content: ask grounded questions -> valid answers.
2. Ask unrelated question ("write python code") -> refusal.
3. Switch meetings -> histories are isolated.
4. Mobile flow works with Ask sheet.
5. Processing/failed meetings remain visible but disabled.

---

## Files expected to change

| File                                                    | Action                                   |
| ------------------------------------------------------- | ---------------------------------------- |
| `packages/db/prisma/schema.prisma`                      | Add `MeetingChatMessage` model           |
| `packages/db/prisma/migrations/*`                       | Add migration                            |
| `apps/server/src/meetings/meetings.controller.ts`       | Add chat endpoints                       |
| `apps/server/src/meetings/meetings.service.ts`          | Add meeting chat read/write/clear logic  |
| `apps/server/src/meetings/dto/*`                        | Add chat request/response DTOs if needed |
| `apps/web/components/meetings/MeetingDetail.tsx`        | Add split layout + chat integration      |
| `apps/web/components/meetings/MeetingSideChat.tsx`      | New                                      |
| `apps/web/components/meetings/MeetingSideChatSheet.tsx` | New                                      |
| `apps/web/components/meetings/MeetingChatBody.tsx`      | New                                      |
| `apps/web/services/meeting-chat.service.ts`             | New                                      |
| `apps/web/queries/meeting-chat.ts`                      | New                                      |

---

## Non-goals

- Multi-meeting/global assistant memory
- Sharing meeting chat threads with teammates
- Voice input/output in this panel
- Replacing existing `/chat` product

---

## Self-review (2026-06-01)

| Check                | Result | Notes                                                                                                   |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Placeholder scan     | Pass   | No TODO/TBD left                                                                                        |
| Internal consistency | Fixed  | Aligned refusal text with selected data sources and normalized `/api/meetings/:id/chat` path references |
| Scope check          | Pass   | Single sub-project focused on meeting detail Q&A                                                        |
| Ambiguity check      | Pass   | Availability matrix and source constraints explicitly defined                                           |

**Verdict:** Spec ready for user review.
