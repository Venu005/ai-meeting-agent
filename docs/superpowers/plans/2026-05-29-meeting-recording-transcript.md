# Meeting Recording & Transcript UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign meeting detail with Notes | Transcript tabs, expose stored transcript, persist recordings to S3 with
Recall URL fallback, and stream video via presigned URLs.

**Architecture:** On `bot.done`, NestJS downloads the Recall MP4 in parallel with Mastra processing, uploads to S3 (or
stores Recall fallback URL), and exposes transcript + lazy recording playback endpoints. Next.js renders a two-column
Transcript tab and a consolidated Notes tab when `status === COMPLETED`.

**Tech Stack:** NestJS 11, Prisma/PostgreSQL, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Recall.ai API,
Next.js 15, TanStack Query, `@repo/ui`

**Spec:** `docs/superpowers/specs/2026-05-29-meeting-recording-transcript-design.md`

---

## File Map

| File                                                      | Action | Responsibility                                    |
| --------------------------------------------------------- | ------ | ------------------------------------------------- |
| `packages/db/prisma/schema.prisma`                        | Modify | `RecordingStatus` enum + meeting recording fields |
| `packages/shared-types/enums/meeting.enum.ts`             | Modify | Add `RecordingStatusEnum`                         |
| `packages/shared-types/schemas/meeting.schema.ts`         | Modify | Add transcript + recording fields                 |
| `apps/server/package.json`                                | Modify | Add AWS SDK deps                                  |
| `apps/server/src/common/s3/s3.module.ts`                  | Create | Export `S3Service`                                |
| `apps/server/src/common/s3/s3.service.ts`                 | Create | Upload + presigned GET                            |
| `apps/server/src/common/s3/s3.service.spec.ts`            | Create | Unit tests                                        |
| `apps/server/src/meetings/recall.client.ts`               | Modify | `video_mixed_mp4` + `getBotRecordingDownloadUrl`  |
| `apps/server/src/meetings/recall.client.spec.ts`          | Create | Video URL extraction tests                        |
| `apps/server/src/meetings/meetings.service.ts`            | Modify | `persistRecording`, parallel processing           |
| `apps/server/src/meetings/meetings.service.spec.ts`       | Modify | Recording persistence scenarios                   |
| `apps/server/src/meetings/meetings.controller.ts`         | Modify | `GET :id/recording` route                         |
| `apps/server/src/meetings/dto/create-meeting.dto.ts`      | Modify | Extend `MeetingResponseDto`                       |
| `apps/server/src/meetings/dto/meeting-recording.dto.ts`   | Create | Recording response DTO                            |
| `apps/server/src/meetings/meetings.module.ts`             | Modify | Import `S3Module`                                 |
| `apps/web/services/meeting.service.ts`                    | Modify | `getRecording()`                                  |
| `apps/web/queries/meetings.ts`                            | Modify | `useMeetingRecording` hook                        |
| `apps/web/components/meetings/MeetingDetail.tsx`          | Modify | Notes \| Transcript tabs                          |
| `apps/web/components/meetings/MeetingNotesTab.tsx`        | Create | Key takeaways + notes + doc                       |
| `apps/web/components/meetings/MeetingTranscriptTab.tsx`   | Create | Transcript + recording layout                     |
| `apps/web/components/meetings/MeetingRecordingPlayer.tsx` | Create | Video player states                               |

---

## Task 1: Database schema and shared types

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Modify: `packages/shared-types/enums/meeting.enum.ts`
- Modify: `packages/shared-types/schemas/meeting.schema.ts`
- Modify: `apps/server/src/meetings/dto/create-meeting.dto.ts`

- [ ] **Step 1: Add Prisma enum and columns**

In `packages/db/prisma/schema.prisma`, add enum after `MeetingSource`:

```prisma
enum RecordingStatus {
  NONE
  PROCESSING
  READY
  FALLBACK
  UNAVAILABLE
}
```

Extend `Meeting` model:

```prisma
  recordingKey          String?
  recordingFallbackUrl  String?         @db.Text
  recordingStatus       RecordingStatus   @default(NONE)
```

- [ ] **Step 2: Run migration**

```bash
cd packages/db && pnpm exec prisma migrate dev --name add_meeting_recording_fields
cd ../.. && pnpm --filter @repo/db build
```

Expected: migration SQL creates enum + three columns.

- [ ] **Step 3: Add shared enum**

`packages/shared-types/enums/meeting.enum.ts`:

```typescript
export enum RecordingStatusEnum {
  NONE = 'NONE',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FALLBACK = 'FALLBACK',
  UNAVAILABLE = 'UNAVAILABLE',
}
```

