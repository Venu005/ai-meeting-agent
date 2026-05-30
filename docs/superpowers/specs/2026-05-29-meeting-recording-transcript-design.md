# Meeting Recording & Transcript UI — Design Spec

**Date:** 2026-05-29  
**Status:** Ready for implementation

## Summary

Redesign the meeting detail page to match a Notes | Transcript tab layout. Expose the stored transcript, persist meeting
recordings to S3 for long-term playback, and fall back to a temporary Recall URL when S3 upload fails. Content is
visible only when `status === COMPLETED`.

## Goals

- Show AI-generated notes (including key points and structured doc) in a single **Notes** tab
- Show speaker-attributed transcript and video recording in a **Transcript** tab
- Persist recordings in the project's S3 bucket for durable access
- Fall back to Recall's short-lived URL if S3 upload fails
- Reuse existing S3 env configuration (`S3_ACCESS_KEY_ID`, etc.)

## Non-Goals (v1)

- Private notes sidebar
- CloudFront or CDN
- Video thumbnails or re-encoding
- Speaker name resolution (keep `Speaker N` labels from Recall)
- Showing transcript/recording while status is `PROCESSING`
- Backfilling recordings for meetings processed before this feature

## User Decisions

| Question          | Choice                                                       |
| ----------------- | ------------------------------------------------------------ |
| Tab layout        | **Notes \| Transcript** — fold doc + key points into Notes   |
| Private notes     | **No** — single-column Notes tab                             |
| Visibility gate   | **COMPLETED** only                                           |
| Recording storage | **S3 long-term** + **Recall URL fallback** on upload failure |

## UI Design

### Header

- Back link → dashboard
- Meeting title, full date, duration
- Status badge ("Meeting Completed" when applicable)
- Existing failure reason banner unchanged

### Tabs (only when `status === COMPLETED`)

#### Notes tab (full width)

Sections in order:

1. **Key takeaways** — bullet list from `keyPoints`
2. **Meeting notes** — markdown from `notes` via `CustomMarkdown`
3. **Structured document** — markdown from `structuredDoc` via `CustomMarkdown`

Empty section hidden or shows inline empty state.

#### Transcript tab (two columns desktop, stacked mobile)

**Left column**

- Header: "Transcript" + copy-to-clipboard button
- Scrollable body: lines from `meetings.transcript` (preserve `\n`, style `Speaker N:` prefixes)

**Right column**

- Header: "Meeting Recording"
- `<video controls>` when a playback URL is available
- Loading state while recording status is `processing`
- Empty state when `unavailable`

### Non-completed states

- `PROCESSING` / `BOT_JOINING` / `IN_PROGRESS`: existing processing banner; no tabs
- `FAILED` / `CANCELLED` / `SCHEDULED`: existing behavior

## Data Model

### Prisma — extend `Meeting`

```prisma
recordingKey          String?   // S3 object key, e.g. recordings/{userId}/{meetingId}.mp4
recordingFallbackUrl  String?   @db.Text  // Recall pre-signed URL if S3 upload failed
recordingStatus       RecordingStatus @default(NONE)

enum RecordingStatus {
  NONE
  PROCESSING
  READY       // recordingKey set (S3)
  FALLBACK    // recordingFallbackUrl set (Recall, expires)
  UNAVAILABLE
}
```

`transcript` column already exists — no change.

**Rationale for storing fallback URL:** Recall URLs expire (~hours). Persisting the URL at processing time gives users a
window to watch even when S3 fails. UI treats `FALLBACK` like `READY` until URL expires; playback errors show
unavailable message.

## Backend Architecture

### 1. Recall bot config

Add `video_mixed_mp4: {}` alongside existing transcript config in `RecallClient.createBot`:

```json
{
  "recording_config": {
    "video_mixed_mp4": {},
    "transcript": {
      "provider": { "recallai_streaming": { "mode": "prioritize_accuracy" } }
    }
  }
}
```

### 2. New `S3Service`

Location: `apps/server/src/common/s3/s3.service.ts`

Responsibilities:

- `uploadRecording(key: string, body: Buffer | ReadableStream): Promise<void>`
- `getPresignedRecordingUrl(key: string, expiresInSeconds?: number): Promise<string>`

Uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.  
Object key pattern: `recordings/{userId}/{meetingId}.mp4`.

Bucket is private; no public ACL.

### 3. RecallClient extensions

- `getBotRecordingDownloadUrl(botId: string): Promise<string | null>` — reads
  `media_shortcuts.video_mixed.data.download_url`
- Refactor shared `getBot()` usage with existing transcript fetch

### 4. Processing flow (`processCompletedMeeting`)

```
1. Fetch transcript from Recall → save transcript, durationMinutes
2. Set status = PROCESSING, recordingStatus = PROCESSING
3. Start parallel work:
   a. persistRecording(meeting):
      - Get Recall video download URL
      - If no URL → recordingStatus = UNAVAILABLE
      - Else try: stream download → S3 upload → recordingKey, recordingStatus = READY
      - On S3 failure: save recordingFallbackUrl, recordingStatus = FALLBACK
   b. Mastra processMeeting(...)
4. On Mastra success → status = COMPLETED, save notes/structuredDoc/keyPoints
5. On Mastra failure → status = FAILED (recording state preserved)
```

