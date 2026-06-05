'use client';

import LoadingButton from '@/components/general/LoadingButton';
import EmptyMessage from '@/components/general/EmptyMessage';
import AppPanel from '@/components/layout/AppPanel';
import CalendarSkeleton from '@/components/skeletons/CalendarSkeleton';
import { useCalendarEvents, useEnableCalendarBot } from '@/queries/calendar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Switch } from '@repo/ui/components/switch';
import { CalendarDays, ExternalLink } from 'lucide-react';

interface CalendarEventListProps {
  onConnect: () => void;
  isConnecting: boolean;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const CalendarEventList = ({ onConnect, isConnecting }: CalendarEventListProps) => {
  const { data, isLoading, isError, error } = useCalendarEvents();
  const { mutate: enableBot, isPending, variables: enablingEventId } = useEnableCalendarBot();

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  if (isError) {
    const message = error?.message ?? '';
    const notConnected = message.toLowerCase().includes('not connected') || message.includes('404');

    if (notConnected) {
      return (
        <AppPanel glow className='p-6 md:p-8'>
          <div className='space-y-4'>
            <div className='bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-xl'>
              <CalendarDays className='h-5 w-5' />
            </div>
            <div className='space-y-2'>
              <h2 className='text-lg font-semibold tracking-tight'>Reconnect Google Calendar</h2>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Calendar access was not granted or has expired. Reconnect to sync upcoming Google Meet events.
              </p>
            </div>
            <LoadingButton onClick={onConnect} isLoading={isConnecting}>
              Reconnect Google Calendar
            </LoadingButton>
          </div>
        </AppPanel>
      );
    }

    return <EmptyMessage message={message || 'Failed to load calendar events'} />;
  }

  if (!data?.events.length) {
    return (
      <div className='space-y-4'>
        {data?.googleEmail && (
          <p className='text-muted-foreground text-sm'>
            Connected as <span className='text-foreground font-medium'>{data.googleEmail}</span>
          </p>
        )}
        <EmptyMessage
          message='No upcoming Meet events'
          description='Make sure your calendar events include Google Meet video conferencing.'
          icon={
            <div className='bg-primary/10 text-primary mb-2 flex h-14 w-14 items-center justify-center rounded-2xl'>
              <CalendarDays className='h-7 w-7' />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {data.googleEmail && (
        <p className='text-muted-foreground text-sm'>
          Connected as <span className='text-foreground font-medium'>{data.googleEmail}</span>
        </p>
      )}
      <div className='grid gap-4'>
        {data.events.map((event) => (
          <AppPanel
            key={event.id}
            className='p-5 transition-all duration-200 hover:border-primary/25 hover:shadow-lg hover:shadow-black/20'
          >
            <div className='flex flex-row items-start justify-between gap-4'>
              <div className='min-w-0 space-y-1'>
                <h3 className='text-base font-semibold tracking-tight'>{event.title}</h3>
                <p className='text-muted-foreground text-sm'>{formatDateTime(event.scheduledAt)}</p>
              </div>
              {event.hasBot ? (
                <Badge variant='secondary'>Bot scheduled</Badge>
              ) : (
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-xs'>Send bot</span>
                  <Switch
                    checked={false}
                    disabled={isPending && enablingEventId?.eventId === event.id}
                    onCheckedChange={() => enableBot({ eventId: event.id, calendarId: event.calendarId })}
                  />
                </div>
              )}
            </div>
            <div className='mt-4 border-t border-white/10 pt-4'>
              <Button size='sm' variant='ghost' asChild>
                <a href={event.meetUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='mr-1 h-3.5 w-3.5' />
                  Open Meet link
                </a>
              </Button>
            </div>
          </AppPanel>
        ))}
      </div>
    </div>
  );
};

export default CalendarEventList;