- [ ] **Step 4: Extend meeting schema**

`packages/shared-types/schemas/meeting.schema.ts` — add to `meetingSchema`:

```typescript
import { RecordingStatusEnum } from '../enums/meeting.enum';

// inside meetingSchema object:
transcript: z.string().nullable(),
recordingStatus: z.nativeEnum(RecordingStatusEnum),
hasRecording: z.boolean(),
showRecordingPanel: z.boolean(),
```

- [ ] **Step 5: Extend MeetingResponseDto**

`apps/server/src/meetings/dto/create-meeting.dto.ts`:

```typescript
import { RecordingStatus } from '@repo/db';

export class MeetingResponseDto {
  // ...existing fields...
  transcript: string | null;
  recordingStatus: RecordingStatus;
  hasRecording: boolean;
  showRecordingPanel: boolean;
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/db/prisma packages/shared-types apps/server/src/meetings/dto/create-meeting.dto.ts
git commit -m "feat: add meeting recording fields to schema and shared types"
```

---

## Task 2: S3Service

**Files:**

- Modify: `apps/server/package.json`
- Create: `apps/server/src/common/s3/s3.module.ts`
- Create: `apps/server/src/common/s3/s3.service.ts`
- Create: `apps/server/src/common/s3/s3.service.spec.ts`

- [ ] **Step 1: Install AWS SDK**

```bash
cd apps/server && pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: Write failing test**

`apps/server/src/common/s3/s3.service.spec.ts`:

```typescript
import { S3Service } from './s3.service';

const sendMock = jest.fn();
const getSignedUrlMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

jest.mock('src/common/config', () => ({
  config: {
    s3: {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      bucketName: 'test-bucket',
      region: 'us-east-1',
    },
  },
}));

