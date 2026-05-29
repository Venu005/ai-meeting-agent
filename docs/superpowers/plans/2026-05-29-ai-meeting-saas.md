# AI Meeting Agent SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a minutes-based SaaS where a Recall.ai bot joins Google Meet calls, Mastra generates role-based
notes/PRDs, and Stripe bills Free (10 min) vs Pro (300 min) plans.

**Architecture:** NestJS (`apps/server`) owns users, meetings, billing, calendar, and webhooks. Mastra (`apps/agent`)
runs the `meeting-processing` workflow with persona agents. Next.js (`apps/web`) provides onboarding, scheduling,
dashboard, and billing UI.

**Tech Stack:** NestJS 11, Next.js 15, Prisma/PostgreSQL, Mastra, Recall.ai, Stripe Checkout, Google Calendar API,
Vercel AI SDK patterns, TanStack Query, `@repo/ui`

**Spec:** `docs/superpowers/specs/2026-05-29-ai-meeting-saas-design.md`

---

## File Map

| File / directory                                  | Action | Responsibility                                                      |
| ------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `apps/agent/`                                     | Create | Mastra agents, workflow, Studio dev server                          |
| `packages/db/prisma/schema.prisma`                | Modify | UserPersona, Meeting, Subscription, UsagePeriod, CalendarConnection |
| `packages/shared-types/enums/`                    | Create | Shared enums mirrored from Prisma                                   |
| `packages/shared-types/schemas/meeting.schema.ts` | Create | Zod schemas for meeting forms                                       |
| `packages/shared-types/schemas/billing.schema.ts` | Create | Zod schemas for billing responses                                   |
| `apps/server/src/common/config.ts`                | Modify | Stripe, Recall, Mastra, calendar env vars                           |
| `apps/server/src/billing/`                        | Create | Stripe checkout, webhooks, usage metering                           |
| `apps/server/src/meetings/`                       | Create | CRUD, Recall client, webhooks, cron dispatch                        |
| `apps/server/src/calendar/`                       | Create | Google Calendar OAuth + event bot toggle                            |
| `apps/server/src/users/`                          | Create | Onboarding endpoint, extended `/me`                                 |
| `apps/server/src/mastra/`                         | Create | HTTP client to `apps/agent`                                         |
| `apps/server/src/common/utils/encryption.ts`      | Create | Token encrypt/decrypt for calendar OAuth                            |
| `apps/web/services/meeting.service.ts`            | Create | Meeting API calls                                                   |
| `apps/web/services/billing.service.ts`            | Create | Billing API calls                                                   |
| `apps/web/services/calendar.service.ts`           | Create | Calendar API calls                                                  |
| `apps/web/queries/meetings.ts`                    | Create | TanStack Query hooks                                                |
| `apps/web/queries/billing.ts`                     | Create | Usage + checkout hooks                                              |
| `apps/web/app/onboarding/page.tsx`                | Create | Persona picker                                                      |
| `apps/web/app/(main)/dashboard/page.tsx`          | Modify | Meeting hub + usage bar                                             |
| `apps/web/app/(main)/meetings/new/page.tsx`       | Create | Schedule form                                                       |
| `apps/web/app/(main)/meetings/[id]/page.tsx`      | Create | Meeting detail tabs                                                 |
| `apps/web/app/(main)/calendar/page.tsx`           | Create | Calendar events + bot toggle                                        |
| `apps/web/app/(main)/settings/billing/page.tsx`   | Create | Plan + upgrade                                                      |
| `apps/web/components/meetings/`                   | Create | UsageBar, MeetingCard, ScheduleForm, etc.                           |

---

## Phase 1 — Foundation

### Task 1: Shared enums and Zod schemas

**Files:**

- Create: `packages/shared-types/enums/meeting.enum.ts`
- Create: `packages/shared-types/enums/billing.enum.ts`
- Create: `packages/shared-types/enums/user-persona.enum.ts`
- Create: `packages/shared-types/enums/index.ts`
- Create: `packages/shared-types/schemas/meeting.schema.ts`
- Create: `packages/shared-types/schemas/billing.schema.ts`
- Modify: `packages/shared-types/schemas/index.ts`

- [ ] **Step 1: Create enum files**

`packages/shared-types/enums/user-persona.enum.ts`:

