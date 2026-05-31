# Meetra

AI meeting assistant SaaS — send a bot to Google Meet calls, get AI-generated notes and role-based documents, and manage
usage with Stripe billing.

Built as a **pnpm monorepo** with Next.js 15, NestJS 11, Prisma/PostgreSQL, Mastra, Recall.ai, and Stripe.

## Features

- **Google Meet bot** — Recall.ai joins scheduled calls and captures recordings/transcripts
- **AI processing** — Mastra workflows generate meeting notes, key points, and persona-specific docs (Founder, PM,
  Engineering Lead)
- **Scheduling** — manual Meet URL + time, or Google Calendar sync with per-event bot toggle
- **Billing** — Free (10 min/month) and Pro (~300 min/month) plans via Stripe Checkout
- **Dashboard** — upcoming/recent meetings, usage meter, meeting detail with notes & transcript tabs
- **Recordings** — in-app recording playback and transcript viewer (S3-backed)
- **UI** — cinematic dark-cream landing page, shimmer skeleton loading states on main routes

## Monorepo layout

| Path                    | Description                                                   | Dev port |
| ----------------------- | ------------------------------------------------------------- | -------- |
| `apps/web`              | Next.js 15 frontend (App Router, NextAuth, TanStack Query)    | `3000`   |
| `apps/server`           | NestJS REST API (auth, meetings, billing, calendar, webhooks) | `3001`   |
| `apps/agent`            | Mastra agents & meeting-processing workflow (Studio)          | `4111`   |
| `packages/db`           | Prisma schema & migrations (PostgreSQL)                       |
| `packages/ui`           | Shared shadcn-derived component library & global theme        |
| `packages/shared-types` | Shared enums, types, and Zod schemas                          |

## Prerequisites

- **Node.js** ≥ 20.17 (server) / ≥ 18 (root)
- **pnpm** 10 (`corepack enable && corepack prepare pnpm@10.0.0 --activate`)
- **PostgreSQL** running locally (or a remote `DATABASE_URL`)
- Accounts/keys for: **Google OAuth**, **Recall.ai**, **Stripe**, and an **OpenAI** (or Google AI) key for Mastra

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy each app’s example env file and fill in values:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/agent/.env.example apps/agent/.env
```

Create `apps/web/.env.local` with at least:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=generate_with_openssl_rand_hex_32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=          # same OAuth app as server
GOOGLE_CLIENT_SECRET=
```

See `apps/server/.env.example` for the full list (database, SMTP, Stripe, Recall, Mastra URL, calendar encryption, S3).

### 3. Database

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Run development servers

From the repo root:

```bash
pnpm dev
```

This starts all apps via Turbo. Typical local URLs:

| Service       | URL                        |
| ------------- | -------------------------- |
| Web           | http://localhost:3000      |
| API + Swagger | http://localhost:3001/docs |
| Mastra Studio | http://localhost:4111      |

To run a single app:

```bash
pnpm --filter web dev
pnpm --filter server dev
pnpm --filter agent dev
```

## Scripts

| Command            | Description                   |
| ------------------ | ----------------------------- |
| `pnpm dev`         | Start all apps in dev mode    |
| `pnpm build`       | Build all apps and packages   |
| `pnpm lint`        | ESLint across the monorepo    |
| `pnpm typecheck`   | TypeScript check              |
| `pnpm test`        | Run tests (Turbo)             |
| `pnpm db:generate` | Generate Prisma client        |
| `pnpm db:migrate`  | Run Prisma migrations (dev)   |
| `pnpm db:deploy`   | Apply migrations (production) |
| `pnpm format:fix`  | Prettier write                |

## Testing

Web app tests use Jest and React Testing Library:

```bash
pnpm --filter web test
pnpm --filter web test -- skeletons.test.tsx   # skeleton smoke tests
```

Server tests:

```bash
pnpm --filter server test
```

## Architecture (high level)

```
apps/web  ──►  apps/server  ──►  PostgreSQL (Prisma)
                    │
                    ├── Recall.ai (Meet bot + webhooks)
                    ├── Stripe (checkout + webhooks)
                    ├── Google Calendar OAuth
                    └── apps/agent (Mastra meeting-processing workflow)
```

Meeting lifecycle: **Scheduled → Bot joining → In progress → Processing → Completed** (or Failed/Cancelled).

## Design docs

- Product spec: `docs/superpowers/specs/2026-05-29-ai-meeting-saas-design.md`
- Skeleton screens: `docs/superpowers/specs/2026-05-30-skeleton-screens-design.md`

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, `@repo/ui`, TanStack Query, NextAuth
- **Backend:** NestJS 11, Prisma, JWT auth, Swagger at `/docs`
- **AI:** Mastra (`apps/agent`), OpenAI / Google AI providers
- **Integrations:** Recall.ai, Stripe, Google OAuth & Calendar, AWS S3 (recordings)
- **Tooling:** pnpm workspaces, Turbo, Husky, commitlint, Prettier, ESLint
