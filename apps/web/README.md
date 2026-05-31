# Meetra Web (`apps/web`)

Next.js 15 frontend for Meetra — landing page, auth, dashboard, calendar, meeting detail, billing, and chat.

## Development

```bash
pnpm dev          # from repo root (port 3000)
# or
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

The NestJS API must be running at `NEXT_PUBLIC_API_URL` for authenticated routes.

## Key directories

| Path          | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| `app/`        | App Router routes (landing, auth, dashboard, meetings, billing) |
| `components/` | UI components (meetings, calendar, landing, skeletons)          |
| `services/`   | HTTP layer via `ApiClient`                                      |
| `queries/`    | TanStack Query hooks                                            |
| `config/`     | Runtime env (`envConfig`)                                       |

## UI notes

- **Theme:** fixed dark cinematic palette (cream on black) via `@repo/ui` globals
- **Landing:** framer-motion cinematic page at `/`
- **Loading:** page-specific shimmer skeletons on dashboard, calendar, meeting detail, and billing
  (`components/skeletons/`)

## Tests

```bash
pnpm test
pnpm test -- skeletons.test.tsx
```