Recording upload must not block or fail the Mastra path. Errors in `persistRecording` are logged; meeting notes still
complete.

### 5. API changes

#### `GET /api/meetings/:id`

Add to **`GET /api/meetings/:id` detail response only** (not list):

- `transcript: string | null`
- `recordingStatus: RecordingStatus`
- `hasRecording: boolean` — `true` when `recordingStatus` is `READY` or `FALLBACK` (playback URL available now)
- `showRecordingPanel: boolean` — `true` when `recordingStatus` is `PROCESSING`, `READY`, or `FALLBACK` (Transcript tab
  shows the video panel; may be loading)

Do **not** expose raw S3 keys or fallback URLs in any response.

#### `GET /api/meetings/:id/recording`

Register **before** `GET /api/meetings/:id` in the controller to avoid route shadowing.

Auth: JWT + meeting ownership.

Response:

```typescript
{
  status: 'ready' | 'processing' | 'unavailable';
  url?: string;       // presigned S3 URL when READY
  source?: 's3' | 'recall';  // FALLBACK uses recall URL directly
}
```

Logic:

| `recordingStatus`      | Response                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| `PROCESSING`           | `{ status: 'processing' }`                                         |
| `READY`                | Presigned S3 GET URL, `{ status: 'ready', source: 's3', url }`     |
| `FALLBACK`             | `{ status: 'ready', source: 'recall', url: recordingFallbackUrl }` |
| `NONE` / `UNAVAILABLE` | `{ status: 'unavailable' }`                                        |

Presigned S3 TTL: 1 hour (configurable constant).

### 6. Shared types

Update `@repo/shared-types`:

- `meetingSchema`: add `transcript`, `recordingStatus`, `hasRecording`, `showRecordingPanel`
- `RecordingStatusEnum` in enums (mirror Prisma `RecordingStatus`)

## Frontend Architecture

### Services & queries

- `MeetingService.getRecording(meetingId)` → recording endpoint
- `useMeetingRecording(meetingId, enabled)` — TanStack Query; `enabled` when Transcript tab is active **and**
  `showRecordingPanel === true`; poll every 5s while `status === 'processing'`

### `MeetingDetail.tsx` refactor

- Replace Notes / Doc / Key Points tabs with Notes | Transcript
- Extract subcomponents: `MeetingNotesTab`, `MeetingTranscriptTab`, `MeetingRecordingPlayer`
- Transcript tab fetches recording URL lazily on mount
- Copy transcript button uses `navigator.clipboard.writeText`

### Recording player behavior

- `source === 's3'`: standard `<video src={url} controls />`
- `source === 'recall'`: same element; on `error` event, show "Recording expired or unavailable"
- `status === 'processing'`: skeleton/spinner in video panel

## Error Handling

| Scenario                   | Behavior                                             |
| -------------------------- | ---------------------------------------------------- |
| S3 upload fails            | `FALLBACK` + Recall URL stored; notes still complete |
| No Recall video URL        | `UNAVAILABLE`; transcript still shown                |
| Mastra fails               | `FAILED`; transcript + recording state kept          |
| Presigned URL expired      | Frontend refetches recording endpoint                |
| Recall fallback expired    | Video `error` → user message                         |
| Old meetings (pre-feature) | Transcript if in DB; recording unavailable           |

## Testing

### Backend

- `RecallClient`: mock video URL extraction
- `S3Service`: unit test with mocked S3 client
- `MeetingsService.processCompletedMeeting`: S3 success, S3 fail + fallback, no video URL
- Recording endpoint: auth, presigned URL generation, status mapping

### Frontend

- `MeetingDetail`: COMPLETED shows tabs; Notes sections render
- Transcript tab: copy button, video player states

## Environment

Existing vars (no new required keys):

- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_REGION`

Local dev: configure MinIO or LocalStack, or use real AWS dev bucket.

## Implementation Order

1. Prisma migration + shared types
2. S3Service + RecallClient video helper
3. Recording persistence in `processCompletedMeeting`
4. API: expose transcript, recording endpoint
5. Frontend: MeetingDetail redesign
6. Tests

## Self-Review (2026-05-29)

| Check                           | Result                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Placeholder scan                | None — open questions explicitly deferred                                     |
| `hasRecording` vs processing UI | Fixed: added `showRecordingPanel` for video panel + polling                   |
| List endpoint transcript leak   | Explicit: transcript only on detail, not list                                 |
| NestJS route order              | Documented: `:id/recording` before `:id`                                      |
| Old meetings                    | `recordingStatus = NONE` default; transcript shown if present                 |
| S3 deps                         | Not in server `package.json` yet — plan adds `@aws-sdk/client-s3` + presigner |
| Prisma enum export              | Mirror in `@repo/shared-types` like `MeetingStatusEnum`                       |

- Retry policy for failed S3 uploads (background job) — not v1
- Recording retention / lifecycle policy on S3 bucket — configure at infra level