describe('S3Service', () => {
  const service = new S3Service();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploadRecording sends PutObjectCommand', async () => {
    sendMock.mockResolvedValue({});
    await service.uploadRecording('recordings/u1/m1.mp4', Buffer.from('video'));
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'recordings/u1/m1.mp4',
          ContentType: 'video/mp4',
        }),
      })
    );
  });

  it('getPresignedRecordingUrl returns signed url', async () => {
    getSignedUrlMock.mockResolvedValue('https://signed.example/video.mp4');
    const url = await service.getPresignedRecordingUrl('recordings/u1/m1.mp4');
    expect(url).toBe('https://signed.example/video.mp4');
    expect(getSignedUrlMock).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd apps/server && pnpm exec jest src/common/s3/s3.service.spec.ts --runInBand
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement S3Service**

`apps/server/src/common/s3/s3.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'src/common/config';

const DEFAULT_PRESIGNED_TTL_SECONDS = 3600;

@Injectable()
export class S3Service {
  private readonly client = new S3Client({
    region: config.s3.region,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });

  async uploadRecording(key: string, body: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        Body: body,
        ContentType: 'video/mp4',
      })
    );
  }

  async getPresignedRecordingUrl(key: string, expiresInSeconds = DEFAULT_PRESIGNED_TTL_SECONDS): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: config.s3.bucketName, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }
}
```

`apps/server/src/common/s3/s3.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd apps/server && pnpm exec jest src/common/s3/s3.service.spec.ts --runInBand
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/server/package.json apps/server/src/common/s3 pnpm-lock.yaml
git commit -m "feat: add S3Service for meeting recording upload and presigned URLs"
```

---

## Task 3: RecallClient video support

**Files:**

- Modify: `apps/server/src/meetings/recall.client.ts`
- Create: `apps/server/src/meetings/recall.client.spec.ts`

- [ ] **Step 1: Write failing test**

`apps/server/src/meetings/recall.client.spec.ts`:

```typescript
import { RecallClient } from './recall.client';

describe('RecallClient.getBotRecordingDownloadUrl', () => {
  const client = new RecallClient();
  const fetchMock = jest.fn();

  beforeEach(() => {
    global.fetch = fetchMock;
    jest.clearAllMocks();
  });

  it('returns video_mixed download_url from bot response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'bot-1',
        recordings: [
          {
            media_shortcuts: {
              video_mixed: { data: { download_url: 'https://recall.example/video.mp4' } },
            },
          },
        ],
      }),
    });

    const url = await client.getBotRecordingDownloadUrl('bot-1');
    expect(url).toBe('https://recall.example/video.mp4');
  });

  it('returns null when video_mixed missing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'bot-1', recordings: [{}] }),
    });

    expect(await client.getBotRecordingDownloadUrl('bot-1')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd apps/server && pnpm exec jest src/meetings/recall.client.spec.ts --runInBand
```

- [ ] **Step 3: Implement**

In `recall.client.ts`:

1. Extend `RecallBotResponse` type with `video_mixed`:

```typescript
media_shortcuts?: {
  transcript?: { data?: { download_url?: string } };
  video_mixed?: { data?: { download_url?: string } };
};
```

2. Add `video_mixed_mp4: {}` to `createBot` `recording_config`.

3. Add method:

```typescript
async getBotRecordingDownloadUrl(botId: string): Promise<string | null> {
  const bot = await this.getBot(botId);
  return bot.recordings?.[0]?.media_shortcuts?.video_mixed?.data?.download_url ?? null;
}

async downloadRecording(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download recording: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
```

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/meetings/recall.client.ts apps/server/src/meetings/recall.client.spec.ts
git commit -m "feat: add Recall video recording download support"
```

---

## Task 4: Recording persistence in MeetingsService

**Files:**

- Modify: `apps/server/src/meetings/meetings.service.ts`
- Modify: `apps/server/src/meetings/meetings.service.spec.ts`
- Modify: `apps/server/src/meetings/meetings.module.ts`

- [ ] **Step 1: Wire S3Module**

`meetings.module.ts`:

```typescript
import { S3Module } from 'src/common/s3/s3.module';

@Module({
  imports: [BillingModule, MailModule, MastraModule, S3Module],
  // ...
})
```

Inject `S3Service` into `MeetingsService` constructor.

- [ ] **Step 2: Add helper methods**

In `meetings.service.ts`:

```typescript
private buildRecordingKey(userId: string, meetingId: string): string {
  return `recordings/${userId}/${meetingId}.mp4`;
}

private computeRecordingFlags(status: RecordingStatus) {
  return {
    hasRecording: status === RecordingStatus.READY || status === RecordingStatus.FALLBACK,
    showRecordingPanel:
      status === RecordingStatus.PROCESSING ||
      status === RecordingStatus.READY ||
      status === RecordingStatus.FALLBACK,
  };
}

private async persistRecording(meeting: Meeting): Promise<void> {
  if (!meeting.recallBotId) {
    await this.prisma.meeting.update({
      where: { id: meeting.id },
      data: { recordingStatus: RecordingStatus.UNAVAILABLE },
    });
    return;
  }

  try {
    const downloadUrl = await this.recallClient.getBotRecordingDownloadUrl(meeting.recallBotId);
    if (!downloadUrl) {
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: { recordingStatus: RecordingStatus.UNAVAILABLE },
      });
      return;
    }

    const buffer = await this.recallClient.downloadRecording(downloadUrl);
    const key = this.buildRecordingKey(meeting.userId, meeting.id);
    await this.s3Service.uploadRecording(key, buffer);

    await this.prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        recordingKey: key,
        recordingFallbackUrl: null,
        recordingStatus: RecordingStatus.READY,
      },
    });
  } catch (error) {
    this.logger.error(`S3 upload failed for meeting ${meeting.id}, storing Recall fallback`, error);
    const fallbackUrl = await this.recallClient.getBotRecordingDownloadUrl(meeting.recallBotId);
    await this.prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        recordingFallbackUrl: fallbackUrl,
        recordingStatus: fallbackUrl ? RecordingStatus.FALLBACK : RecordingStatus.UNAVAILABLE,
      },
    });
  }
}
```

- [ ] **Step 3: Update processCompletedMeeting**

After saving transcript + `PROCESSING` status, set `recordingStatus: PROCESSING` and run in parallel:

```typescript
await this.prisma.meeting.update({
  where: { id: meeting.id },
  data: {
    transcript,
    durationMinutes,
    status: MeetingStatus.PROCESSING,
    recordingStatus: RecordingStatus.PROCESSING,
    processingAttempts: { increment: 1 },
  },
});

