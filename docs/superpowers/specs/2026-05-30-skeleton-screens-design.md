# Skeleton Screens — Design Spec

**Date:** 2026-05-30  
**Status:** Approved (self-reviewed)  
**Scope:** Main app loading states (dashboard, calendar, meeting detail, billing)

---

## Summary

Replace centered `DataLoader` spinners on the four main authenticated routes with page-specific skeleton layouts that
mirror each screen’s final UI. Skeletons use a warm cream shimmer animation aligned with Meetra’s cinematic dark theme.
Dashboard, calendar, and meeting detail show skeleton-only loading; billing shows skeleton plus a short loading label.

---

## Decisions

| Topic        | Decision                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Scope        | Dashboard, calendar event list, meeting detail, billing                                         |
| Animation    | Shimmer sweep (cream highlight on `#212121` base)                                               |
| Loading copy | Skeleton only on dashboard/calendar/meeting detail; billing includes “Loading billing details…” |
| Architecture | Page-specific skeleton components + shared primitives                                           |
| Out of scope | Chat, auth `GlobalLoading`, landing/login, onboarding, recording player                         |

---

## Foundation

### Shimmer skeleton (`@repo/ui`)

Upgrade `packages/ui/src/components/skeleton.tsx`:

- Base background: `#212121` (matches `--secondary` / `--muted`); replaces current `bg-accent` cream pulse blocks
- Shimmer overlay: `linear-gradient(90deg, transparent, rgba(222, 219, 200, 0.08), transparent)` animated left → right
- Animation: `@keyframes skeleton-shimmer` in `packages/ui/src/styles/globals.css`, applied via utility class
  `.skeleton-shimmer` on the Skeleton component
- Duration: 1.5s, infinite, `ease-in-out`
- Accessibility: `@media (prefers-reduced-motion: reduce)` disables shimmer sweep and falls back to pulse only

Existing `Skeleton` public API unchanged (`className`, standard div props). All consumers (including `UsageBar`) inherit
shimmer automatically once the base component is updated.

### Shared primitives

Location: `apps/web/components/skeletons/`

| Component             | Purpose                                                                        |
| --------------------- | ------------------------------------------------------------------------------ |
| `PageHeaderSkeleton`  | Title bar, description line, optional action button placeholder                |
| `MeetingCardSkeleton` | Bordered card: title, meta row, footer action row                              |
| `UsageBarSkeleton`    | Full-width usage card with icon block, label lines, progress bar, optional CTA |
| `PlanCardSkeleton`    | Billing plan card: title + badge row, description, 3 feature lines, CTA block  |

Use `@repo/ui` `Skeleton` directly for one-off blocks; extract a helper only if duplication appears across two or more
skeleton files. No barrel export file (per app conventions).

Page-level components compose these primitives.

---

## Page skeletons

### `DashboardSkeleton`

File: `apps/web/components/skeletons/DashboardSkeleton.tsx`

Layout (`space-y-8`, matches `dashboard/page.tsx`):

1. `PageHeaderSkeleton` with action button (generic placeholders — no user first name while loading)
2. Stats grid: 3 cards (`grid gap-4 sm:grid-cols-3`), each with small label + large number block
3. `UsageBarSkeleton`
4. Section “Upcoming meetings”: title skeleton + 2× `MeetingCardSkeleton`
5. Section “Recent meetings”: title skeleton + 2× `MeetingCardSkeleton`

Integration: `dashboard/page.tsx` early-returns `<DashboardSkeleton />` when `useMeetings().isLoading`. Do **not** mount
`<UsageBar />` in this branch (skeleton already includes usage placeholder).

After meetings load, render `<UsageBar />` normally. If usage data is still fetching, `UsageBar` shows
`UsageBarSkeleton` briefly — acceptable edge case, no combined loading gate required.

---

### `CalendarSkeleton`

File: `apps/web/components/skeletons/CalendarSkeleton.tsx`

Layout:

1. Connected-email line skeleton (~35% width)
2. 4 event card skeletons matching calendar `Card` structure:
   - Header row: title (~60%) + badge pill
   - Date/time line (~45%)
   - Footer row: switch pill + link text

Integration: `CalendarEventList.tsx` returns `<CalendarSkeleton />` when `useCalendarEvents().isLoading`.

The calendar page `PageHeader` remains visible; only the list area skeletonizes.

---

### `MeetingDetailSkeleton`

