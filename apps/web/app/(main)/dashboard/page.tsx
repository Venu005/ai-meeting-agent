'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import PageHeader from '@/components/layout/PageHeader';
import MeetingCard from '@/components/meetings/MeetingCard';
import UsageBar from '@/components/meetings/UsageBar';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCancelMeeting, useMeetings } from '@/queries/meetings';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Button } from '@repo/ui/components/button';
import { Calendar, Clock, Plus, Video } from 'lucide-react';
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
  const user = useAuth();
  const { data, isLoading } = useMeetings({ limit: 50 });
  const { mutate: cancelMeeting, isPending: isCancelling, variables: cancellingId } = useCancelMeeting();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const meetings = data?.meetings ?? [];
  const upcoming = meetings.filter((m) => UPCOMING_STATUSES.has(m.status as MeetingStatusEnum));
  const recent = meetings.filter((m) => RECENT_STATUSES.has(m.status as MeetingStatusEnum));
  const completedCount = meetings.filter((m) => m.status === MeetingStatusEnum.COMPLETED).length;

  const firstName = user.name?.split(' ')[0] ?? 'there';

  return (
    <div className='space-y-8'>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description='Schedule meetings and review AI-generated notes from your calls.'
        action={
          <Button asChild className='gap-2'>
            <Link href='/meetings/new'>
              <Plus className='h-4 w-4' />
              Schedule meeting
            </Link>
          </Button>
        }
      />

      {/* Quick stats */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <div className='bg-card rounded-xl border p-5'>
          <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm'>
            <Video className='h-4 w-4' />
            Upcoming
          </div>
          <p className='text-3xl font-bold tracking-tight'>{upcoming.length}</p>
        </div>
        <div className='bg-card rounded-xl border p-5'>
          <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm'>
            <Clock className='h-4 w-4' />
            Completed
          </div>
          <p className='text-3xl font-bold tracking-tight'>{completedCount}</p>
        </div>
        <div className='bg-card rounded-xl border p-5'>
          <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm'>
            <Calendar className='h-4 w-4' />
            Total meetings
          </div>
          <p className='text-3xl font-bold tracking-tight'>{meetings.length}</p>
        </div>
      </div>

      <UsageBar />

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Upcoming meetings</h2>
          {upcoming.length > 0 && (
            <Button variant='ghost' size='sm' asChild>
              <Link href='/meetings/new'>Add new</Link>
            </Button>
          )}
        </div>
        {upcoming.length === 0 ? (
          <EmptyMessage
            message='No upcoming meetings'
            description='Schedule a meeting and our AI bot will join your Google Meet call.'
            icon={
              <div className='bg-primary/10 text-primary mb-2 flex h-12 w-12 items-center justify-center rounded-xl'>
                <Video className='h-6 w-6' />
              </div>
            }
            cta={
              <Button asChild>
                <Link href='/meetings/new'>Schedule your first meeting</Link>
              </Button>
            }
          />
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
        <h2 className='text-lg font-semibold'>Recent meetings</h2>
        {recent.length === 0 ? (
          <EmptyMessage
            message='No recent meetings'
            description='Completed meetings and their AI-generated notes will appear here.'
          />
        ) : (
          <div className='grid gap-4'>
            {recent.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
