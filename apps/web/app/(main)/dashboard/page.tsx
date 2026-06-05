'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import AppPanel from '@/components/layout/AppPanel';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/layout/StatCard';
import MeetingCard from '@/components/meetings/MeetingCard';
import UsageBar from '@/components/meetings/UsageBar';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCancelMeeting, useMeetings } from '@/queries/meetings';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Button } from '@repo/ui/components/button';
import { Calendar, Clock, Plus, Sparkles, Video } from 'lucide-react';
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
    <div className='space-y-10'>
      <PageHeader
        eyebrow='Dashboard'
        title={`Welcome back, ${firstName}`}
        description='Schedule meetings and review AI-generated notes from your calls.'
        action={
          <Button asChild className='gap-2 shadow-lg shadow-black/20'>
            <Link href='/meetings/new'>
              <Plus className='h-4 w-4' />
              Schedule meeting
            </Link>
          </Button>
        }
      />

      {/* Bento hero + stats */}
      <div className='grid gap-4 lg:grid-cols-12'>
        <AppPanel glow className='relative overflow-hidden p-6 lg:col-span-5 lg:p-8'>
          <div className='from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent' />
          <div className='relative space-y-4'>
            <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium'>
              <Sparkles className='h-3.5 w-3.5' />
              AI meeting assistant
            </div>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              Meetra joins your Google Meet calls, captures the conversation, and delivers structured notes tailored to
              your role.
            </p>
            <Button variant='outline' size='sm' asChild className='gap-1.5'>
              <Link href='/calendar'>
                <Calendar className='h-3.5 w-3.5' />
                Sync calendar
              </Link>
            </Button>
          </div>
        </AppPanel>

        <div className='grid gap-4 sm:grid-cols-3 lg:col-span-7'>
          <StatCard label='Upcoming' value={upcoming.length} icon={Video} highlight={upcoming.length > 0} />
          <StatCard label='Completed' value={completedCount} icon={Clock} />
          <StatCard label='Total meetings' value={meetings.length} icon={Calendar} />
        </div>
      </div>

      <UsageBar />

      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='app-section-label mb-1'>Schedule</p>
            <h2 className='app-section-title'>Upcoming meetings</h2>
          </div>
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
              <div className='bg-primary/10 text-primary mb-2 flex h-14 w-14 items-center justify-center rounded-2xl'>
                <Video className='h-7 w-7' />
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
        <div>
          <p className='app-section-label mb-1'>History</p>
          <h2 className='app-section-title'>Recent meetings</h2>
        </div>
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
