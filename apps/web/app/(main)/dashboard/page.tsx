'use client';

import { DataLoader } from '@/components/general/DataLoader';
import EmptyMessage from '@/components/general/EmptyMessage';
import MeetingCard from '@/components/meetings/MeetingCard';
import UsageBar from '@/components/meetings/UsageBar';
import { useCancelMeeting, useMeetings } from '@/queries/meetings';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Button } from '@repo/ui/components/button';
import Link from 'next/link';

const UPCOMING_STATUSES = new Set<MeetingStatusEnum>([
  MeetingStatusEnum.SCHEDULED,
  MeetingStatusEnum.BOT_JOINING,
  MeetingStatusEnum.IN_PROGRESS,
]);

const RECENT_STATUSES = new Set<MeetingStatusEnum>([
  MeetingStatusEnum.COMPLETED,
  MeetingStatusEnum.FAILED,
  MeetingStatusEnum.PROCESSING,
  MeetingStatusEnum.CANCELLED,
]);

const DashboardPage = () => {
  const { data, isLoading } = useMeetings({ limit: 50 });
  const { mutate: cancelMeeting, isPending: isCancelling, variables: cancellingId } = useCancelMeeting();

  if (isLoading) {
    return <DataLoader message='Loading dashboard…' />;
  }

  const meetings = data?.meetings ?? [];
  const upcoming = meetings.filter((m) => UPCOMING_STATUSES.has(m.status as MeetingStatusEnum));
  const recent = meetings.filter((m) => RECENT_STATUSES.has(m.status as MeetingStatusEnum));

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
          <p className='text-muted-foreground text-sm'>Schedule meetings and review AI-generated notes.</p>
        </div>
        <Button asChild>
          <Link href='/meetings/new'>Schedule meeting</Link>
        </Button>
      </div>

      <UsageBar />

      <section className='space-y-4'>
        <h2 className='text-lg font-medium'>Upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyMessage message='No upcoming meetings. Schedule one to get started.' />
        ) : (
          <div className='grid gap-4'>
            {upcoming.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onCancel={cancelMeeting}
                isCancelling={isCancelling && cancellingId === meeting.id}
              />
            ))}
          </div>
        )}
      </section>

      <section className='space-y-4'>
        <h2 className='text-lg font-medium'>Recent</h2>
        {recent.length === 0 ? (
          <EmptyMessage message='Completed meetings will appear here.' />
        ) : (
          <div className='grid gap-4'>
            {recent.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </section>

      <div className='flex flex-wrap gap-3'>
        <Button variant='outline' asChild>
          <Link href='/calendar'>Google Calendar</Link>
        </Button>
        <Button variant='outline' asChild>
          <Link href='/settings/billing'>Billing & usage</Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
