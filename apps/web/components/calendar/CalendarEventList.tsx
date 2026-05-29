'use client';

import LoadingButton from '@/components/general/LoadingButton';
import EmptyMessage from '@/components/general/EmptyMessage';
import { DataLoader } from '@/components/general/DataLoader';
import { useCalendarEvents, useEnableCalendarBot } from '@/queries/calendar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Switch } from '@repo/ui/components/switch';
import { ExternalLink } from 'lucide-react';

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
    return <DataLoader message='Loading calendar events…' />;
  }

  if (isError) {
    const message = error?.message ?? '';
    const notConnected = message.toLowerCase().includes('not connected') || message.includes('404');

    if (notConnected) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Connect Google Calendar</CardTitle>
            <CardDescription>
              Sync upcoming events with Google Meet links and schedule the AI bot with one click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingButton onClick={onConnect} isLoading={isConnecting}>
              Connect Google Calendar
            </LoadingButton>
          </CardContent>
        </Card>
      );
    }

    return <EmptyMessage message={message || 'Failed to load calendar events'} />;
  }

  if (!data?.events.length) {
    return <EmptyMessage message='No upcoming Google Meet events found on your calendar.' />;
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
          <Card key={event.id}>
            <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
              <div className='min-w-0 space-y-1'>
                <CardTitle className='text-base'>{event.title}</CardTitle>
                <CardDescription>{formatDateTime(event.scheduledAt)}</CardDescription>
              </div>
              {event.hasBot ? (
                <Badge variant='secondary'>Bot scheduled</Badge>
              ) : (
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground text-xs'>Send bot</span>
                  <Switch
                    checked={false}
                    disabled={isPending && enablingEventId === event.id}
                    onCheckedChange={() => enableBot(event.id)}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Button size='sm' variant='ghost' asChild>
                <a href={event.meetUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='mr-1 h-3.5 w-3.5' />
                  Open Meet link
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CalendarEventList;
