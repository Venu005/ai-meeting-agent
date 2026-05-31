# Skeleton Screens Implementation Plan

> **For agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace centered `DataLoader` spinners on dashboard, calendar, meeting detail, and billing with page-specific
shimmer skeletons that mirror each screen’s final layout.

**Architecture:** Upgrade `@repo/ui` `Skeleton` with cream shimmer on `#212121` base. Add shared primitives and page
skeletons under `apps/web/components/skeletons/`. Wire each route to early-return its skeleton on `isLoading`; billing
and dashboard must not mount `<UsageBar />` while their primary loading branch is active.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, `@repo/ui` Skeleton, TanStack Query

**Spec:** `docs/superpowers/specs/2026-05-30-skeleton-screens-design.md`

---

## Task 1: Shimmer foundation in `@repo/ui`

**Files:**

- Modify: `packages/ui/src/styles/globals.css`
- Modify: `packages/ui/src/components/skeleton.tsx`

### Step 1: Add shimmer keyframes and utility class

In `globals.css`, append:

```css
@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background-color: #212121;
}

.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(222, 219, 200, 0.08), transparent);
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer::after {
    animation: none;
  }

  .skeleton-shimmer {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}
```

### Step 2: Update Skeleton component

Replace `packages/ui/src/components/skeleton.tsx`:

```tsx
import { cn } from '@repo/ui/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='skeleton' className={cn('skeleton-shimmer rounded-md', className)} {...props} />;
}

export { Skeleton };
```

### Step 3: Verify UI package builds

Run: `pnpm --filter @repo/ui exec tsc --noEmit`  
Expected: no errors

### Step 4: Commit

```bash
git add packages/ui/src/components/skeleton.tsx packages/ui/src/styles/globals.css
git commit -m "feat(ui): add cream shimmer skeleton animation"
```

---

## Task 2: Shared skeleton primitives

**Files:**

- Create: `apps/web/components/skeletons/PageHeaderSkeleton.tsx`
- Create: `apps/web/components/skeletons/MeetingCardSkeleton.tsx`
- Create: `apps/web/components/skeletons/UsageBarSkeleton.tsx`
- Create: `apps/web/components/skeletons/PlanCardSkeleton.tsx`

### Step 1: PageHeaderSkeleton

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

type PageHeaderSkeletonProps = {
  showAction?: boolean;
};

const PageHeaderSkeleton = ({ showAction = false }: PageHeaderSkeletonProps) => (
  <div className='flex flex-wrap items-start justify-between gap-4'>
    <div className='space-y-2'>
      <Skeleton className='h-8 w-56 max-w-full' />
      <Skeleton className='h-4 w-80 max-w-full' />
    </div>
    {showAction && <Skeleton className='h-10 w-40 rounded-md' />}
  </div>
);

export default PageHeaderSkeleton;
```

### Step 2: MeetingCardSkeleton

Mirror `MeetingCard` bordered card layout:

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

const MeetingCardSkeleton = () => (
  <div className='bg-card space-y-4 rounded-xl border p-5'>
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <Skeleton className='h-5 w-2/3 max-w-xs' />
      <Skeleton className='h-6 w-20 rounded-full' />
    </div>
    <div className='flex flex-wrap gap-4'>
      <Skeleton className='h-4 w-32' />
      <Skeleton className='h-4 w-24' />
    </div>
    <div className='flex gap-2'>
      <Skeleton className='h-9 w-24 rounded-md' />
      <Skeleton className='h-9 w-20 rounded-md' />
    </div>
  </div>
);

export default MeetingCardSkeleton;
```

### Step 3: UsageBarSkeleton

Mirror `UsageBar` card (`bg-card rounded-xl border p-5 space-y-4`):

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

const UsageBarSkeleton = () => (
  <div className='bg-card space-y-4 rounded-xl border p-5'>
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex items-start gap-3'>
        <Skeleton className='h-10 w-10 shrink-0 rounded-lg' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <Skeleton className='h-9 w-20 rounded-md' />
    </div>
    <Skeleton className='h-2.5 w-full rounded-full' />
  </div>
);

export default UsageBarSkeleton;
```

### Step 4: PlanCardSkeleton

Mirror billing `PlanCard` (`bg-card rounded-xl border p-6 md:p-8`):

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

const PlanCardSkeleton = () => (
  <div className='bg-card flex h-full flex-col rounded-xl border p-6 md:p-8'>
    <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-16' />
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
        <Skeleton className='h-4 w-56' />
      </div>
      <Skeleton className='h-6 w-14 rounded-full' />
    </div>
    <ul className='mb-6 space-y-2'>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className='flex items-center gap-2'>
          <Skeleton className='h-4 w-4 shrink-0 rounded-sm' />
          <Skeleton className='h-4 w-48' />
        </li>
      ))}
    </ul>
    <Skeleton className='mt-auto h-10 w-full rounded-md' />
  </div>
);

export default PlanCardSkeleton;
```

### Step 5: Commit

```bash
git add apps/web/components/skeletons/
git commit -m "feat(web): add shared skeleton primitives"
```

---

## Task 3: Page-level skeleton components

**Files:**