const [, result] = await Promise.all([
  this.persistRecording(meeting),
  this.mastraClient.processMeeting({ transcript, userRole, meetingTitle: meeting.title, durationMinutes }, meeting.id),
]);
```

- [ ] **Step 4: Update toResponse**

```typescript
private toResponse(meeting: Meeting): MeetingResponseDto {
  const flags = this.computeRecordingFlags(meeting.recordingStatus);
  return {
    // ...existing...
    transcript: meeting.transcript,
    recordingStatus: meeting.recordingStatus,
    ...flags,
  };
}
```

- [ ] **Step 5: Extend meetings.service.spec.ts**

Add mocks for `S3Service` and test cases:

- S3 success → `recordingStatus: READY`
- S3 fail + Recall URL → `FALLBACK`
- No video URL → `UNAVAILABLE`
- Mastra still completes when S3 fails

- [ ] **Step 6: Run tests**

```bash
cd apps/server && pnpm exec jest src/meetings/meetings.service.spec.ts --runInBand
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/meetings/
git commit -m "feat: persist meeting recordings to S3 with Recall fallback"
```

---

## Task 5: Recording playback API

**Files:**

- Create: `apps/server/src/meetings/dto/meeting-recording.dto.ts`
- Modify: `apps/server/src/meetings/meetings.controller.ts`
- Modify: `apps/server/src/meetings/meetings.service.ts`

- [ ] **Step 1: Create DTO**

`meeting-recording.dto.ts`:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingRecordingResponseDto {
  @ApiProperty({ enum: ['ready', 'processing', 'unavailable'] })
  status: 'ready' | 'processing' | 'unavailable';

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional({ enum: ['s3', 'recall'] })
  source?: 's3' | 'recall';
}
```

- [ ] **Step 2: Add service method**

```typescript
async getRecording(userId: string, meetingId: string): Promise<MeetingRecordingResponseDto> {
  const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, userId } });
  if (!meeting) {
    throw new NotFoundException('Meeting not found');
  }

  switch (meeting.recordingStatus) {
    case RecordingStatus.PROCESSING:
      return { status: 'processing' };
    case RecordingStatus.READY: {
      if (!meeting.recordingKey) {
        return { status: 'unavailable' };
      }
      const url = await this.s3Service.getPresignedRecordingUrl(meeting.recordingKey);
      return { status: 'ready', source: 's3', url };
    }
    case RecordingStatus.FALLBACK: {
      if (!meeting.recordingFallbackUrl) {
        return { status: 'unavailable' };
      }
      return { status: 'ready', source: 'recall', url: meeting.recordingFallbackUrl };
    }
    default:
      return { status: 'unavailable' };
  }
}
```

- [ ] **Step 3: Add controller route BEFORE findOne**

```typescript
@Get(':id/recording')
@ApiOperation({ summary: 'Get meeting recording playback URL' })
getRecording(@CurrentUser() user: RequestUser, @Param('id') id: string) {
  return this.meetingsService.getRecording(user.id, id);
}
```

Place this method **above** `@Get(':id')`.

- [ ] **Step 4: Manual smoke test**

Start server, call `GET /api/meetings/{completed-id}/recording` with Bearer token.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/meetings/
git commit -m "feat: add meeting recording playback endpoint"
```

---

## Task 6: Frontend service and query hooks

**Files:**

- Modify: `apps/web/services/meeting.service.ts`
- Modify: `apps/web/queries/meetings.ts`

- [ ] **Step 1: Add types and service method**

`meeting.service.ts`:

```typescript
export interface MeetingRecordingResponse {
  status: 'ready' | 'processing' | 'unavailable';
  url?: string;
  source?: 's3' | 'recall';
}

export class MeetingService {
  // ...existing...
  static async getRecording(id: string) {
    return ApiClient.get<MeetingRecordingResponse>(`/api/meetings/${id}/recording`);
  }
}
```

- [ ] **Step 2: Add query hook**

`queries/meetings.ts`:

```typescript
export const meetingKeys = {
  // ...existing...
  recording: (id: string) => [...meetingKeys.all, id, 'recording'] as const,
};