```typescript
export enum UserPersonaEnum {
  SOLO_FOUNDER = 'SOLO_FOUNDER',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  ENGINEERING_LEAD = 'ENGINEERING_LEAD',
}
```

`packages/shared-types/enums/meeting.enum.ts`:

```typescript
export enum MeetingStatusEnum {
  SCHEDULED = 'SCHEDULED',
  BOT_JOINING = 'BOT_JOINING',
  IN_PROGRESS = 'IN_PROGRESS',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum MeetingSourceEnum {
  MANUAL = 'MANUAL',
  GOOGLE_CALENDAR = 'GOOGLE_CALENDAR',
}
```

`packages/shared-types/enums/billing.enum.ts`:

```typescript
export enum SubscriptionPlanEnum {
  FREE = 'FREE',
  PRO = 'PRO',
}

export enum SubscriptionStatusEnum {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
}
```

`packages/shared-types/enums/index.ts`:

```typescript
export * from './user-persona.enum';
export * from './meeting.enum';
export * from './billing.enum';
```

- [ ] **Step 2: Create Zod schemas**

`packages/shared-types/schemas/meeting.schema.ts`:

```typescript
import { z } from 'zod';
import { MeetingSourceEnum, MeetingStatusEnum } from '../enums';

const googleMeetUrlRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i;

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  meetUrl: z.string().regex(googleMeetUrlRegex, 'Must be a valid Google Meet URL'),
  scheduledAt: z.string().datetime({ message: 'Invalid date/time' }),
  estimatedDurationMinutes: z.number().int().min(1).max(480).default(30),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const meetingSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  meetUrl: z.string(),
  scheduledAt: z.string(),
  durationMinutes: z.number().nullable(),
  status: z.nativeEnum(MeetingStatusEnum),
  source: z.nativeEnum(MeetingSourceEnum),
  notes: z.string().nullable(),
  structuredDoc: z.string().nullable(),
  keyPoints: z.array(z.string()).nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Meeting = z.infer<typeof meetingSchema>;
```

`packages/shared-types/schemas/billing.schema.ts`:

```typescript
import { z } from 'zod';
import { SubscriptionPlanEnum } from '../enums';

export const usageSchema = z.object({
  minutesUsed: z.number(),
  minutesIncluded: z.number(),
  minutesRemaining: z.number(),
  plan: z.nativeEnum(SubscriptionPlanEnum),
  periodEnd: z.string(),
});

export type Usage = z.infer<typeof usageSchema>;
```

- [ ] **Step 3: Export from barrel**

Add to `packages/shared-types/schemas/index.ts`:

```typescript
export * from './meeting.schema';
export * from './billing.schema';
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @repo/shared-types exec tsc --noEmit`  
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/
git commit -m "feat: add meeting and billing shared types"
```

---

### Task 2: Prisma schema extension

**Files:**

- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Add enums and models to schema**

Append to `packages/db/prisma/schema.prisma` (after existing enums):

```prisma
enum UserPersona {
  SOLO_FOUNDER
  PRODUCT_MANAGER
  ENGINEERING_LEAD
}

enum SubscriptionPlan {
  FREE
  PRO
}

enum SubscriptionStatus {
  active
  canceled
  past_due
}