File: `apps/web/components/skeletons/MeetingDetailSkeleton.tsx`

Layout (`space-y-6`):

1. Back-link pill (~120px wide)
2. Header card: title (~70%), subtitle line, status badge (top-right)
3. Tab bar: two tab pills
4. Content card: 6–8 text lines of varying widths

Integration: `MeetingDetail.tsx` returns `<MeetingDetailSkeleton />` when `useMeeting().isLoading`.

Tab skeleton is shown for all loading states (status unknown until fetch completes). This matches the most common
completed-meeting path.

---

### `BillingSkeleton`

File: `apps/web/components/skeletons/BillingSkeleton.tsx`

Body-only fragment (no `PageHeader`). Layout (`space-y-8`):

1. Label: `Loading billing details…` (`text-muted-foreground text-sm`)
2. `UsageBarSkeleton`
3. Plan cards grid (`grid gap-6 md:grid-cols-2`): 2× `PlanCardSkeleton`

Integration in `billing/page.tsx`:

```tsx
<PageHeader title='Billing' description='…' />;
{
  isLoading ? (
    <BillingSkeleton />
  ) : (
    <>
      <UsageBar />
      {/* plan cards */}
    </>
  );
}
```

Do **not** mount `<UsageBar />` while `useUsage().isLoading` — avoids duplicate skeletons and duplicate usage queries
rendering competing placeholders.

---

## Integration map

| File                                                 | Change                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `packages/ui/src/components/skeleton.tsx`            | Shimmer base + animation class                                              |
| `packages/ui/src/styles/globals.css`                 | `@keyframes skeleton-shimmer`, reduced-motion fallback                      |
| `apps/web/components/skeletons/*`                    | New skeleton components (5 page/primitive files)                            |
| `apps/web/app/(main)/dashboard/page.tsx`             | `DataLoader` → `DashboardSkeleton`; skip `UsageBar` while meetings loading  |
| `apps/web/components/calendar/CalendarEventList.tsx` | `DataLoader` → `CalendarSkeleton`                                           |
| `apps/web/components/meetings/MeetingDetail.tsx`     | `DataLoader` → `MeetingDetailSkeleton`                                      |
| `apps/web/app/(main)/settings/billing/page.tsx`      | Conditional `BillingSkeleton` vs `UsageBar` + plan cards                    |
| `apps/web/components/meetings/UsageBar.tsx`          | Replace inline `<Skeleton className='h-28…' />` with `<UsageBarSkeleton />` |

`DataLoader` remains for chat and other out-of-scope routes.

---

## Error handling

Skeletons are loading-state only. Existing error and empty states (`EmptyMessage`, alerts, calendar reconnect card) are
unchanged. No skeleton on error paths — preserve current `isError` branches in `CalendarEventList` and `MeetingDetail`.

---

## Testing

**Manual**

1. DevTools → Network → Slow 3G
2. Visit `/dashboard`, `/calendar`, `/meetings/[id]`, `/settings/billing`
3. Confirm skeleton layout matches final UI; sidebar stays visible via `MainShell`
4. Billing shows “Loading billing details…”; other three routes show no loading copy
5. `prefers-reduced-motion: reduce` → pulse fallback, no shimmer sweep

**Automated (optional, low priority)**

- RTL smoke test: each skeleton component renders without throwing

---

## Non-goals

- Minimum display time / anti-flash delay
- Skeleton for `MeetingRecordingPlayer` processing state
- Replacing `GlobalLoading` auth overlay
- Chat page skeletons
- Coordinated multi-query loading gates (e.g. dashboard waiting for both meetings + usage)

---

## Self-review (2026-05-30)

| Check                   | Result | Action taken                                                                                                  |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Placeholders / TBD      | Pass   | None found                                                                                                    |
| Internal consistency    | Fixed  | Clarified billing vs `UsageBar` — never mount both skeleton paths simultaneously                              |
| Scope                   | Pass   | Single focused implementation plan (~8 files touched)                                                         |
| Ambiguity               | Fixed  | Removed optional `SkeletonBlock`; added `PlanCardSkeleton`; specified shimmer replaces `bg-accent`            |
| Codebase alignment      | Fixed  | Documented dashboard secondary `UsageBar` fetch edge case as acceptable                                       |
| Duplicate skeleton risk | Fixed  | Dashboard and billing early-return paths must not render `<UsageBar />` alongside skeleton usage placeholders |

**Verdict:** Spec is ready for implementation planning.