export const useMeetingRecording = (meetingId: string, enabled: boolean) => {
  return useQuery({
    queryKey: meetingKeys.recording(meetingId),
    queryFn: () => MeetingService.getRecording(meetingId),
    enabled: enabled && !!meetingId,
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 5000 : false),
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/services/meeting.service.ts apps/web/queries/meetings.ts
git commit -m "feat: add meeting recording query hook"
```

---

## Task 7: Meeting detail UI components

**Files:**

- Create: `apps/web/components/meetings/MeetingNotesTab.tsx`
- Create: `apps/web/components/meetings/MeetingTranscriptTab.tsx`
- Create: `apps/web/components/meetings/MeetingRecordingPlayer.tsx`
- Modify: `apps/web/components/meetings/MeetingDetail.tsx`

- [ ] **Step 1: Create MeetingNotesTab**

`MeetingNotesTab.tsx` — props: `{ notes, structuredDoc, keyPoints }`.

Render three sections (hide empty):

1. Key takeaways — `<ul>` from `keyPoints`
2. Meeting notes — `<CustomMarkdown message={notes} />`
3. Structured document — `<CustomMarkdown message={structuredDoc} />`

- [ ] **Step 2: Create MeetingRecordingPlayer**

Props: `{ meetingId, showRecordingPanel }`.

Uses `useMeetingRecording(meetingId, showRecordingPanel)`.

States:

- `isLoading` or `status === 'processing'` → spinner + "Processing recording…"
- `status === 'ready' && url` →
  `<video src={url} controls className="w-full rounded-lg" onError={() => setExpired(true)} />`
- else → `<EmptyMessage message="Recording not available" />`
- `expired` state → "Recording expired or unavailable"

- [ ] **Step 3: Create MeetingTranscriptTab**

Props: `{ meetingId, transcript, showRecordingPanel }`.

Layout:

```tsx
<div className='grid gap-6 lg:grid-cols-2'>
  <div>{/* transcript header + copy button + scrollable pre/div */}</div>
  <MeetingRecordingPlayer meetingId={meetingId} showRecordingPanel={showRecordingPanel} />
</div>
```

Copy button: `navigator.clipboard.writeText(transcript)` + `toast.success`.

Speaker lines: split by `\n`, if line matches `/^Speaker \d+:/` wrap label in `text-muted-foreground font-medium`.

- [ ] **Step 4: Refactor MeetingDetail**

Replace three tabs with:

```tsx
{
  status === MeetingStatusEnum.COMPLETED && (
    <Tabs defaultValue='notes'>
      <TabsList>
        <TabsTrigger value='notes'>Notes</TabsTrigger>
        <TabsTrigger value='transcript'>Transcript</TabsTrigger>
      </TabsList>
      <TabsContent value='notes'>
        <MeetingNotesTab notes={meeting.notes} structuredDoc={meeting.structuredDoc} keyPoints={meeting.keyPoints} />
      </TabsContent>
      <TabsContent value='transcript'>
        <MeetingTranscriptTab
          meetingId={meeting.id}
          transcript={meeting.transcript}
          showRecordingPanel={meeting.showRecordingPanel}
        />
      </TabsContent>
    </Tabs>
  );
}
```

Track active tab with `useState` if needed to lazy-enable recording fetch only on transcript tab:

```typescript
const [activeTab, setActiveTab] = useState('notes');
// Tabs onValueChange={setActiveTab}
// MeetingTranscriptTab only mounts when activeTab === 'transcript' OR pass enabled={activeTab === 'transcript'}
```

- [ ] **Step 5: Visual check**

Open a COMPLETED meeting in browser; verify Notes sections and Transcript layout match spec.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/meetings/
git commit -m "feat: redesign meeting detail with Notes and Transcript tabs"
```

---

## Task 8: End-to-end verification

- [ ] **Step 1: Run server tests**

```bash
cd apps/server && pnpm exec jest src/common/s3 src/meetings --runInBand
```

Expected: all pass.

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter server typecheck && pnpm --filter web typecheck
```

- [ ] **Step 3: Full meeting flow (manual)**

1. Ensure S3 env vars point to a reachable bucket (AWS or MinIO)
2. Schedule + run a short Meet with bot
3. Wait for COMPLETED
4. Verify Notes tab content
5. Verify Transcript tab shows text + playable video
6. Temporarily break S3 creds on next meeting → confirm FALLBACK still plays until expiry

- [ ] **Step 4: Final commit if any fixups**

```bash
git commit -m "fix: address recording transcript integration issues"
```

---

## Plan Self-Review

| Spec requirement                  | Task                            |
| --------------------------------- | ------------------------------- |
| Notes \| Transcript tabs          | Task 7                          |
| Key points + notes + doc in Notes | Task 7 (`MeetingNotesTab`)      |
| Transcript + video two-column     | Task 7 (`MeetingTranscriptTab`) |
| COMPLETED-only visibility         | Task 7 (`MeetingDetail`)        |
| S3 long-term storage              | Task 2, 4                       |
| Recall fallback on S3 fail        | Task 4                          |
| `video_mixed_mp4` bot config      | Task 3                          |
| Expose transcript on detail       | Task 4 (`toResponse`)           |
| Lazy recording endpoint           | Task 5, 6                       |
| `showRecordingPanel` + polling    | Task 4, 6, 7                    |
| No transcript on list             | Task 4 (detail only)            |
| Route order                       | Task 5                          |

No placeholders remain. Types consistent across Prisma → DTO → Zod → frontend.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-29-meeting-recording-transcript.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks
2. **Inline Execution** — implement task-by-task in this session with checkpoints

Which approach do you want?