- Create: `apps/web/components/skeletons/DashboardSkeleton.tsx`
- Create: `apps/web/components/skeletons/CalendarSkeleton.tsx`
- Create: `apps/web/components/skeletons/MeetingDetailSkeleton.tsx`
- Create: `apps/web/components/skeletons/BillingSkeleton.tsx`

### Step 1: DashboardSkeleton

```tsx
import MeetingCardSkeleton from '@/components/skeletons/MeetingCardSkeleton';
import PageHeaderSkeleton from '@/components/skeletons/PageHeaderSkeleton';
import UsageBarSkeleton from '@/components/skeletons/UsageBarSkeleton';
import { Skeleton } from '@repo/ui/components/skeleton';

const DashboardSkeleton = () => (
  <div className='space-y-8'>
    <PageHeaderSkeleton showAction />

    <div className='grid gap-4 sm:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='bg-card space-y-3 rounded-xl border p-5'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-9 w-12' />
        </div>
      ))}
    </div>

    <UsageBarSkeleton />

    <section className='space-y-4'>
      <Skeleton className='h-6 w-44' />
      <div className='grid gap-4'>
        <MeetingCardSkeleton />
        <MeetingCardSkeleton />
      </div>
    </section>

    <section className='space-y-4'>
      <Skeleton className='h-6 w-40' />
      <div className='grid gap-4'>
        <MeetingCardSkeleton />
        <MeetingCardSkeleton />
      </div>
    </section>
  </div>
);

export default DashboardSkeleton;
```

### Step 2: CalendarSkeleton

Read `CalendarEventList.tsx` card markup first; skeleton should match header (title + badge), date line, footer
(switch + link). Example structure:

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

const CalendarEventSkeleton = () => (
  <div className='bg-card space-y-4 rounded-xl border p-5'>
    <div className='flex items-start justify-between gap-3'>
      <Skeleton className='h-5 w-3/5 max-w-sm' />
      <Skeleton className='h-6 w-16 rounded-full' />
    </div>
    <Skeleton className='h-4 w-2/5 max-w-xs' />
    <div className='flex items-center justify-between gap-3'>
      <Skeleton className='h-6 w-11 rounded-full' />
      <Skeleton className='h-4 w-28' />
    </div>
  </div>
);

const CalendarSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-4 w-[35%]' />
    <div className='grid gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <CalendarEventSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default CalendarSkeleton;
```

### Step 3: MeetingDetailSkeleton

```tsx
import { Skeleton } from '@repo/ui/components/skeleton';

const MeetingDetailSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-9 w-[120px] rounded-md' />

    <div className='bg-card relative space-y-3 rounded-xl border p-6'>
      <Skeleton className='absolute right-6 top-6 h-6 w-24 rounded-full' />
      <Skeleton className='h-8 w-[70%] max-w-md' />
      <Skeleton className='h-4 w-48' />
    </div>

    <div className='flex gap-2'>
      <Skeleton className='h-10 w-28 rounded-md' />
      <Skeleton className='h-10 w-28 rounded-md' />
    </div>

    <div className='bg-card space-y-3 rounded-xl border p-6'>
      {['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-1/2'].map((width, i) => (
        <Skeleton key={i} className={`h-4 ${width}`} />
      ))}
    </div>
  </div>
);

export default MeetingDetailSkeleton;
```

### Step 4: BillingSkeleton

```tsx
import PlanCardSkeleton from '@/components/skeletons/PlanCardSkeleton';
import UsageBarSkeleton from '@/components/skeletons/UsageBarSkeleton';

const BillingSkeleton = () => (
  <div className='space-y-8'>
    <p className='text-muted-foreground text-sm'>Loading billing details…</p>
    <UsageBarSkeleton />
    <div className='grid gap-6 md:grid-cols-2'>
      <PlanCardSkeleton />
      <PlanCardSkeleton />
    </div>
  </div>
);

export default BillingSkeleton;
```

### Step 5: Commit

```bash
git add apps/web/components/skeletons/DashboardSkeleton.tsx \
        apps/web/components/skeletons/CalendarSkeleton.tsx \
        apps/web/components/skeletons/MeetingDetailSkeleton.tsx \
        apps/web/components/skeletons/BillingSkeleton.tsx
git commit -m "feat(web): add page-level skeleton layouts"
```

---

## Task 4: Wire skeletons into routes

**Files:**

- Modify: `apps/web/app/(main)/dashboard/page.tsx`
- Modify: `apps/web/components/calendar/CalendarEventList.tsx`
- Modify: `apps/web/components/meetings/MeetingDetail.tsx`
- Modify: `apps/web/app/(main)/settings/billing/page.tsx`
- Modify: `apps/web/components/meetings/UsageBar.tsx`

### Step 1: Dashboard

In `dashboard/page.tsx`:

- Replace `DataLoader` import with `DashboardSkeleton`
- Change loading branch: `return <DashboardSkeleton />;`
- Remove unused `DataLoader` import

The loaded branch still renders `<UsageBar />` as today. While `isLoading`, do not mount `UsageBar`.

### Step 2: CalendarEventList

In `CalendarEventList.tsx`:

- Replace `DataLoader` with `CalendarSkeleton`
- Loading branch: `return <CalendarSkeleton />;`
- Keep `isError` branch unchanged

### Step 3: MeetingDetail

In `MeetingDetail.tsx`:

- Replace `DataLoader` with `MeetingDetailSkeleton`
- Loading branch: `return <MeetingDetailSkeleton />;`
- Keep `isError` branch unchanged

### Step 4: Billing page

In `billing/page.tsx`:

- Destructure `isLoading` from `useUsage()`
- Keep `<PageHeader />` always visible
- Wrap body in conditional:

```tsx
const { data: usage, isLoading, refetch } = useUsage();