enum MeetingStatus {
  SCHEDULED
  BOT_JOINING
  IN_PROGRESS
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

enum MeetingSource {
  MANUAL
  GOOGLE_CALENDAR
}
```

Extend `User` model — add fields and relations:

```prisma
  persona              UserPersona?
  onboardingCompleted  Boolean @default(false)
  subscription         Subscription?
  meetings             Meeting[]
  calendarConnection   CalendarConnection?
  usagePeriod          UsagePeriod?
```

Add new models:

```prisma
model Subscription {
  id                   String             @id @default(uuid()) @db.Uuid
  userId               String             @unique @db.Uuid
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  plan                 SubscriptionPlan   @default(FREE)
  status               SubscriptionStatus @default(active)
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

model UsagePeriod {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @unique @db.Uuid
  minutesIncluded Int      @default(10)
  minutesUsed     Int      @default(0)
  periodStart     DateTime @default(now())
  periodEnd       DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("usage_periods")
}

model Meeting {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @db.Uuid
  title           String
  meetUrl         String
  scheduledAt     DateTime
  durationMinutes Int?
  status          MeetingStatus  @default(SCHEDULED)
  source          MeetingSource  @default(MANUAL)
  recallBotId     String?
  googleEventId   String?
  transcript      String?        @db.Text
  notes           String?        @db.Text
  structuredDoc   String?        @db.Text
  keyPoints       Json?
  failureReason   String?
  processingAttempts Int         @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([scheduledAt])
  @@map("meetings")
}

model CalendarConnection {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @unique @db.Uuid
  accessToken  String   @db.Text
  refreshToken String   @db.Text
  expiresAt    DateTime
  googleEmail  String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("calendar_connections")
}
```

- [ ] **Step 2: Generate and migrate**

Run:

```bash
pnpm db:generate
pnpm db:migrate
```

Expected: migration created and applied

- [ ] **Step 3: Commit**

```bash
git add packages/db/
git commit -m "feat: add meeting billing and calendar prisma models"
```

---

### Task 3: Scaffold `apps/agent` Mastra project

**Files:**

- Create: `apps/agent/package.json`
- Create: `apps/agent/tsconfig.json`
- Create: `apps/agent/.env.example`
- Create: `apps/agent/src/mastra/index.ts`
- Create: `apps/agent/src/mastra/agents/notes-agent.ts`
- Create: `apps/agent/src/mastra/agents/founder-agent.ts`
- Create: `apps/agent/src/mastra/agents/pm-agent.ts`
- Create: `apps/agent/src/mastra/agents/eng-lead-agent.ts`
- Create: `apps/agent/src/mastra/workflows/meeting-processing.ts`
- Create: `apps/agent/src/mastra/prompts/founder-prd.md`
- Create: `apps/agent/src/mastra/prompts/pm-prd.md`
- Create: `apps/agent/src/mastra/prompts/eng-rfc.md`
- Modify: `turbo.json` (agent dev task inherits default)

- [ ] **Step 1: Create package.json**

`apps/agent/package.json`:

```json
{
  "name": "agent",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@mastra/core": "latest",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "mastra": "latest",
    "typescript": "5.8.2"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Install dependencies**

Run: `pnpm install --filter agent`

- [ ] **Step 4: Verify model via provider registry**

Run:

```bash
node .agents/skills/mastra/scripts/provider-registry.mjs openai
```

Pick a model from output (e.g. `openai/gpt-4.1`) and use consistently in all agents.

- [ ] **Step 5: Create notes-agent**

`apps/agent/src/mastra/agents/notes-agent.ts`:

```typescript
import { Agent } from '@mastra/core/agent';

export const notesAgent = new Agent({
  id: 'notes-agent',
  name: 'Meeting Notes Agent',
  instructions: `You extract structured meeting notes from transcripts.
Output Markdown with sections: Attendees, Topics Discussed, Decisions, Action Items.
Be factual; do not invent details not present in the transcript.`,
  model: 'openai/gpt-4.1',
});
```

Create `founder-agent.ts`, `pm-agent.ts`, `eng-lead-agent.ts` similarly with persona-specific instructions loaded from
`prompts/*.md` via `readFileSync`.

- [ ] **Step 6: Create meeting-processing workflow**

`apps/agent/src/mastra/workflows/meeting-processing.ts`:

````typescript
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { notesAgent } from '../agents/notes-agent';
import { founderAgent } from '../agents/founder-agent';
import { pmAgent } from '../agents/pm-agent';
import { engLeadAgent } from '../agents/eng-lead-agent';

const workflowInputSchema = z.object({
  transcript: z.string().min(1),
  userRole: z.enum(['SOLO_FOUNDER', 'PRODUCT_MANAGER', 'ENGINEERING_LEAD']),
  meetingTitle: z.string(),
  attendees: z.array(z.string()).optional(),
  durationMinutes: z.number().optional(),
});

const normalizeStep = createStep({
  id: 'normalize-transcript',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({ transcript: z.string(), userRole: z.string(), meetingTitle: z.string() }),
  execute: async ({ inputData }) => ({
    transcript: inputData.transcript.trim(),
    userRole: inputData.userRole,
    meetingTitle: inputData.meetingTitle,
  }),
});

const keyPointsStep = createStep({
  id: 'extract-key-points',
  inputSchema: z.object({ transcript: z.string(), userRole: z.string(), meetingTitle: z.string() }),
  outputSchema: z.object({
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const result = await notesAgent.generate(
      `Extract 5-10 key bullet points from this meeting titled "${inputData.meetingTitle}". Return JSON array of strings only.\n\n${inputData.transcript}`
    );
    const parsed = JSON.parse(result.text.replace(/```json|```/g, '').trim()) as string[];
    return { ...inputData, keyPoints: parsed };
  },
});

const notesStep = createStep({
  id: 'generate-meeting-notes',
  inputSchema: z.object({
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  outputSchema: z.object({
    notes: z.string(),
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const result = await notesAgent.generate(
      `Generate detailed meeting notes for "${inputData.meetingTitle}".\n\nTranscript:\n${inputData.transcript}`
    );
    return { ...inputData, notes: result.text };
  },
});

const docStep = createStep({
  id: 'generate-structured-doc',
  inputSchema: z.object({
    notes: z.string(),
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  outputSchema: z.object({
    notes: z.string(),
    structuredDoc: z.string(),
    keyPoints: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const agentMap = {
      SOLO_FOUNDER: founderAgent,
      PRODUCT_MANAGER: pmAgent,
      ENGINEERING_LEAD: engLeadAgent,
    } as const;
    const agent = agentMap[inputData.userRole as keyof typeof agentMap];
    const result = await agent.generate(
      `Using these meeting notes, produce the structured document for "${inputData.meetingTitle}".\n\n${inputData.notes}`
    );
    return { notes: inputData.notes, structuredDoc: result.text, keyPoints: inputData.keyPoints };
  },
});

export const meetingProcessingWorkflow = createWorkflow({
  id: 'meeting-processing',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    notes: z.string(),
    structuredDoc: z.string(),
    keyPoints: z.array(z.string()),
  }),
})
  .then(normalizeStep)
  .then(keyPointsStep)
  .then(notesStep)
  .then(docStep)
  .commit();
````

- [ ] **Step 7: Register in Mastra index**

`apps/agent/src/mastra/index.ts`:

```typescript
import { Mastra } from '@mastra/core/mastra';
import { meetingProcessingWorkflow } from './workflows/meeting-processing';
import { notesAgent } from './agents/notes-agent';
import { founderAgent } from './agents/founder-agent';
import { pmAgent } from './agents/pm-agent';
import { engLeadAgent } from './agents/eng-lead-agent';

export const mastra = new Mastra({
  agents: { notesAgent, founderAgent, pmAgent, engLeadAgent },
  workflows: { meetingProcessingWorkflow },
});
```

- [ ] **Step 8: Test in Studio**

Run: `pnpm --filter agent dev`  
Open: `http://localhost:4111`  
Run workflow with sample transcript for each persona. Expected: notes + structuredDoc + keyPoints returned.

- [ ] **Step 9: Commit**

```bash
git add apps/agent/
git commit -m "feat: scaffold Mastra meeting-processing workflow and role agents"
```

---

## Phase 2 — Billing & usage metering

### Task 4: Server config + billing module

**Files:**

- Modify: `apps/server/src/common/config.ts`
- Modify: `apps/server/.env.example`
- Create: `apps/server/src/billing/billing.module.ts`
- Create: `apps/server/src/billing/billing.service.ts`
- Create: `apps/server/src/billing/billing.controller.ts`
- Create: `apps/server/src/billing/billing.service.spec.ts`
- Modify: `apps/server/src/app.module.ts`

- [ ] **Step 1: Extend config**

Add to `apps/server/src/common/config.ts`:

```typescript
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    proPriceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
  recall: {
    apiKey: process.env.RECALL_API_KEY!,
    webhookSecret: process.env.RECALL_WEBHOOK_SECRET!,
    baseUrl: process.env.RECALL_BASE_URL ?? 'https://api.recall.ai/api/v1',
  },
  mastra: {
    url: process.env.MASTRA_URL ?? 'http://localhost:4111',
  },
  calendar: {
    clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
  },
  encryption: {
    key: process.env.TOKEN_ENCRYPTION_KEY!,
  },
```

- [ ] **Step 2: Write failing usage test**

`apps/server/src/billing/billing.service.spec.ts`:

```typescript
import { BillingService } from './billing.service';

describe('BillingService', () => {
  describe('canUseMinutes', () => {
    it('returns false when requested minutes exceed remaining balance', () => {
      const service = new BillingService({} as any, {} as any);
      expect(service.canUseMinutes({ minutesUsed: 9, minutesIncluded: 10 }, 2)).toBe(false);
      expect(service.canUseMinutes({ minutesUsed: 8, minutesIncluded: 10 }, 2)).toBe(true);
    });
  });
});
```

Extract `canUseMinutes` as a pure method on BillingService.

- [ ] **Step 3: Run test — expect FAIL**

Run: `pnpm --filter server test billing.service.spec.ts`  
Expected: FAIL — BillingService not found

- [ ] **Step 4: Implement BillingService**

Key methods:

- `getOrCreateUsagePeriod(userId)` — create with 10 min if missing; periodEnd = +30 days
- `canUseMinutes(usage, requestedMinutes)` — `minutesUsed + requested <= minutesIncluded`
- `deductMinutes(userId, minutes)` — increment `minutesUsed`
- `createCheckoutSession(userId, email)` — Stripe Checkout subscription mode
- `createPortalSession(stripeCustomerId)` — Stripe billing portal
- `handleWebhook(rawBody, signature)` — verify + handle events

On `checkout.session.completed`: upsert Subscription with PRO plan.  
On `invoice.paid`: reset `minutesUsed = 0`, set `minutesIncluded = 300` (PRO) or `10` (FREE).  
On `customer.subscription.deleted`: set plan FREE.

Install: `pnpm --filter server add stripe`

- [ ] **Step 5: Implement BillingController**

```typescript
@Controller('billing')
export class BillingController {
  @Get('usage') getUsage(@CurrentUser() user: RequestUser) { ... }
  @Post('checkout') createCheckout(@CurrentUser() user: RequestUser) { ... }
  @Post('portal') createPortal(@CurrentUser() user: RequestUser) { ... }
  @Public()
  @Post('webhook') handleWebhook(@Req() req: RawBodyRequest<Request>) { ... }
}
```

Use `rawBody: true` in NestJS bootstrap for Stripe webhook signature verification.

- [ ] **Step 6: Register module in AppModule**

- [ ] **Step 7: Run tests — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/billing/ apps/server/src/common/config.ts apps/server/src/app.module.ts apps/server/.env.example
git commit -m "feat: add Stripe billing module with minute usage metering"
```

---

## Phase 3 — Meetings module + Recall integration

### Task 5: Recall client and meetings service

**Files:**

- Create: `apps/server/src/meetings/recall.client.ts`
- Create: `apps/server/src/meetings/meetings.service.ts`
- Create: `apps/server/src/meetings/meetings.controller.ts`
- Create: `apps/server/src/meetings/meetings.scheduler.ts`
- Create: `apps/server/src/meetings/dto/create-meeting.dto.ts`
- Create: `apps/server/src/meetings/meetings.module.ts`
- Create: `apps/server/src/mastra/mastra.client.ts`
- Create: `apps/server/src/mastra/mastra.module.ts`
- Create: `apps/server/src/meetings/meetings.service.spec.ts`

- [ ] **Step 1: Write failing minute pre-check test**

```typescript
it('rejects scheduling when insufficient minutes', async () => {
  await expect(service.create(userId, dto)).rejects.toMatchObject({ status: 403 });
});
```

- [ ] **Step 2: Implement RecallClient**

`recall.client.ts`:

```typescript
@Injectable()
export class RecallClient {
  async createBot(params: { meetingUrl: string; joinAt: string; botName?: string }) {
    const res = await fetch(`${config.recall.baseUrl}/bot`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.recall.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_url: params.meetingUrl,
        join_at: params.joinAt,
        bot_name: params.botName ?? 'AI Meeting Agent',
        transcription_options: { provider: 'default' },
      }),
    });
    if (!res.ok) throw new Error(`Recall API error: ${res.status}`);
    return res.json() as Promise<{ id: string }>;
  }
}
```

- [ ] **Step 3: Implement MeetingsService.create**

1. Load user + usagePeriod
2. Call `billingService.canUseMinutes(usage, dto.estimatedDurationMinutes)` — throw
   `ForbiddenException({ code: 'INSUFFICIENT_MINUTES' })`
3. Create Meeting with status SCHEDULED

- [ ] **Step 4: Implement MeetingsScheduler**

Install `@nestjs/schedule`. Cron every minute:

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async dispatchScheduledBots() {
  const due = await this.prisma.meeting.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
  });
  for (const meeting of due) {
    await this.dispatchBot(meeting.id);
  }
}
```

`dispatchBot`: call Recall → set BOT_JOINING + recallBotId.

- [ ] **Step 5: Implement Recall webhook handler**

`POST /api/meetings/webhook/recall` (`@Public()`):

Parse events:

- `bot.joining_call` → IN_PROGRESS
- `bot.done` / `bot.fatal` → extract transcript + duration

  - On done: deduct minutes, set PROCESSING, call Mastra
  - On fatal: FAILED, no minute deduction if join never succeeded

- [ ] **Step 6: Implement MastraClient**

```typescript
@Injectable()
export class MastraClient {
  async processMeeting(input: MeetingProcessingInput) {
    const res = await fetch(`${config.mastra.url}/api/workflows/meetingProcessingWorkflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputData: input }),
    });
    if (!res.ok) throw new Error(`Mastra error: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'success') throw new Error(data.error?.message ?? 'Workflow failed');
    return data.result as { notes: string; structuredDoc: string; keyPoints: string[] };
  }
}
```

Verify exact Mastra HTTP path via `mastra api` CLI or embedded docs at implementation time.

- [ ] **Step 7: On workflow success**

Update meeting: notes, structuredDoc, keyPoints, status COMPLETED.  
Send completion email via MailService.

- [ ] **Step 8: Run unit tests — expect PASS**

- [ ] **Step 9: Commit**

```bash
git add apps/server/src/meetings/ apps/server/src/mastra/
git commit -m "feat: add meetings module with Recall bot dispatch and Mastra processing"
```

---

### Task 6: Users onboarding module

**Files:**

- Create: `apps/server/src/users/users.module.ts`
- Create: `apps/server/src/users/users.controller.ts`
- Create: `apps/server/src/users/users.service.ts`
- Create: `apps/server/src/users/dto/onboarding.dto.ts`

- [ ] **Step 1: Create OnboardingDto**

```typescript
export class OnboardingDto {
  @ApiProperty({ enum: UserPersona })
  @IsEnum(UserPersona)
  persona: UserPersona;
}
```

- [ ] **Step 2: Implement POST /api/users/onboarding**

Set `user.persona`, `onboardingCompleted = true`.  
Ensure `UsagePeriod` exists (call billingService.getOrCreateUsagePeriod).

- [ ] **Step 3: Extend GET /api/users/me** (or auth me endpoint)

Include: `persona`, `onboardingCompleted`, usage summary from billing.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/users/
git commit -m "feat: add user onboarding with persona selection"
```

---

## Phase 4 — Google Calendar

### Task 7: Calendar module

**Files:**

- Create: `apps/server/src/common/utils/encryption.ts`
- Create: `apps/server/src/calendar/calendar.module.ts`
- Create: `apps/server/src/calendar/calendar.service.ts`
- Create: `apps/server/src/calendar/calendar.controller.ts`

- [ ] **Step 1: Implement encryption util**

Use Node `crypto.createCipheriv` / `createDecipheriv` with `TOKEN_ENCRYPTION_KEY` (32-byte hex).

- [ ] **Step 2: OAuth connect flow**

`GET /api/calendar/connect` → redirect to Google OAuth with scopes:

```
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events.readonly
```

`GET /api/calendar/callback` → store encrypted tokens in CalendarConnection.

- [ ] **Step 3: List events with Meet links**

`GET /api/calendar/events` → Google Calendar API `events.list` → filter events where `conferenceData.entryPoints` or
`hangoutLink` contains `meet.google.com`.

- [ ] **Step 4: Enable bot for event**

`POST /api/calendar/events/:eventId/bot`:

Create Meeting with source GOOGLE_CALENDAR, googleEventId, meetUrl from event, scheduledAt from event start.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/calendar/ apps/server/src/common/utils/encryption.ts
git commit -m "feat: add Google Calendar OAuth and bot scheduling"
```

---

## Phase 5 — Frontend

### Task 8: Web services and queries

**Files:**

- Create: `apps/web/services/meeting.service.ts`
- Create: `apps/web/services/billing.service.ts`
- Create: `apps/web/services/calendar.service.ts`
- Create: `apps/web/queries/meetings.ts`
- Create: `apps/web/queries/billing.ts`
- Modify: `apps/web/services/index.ts`
- Modify: `apps/web/queries/index.ts`

- [ ] **Step 1: MeetingService**

```typescript
export class MeetingService {
  static async list(params?: { page?: number; limit?: number }) {
    return ApiClient.get<PaginatedMeetings>('/api/meetings', { params });
  }
  static async get(id: string) {
    return ApiClient.get<Meeting>(`/api/meetings/${id}`);
  }
  static async create(input: CreateMeetingInput) {
    return ApiClient.post<Meeting>('/api/meetings', input);
  }
  static async cancel(id: string) {
    return ApiClient.patch<Meeting>(`/api/meetings/${id}/cancel`);
  }
}
```

- [ ] **Step 2: BillingService + CalendarService** — mirror API routes from spec

- [ ] **Step 3: TanStack Query hooks**

```typescript
export function useMeetings() {
  return useQuery({ queryKey: ['meetings'], queryFn: () => MeetingService.list(), refetchOnMount: 'always' });
}
export function useUsage() {
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: () => BillingService.getUsage(),
    refetchOnMount: 'always',
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/services/ apps/web/queries/
git commit -m "feat: add meeting billing and calendar web services"
```

---

### Task 9: Onboarding page

**Files:**

- Create: `apps/web/app/onboarding/page.tsx`
- Create: `apps/web/components/onboarding/PersonaPicker.tsx`
- Modify: `apps/web/app/AuthWrapper.tsx` — redirect if `!onboardingCompleted`

- [ ] **Step 1: PersonaPicker component**

Three cards: Solo Founder, Product Manager, Engineering Lead.  
On select → `POST /api/users/onboarding` → redirect `/dashboard`.

- [ ] **Step 2: AuthWrapper guard**

If authenticated and `onboardingCompleted === false`, redirect to `/onboarding`.

- [ ] **Step 3: Manual test**

Sign up → onboarding → dashboard. Expected: persona saved.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/onboarding/ apps/web/components/onboarding/ apps/web/app/AuthWrapper.tsx
git commit -m "feat: add persona onboarding flow"
```

---

### Task 10: Dashboard and schedule meeting

**Files:**

- Create: `apps/web/components/meetings/UsageBar.tsx`
- Create: `apps/web/components/meetings/MeetingCard.tsx`
- Create: `apps/web/components/meetings/ScheduleForm.tsx`
- Create: `apps/web/components/meetings/UpgradeModal.tsx`
- Modify: `apps/web/app/(main)/dashboard/page.tsx`
- Create: `apps/web/app/(main)/meetings/new/page.tsx`

- [ ] **Step 1: UsageBar**

Show `minutesUsed / minutesIncluded` progress bar.  
If `minutesRemaining <= 2`, show warning. If 0, show upgrade button.

- [ ] **Step 2: ScheduleForm**

`react-hook-form` + `createMeetingSchema`.  
On submit → `MeetingService.create`.  
On 403 `INSUFFICIENT_MINUTES` → open UpgradeModal.

- [ ] **Step 3: Dashboard**

UsageBar + upcoming SCHEDULED meetings + recent COMPLETED/FAILED list.

- [ ] **Step 4: Write RTL test for ScheduleForm**

Test: invalid Meet URL shows error; valid submission calls service.

Run: `pnpm --filter web test ScheduleForm`

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/meetings/ apps/web/app/(main)/
git commit -m "feat: add dashboard usage bar and meeting schedule form"
```

---

### Task 11: Meeting detail page

**Files:**

- Create: `apps/web/app/(main)/meetings/[id]/page.tsx`
- Create: `apps/web/components/meetings/MeetingDetail.tsx`

- [ ] **Step 1: MeetingDetail tabs**

Tabs: Meeting Notes | PRD/Doc | Key Points.  
Render Markdown via existing `CustomMarkdown` component.  
Show status badge + loading state while PROCESSING.

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(main)/meetings/[id]/ apps/web/components/meetings/MeetingDetail.tsx
git commit -m "feat: add meeting detail page with tabbed notes view"
```

---

### Task 12: Calendar and billing pages

**Files:**

- Create: `apps/web/app/(main)/calendar/page.tsx`
- Create: `apps/web/components/calendar/CalendarEventList.tsx`
- Create: `apps/web/app/(main)/settings/billing/page.tsx`

- [ ] **Step 1: Calendar page**

Connect button if no calendar. List events with Meet link + "Send bot" toggle.

- [ ] **Step 2: Billing page**

Show plan, usage, Upgrade button → `BillingService.checkout()` redirect.  
Manage subscription → portal URL.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(main)/calendar/ apps/web/app/(main)/settings/billing/
git commit -m "feat: add calendar and billing settings pages"
```

---

## Phase 6 — Email notifications

### Task 13: Meeting email templates

**Files:**

- Create: `apps/server/src/mail/templates/meeting-completed.hbs`
- Create: `apps/server/src/mail/templates/meeting-failed.hbs`
- Create: `apps/server/src/mail/templates/minutes-low.hbs`
- Modify: `apps/server/src/mail/mail.service.ts`

- [ ] **Step 1: meeting-completed template**

Include: meeting title, first 3 key points, link to `{FRONTEND_URL}/meetings/{id}`.

- [ ] **Step 2: Wire MailService methods**

```typescript
async sendMeetingCompleted(email: string, data: { title: string; keyPoints: string[]; meetingUrl: string }) { ... }
async sendMeetingFailed(email: string, data: { title: string; reason: string }) { ... }
async sendMinutesLowWarning(email: string, data: { minutesRemaining: number }) { ... }
```

- [ ] **Step 3: Call from MeetingsService and BillingService**

After COMPLETED → sendMeetingCompleted.  
After FAILED → sendMeetingFailed.  
After minute deduction when remaining <= 2 → sendMinutesLowWarning.

- [ ] **Step 4: Commit**

```bash
git add apps/server/src/mail/
git commit -m "feat: add meeting and billing email notifications"
```

---

## Phase 7 — Integration smoke test

### Task 14: End-to-end smoke test script

**Files:**

- Create: `apps/server/test/meeting-lifecycle.e2e-spec.ts`

- [ ] **Step 1: Write e2e test with mocked Recall + Mastra**

Mock RecallClient.createBot and MastraClient.processMeeting.  
Flow: create meeting → scheduler dispatches → webhook done → meeting COMPLETED with notes.

- [ ] **Step 2: Run e2e**

Run: `pnpm --filter server test:e2e meeting-lifecycle`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/server/test/meeting-lifecycle.e2e-spec.ts
git commit -m "test: add meeting lifecycle e2e smoke test"
```

---

## Environment setup checklist

Before running the full stack locally:

```bash
# apps/server/.env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
RECALL_API_KEY=...
RECALL_WEBHOOK_SECRET=...
MASTRA_URL=http://localhost:4111
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3001/api/calendar/callback
TOKEN_ENCRYPTION_KEY=<64-char-hex>

# apps/agent/.env
OPENAI_API_KEY=sk-...
```

Run all services:

```bash
pnpm --filter agent dev      # :4111 Studio
pnpm --filter server dev     # :3001 API
pnpm --filter web dev        # :3000 UI
```

Stripe webhook locally: `stripe listen --forward-to localhost:3001/api/billing/webhook`

---

## Spec coverage checklist

| Spec section              | Task(s)    |
| ------------------------- | ---------- |
| Mastra agents + workflow  | Task 3     |
| Prisma data model         | Task 2     |
| Minute metering           | Task 4, 5  |
| Stripe billing            | Task 4     |
| Meetings CRUD + lifecycle | Task 5     |
| Recall webhooks           | Task 5     |
| Google Calendar           | Task 7     |
| Onboarding persona        | Task 6, 9  |
| Frontend routes           | Tasks 9–12 |
| Email notifications       | Task 13    |
| Background cron jobs      | Task 5     |
| E2E smoke test            | Task 14    |

---

## Execution notes

- Verify Mastra HTTP endpoint path against installed `@mastra/core` embedded docs before wiring MastraClient.
- Verify Recall webhook event names against Recall.ai docs for Google Meet bots.
- Use `@Public()` on Stripe, Recall webhooks; enable raw body parsing for Stripe signature verification in `main.ts`.
- Initialize `UsagePeriod` on user registration (auth.service) and onboarding as fallback.