// ...

<PageHeader title='Billing' description='Manage your plan and meeting minute allowance.' />

{isLoading ? (
  <BillingSkeleton />
) : (
  <>
    <UsageBar />
    <div className='grid gap-6 md:grid-cols-2'>
      {/* existing PlanCard blocks */}
    </div>
    {isPro && usage?.periodEnd && ( /* existing period card */ )}
  </>
)}
```

Import `BillingSkeleton`. Do not render `<UsageBar />` when `isLoading`.

### Step 5: UsageBar inline skeleton

In `UsageBar.tsx`:

- Replace `<Skeleton className='h-28 w-full rounded-xl' />` with `<UsageBarSkeleton />`
- Remove unused `Skeleton` import if no longer needed

### Step 6: Lint

Run: `pnpm --filter web lint`  
Expected: no new errors

### Step 7: Commit

```bash
git add apps/web/app/(main)/dashboard/page.tsx \
        apps/web/components/calendar/CalendarEventList.tsx \
        apps/web/components/meetings/MeetingDetail.tsx \
        apps/web/app/(main)/settings/billing/page.tsx \
        apps/web/components/meetings/UsageBar.tsx
git commit -m "feat(web): replace DataLoader with page skeletons on main routes"
```

---

## Task 5: Optional smoke tests

**Files:**

- Create: `apps/web/__tests__/skeletons.test.tsx`

Low priority per spec. One combined smoke test file:

```tsx
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import CalendarSkeleton from '@/components/skeletons/CalendarSkeleton';
import MeetingDetailSkeleton from '@/components/skeletons/MeetingDetailSkeleton';
import BillingSkeleton from '@/components/skeletons/BillingSkeleton';

describe('Skeleton components', () => {
  it.each([
    ['DashboardSkeleton', DashboardSkeleton],
    ['CalendarSkeleton', CalendarSkeleton],
    ['MeetingDetailSkeleton', MeetingDetailSkeleton],
    ['BillingSkeleton', BillingSkeleton],
  ])('%s renders without throwing', (_name, Component) => {
    expect(() => render(<Component />)).not.toThrow();
  });
});
```

Run: `pnpm --filter web test -- skeletons.test.tsx`  
Expected: PASS

Skip this task if time-constrained; manual verification is sufficient per spec.

---

## Task 6: Manual verification

### Step 1: Start dev server

Run: `pnpm --filter web dev` (if not already running)

### Step 2: Slow-network check

DevTools → Network → Slow 3G, then visit:

| Route               | Expect                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| `/dashboard`        | Full dashboard skeleton; sidebar visible; no spinner; no loading copy  |
| `/calendar`         | Page header + calendar skeleton list                                   |
| `/meetings/[id]`    | Meeting detail skeleton (back link, header card, tabs, content lines)  |
| `/settings/billing` | Real page header + “Loading billing details…” + usage + plan skeletons |

### Step 3: Reduced motion

Enable `prefers-reduced-motion: reduce` in DevTools rendering settings; reload any skeleton route. Shimmer sweep should
stop; pulse fallback visible.

### Step 4: Error paths unchanged

Force API failure (offline or bad token) on calendar and meeting detail; confirm existing error UI still shows (not
skeleton).

---

## Integration checklist

| File                                                 | Change                              |
| ---------------------------------------------------- | ----------------------------------- |
| `packages/ui/src/components/skeleton.tsx`            | Shimmer base                        |
| `packages/ui/src/styles/globals.css`                 | Keyframes + `.skeleton-shimmer`     |
| `apps/web/components/skeletons/*`                    | 8 new files (4 primitives + 4 page) |
| `apps/web/app/(main)/dashboard/page.tsx`             | `DashboardSkeleton`                 |
| `apps/web/components/calendar/CalendarEventList.tsx` | `CalendarSkeleton`                  |
| `apps/web/components/meetings/MeetingDetail.tsx`     | `MeetingDetailSkeleton`             |
| `apps/web/app/(main)/settings/billing/page.tsx`      | Conditional `BillingSkeleton`       |
| `apps/web/components/meetings/UsageBar.tsx`          | `UsageBarSkeleton`                  |

**Out of scope:** Chat `DataLoader`, `GlobalLoading`, landing/login, recording player.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-30-skeleton-screens.md`.

**Two execution options:**

1. **Subagent-driven (this session)** — Dispatch a fresh subagent per task, review between tasks
2. **Parallel session (separate)** — Open a new session with executing-plans, batch execution with checkpoints

Which approach?
