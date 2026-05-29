'use client';

import CalendarEventList from '@/components/calendar/CalendarEventList';
import { useCalendarConnect } from '@/queries/calendar';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

const CalendarPageContent = () => {
  const searchParams = useSearchParams();
  const { mutate: connect, isPending } = useCalendarConnect();

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      toast.success('Google Calendar connected');
    }
    if (searchParams.get('error') === 'oauth_failed') {
      toast.error('Failed to connect Google Calendar');
    }
  }, [searchParams]);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Calendar</h1>
        <p className='text-muted-foreground text-sm'>
          Connect Google Calendar and enable the AI bot for upcoming Meet events.
        </p>
      </div>

      {searchParams.get('connected') === 'true' && (
        <Alert>
          <AlertDescription>Google Calendar connected successfully.</AlertDescription>
        </Alert>
      )}

      <CalendarEventList onConnect={() => connect()} isConnecting={isPending} />
    </div>
  );
};

const CalendarPage = () => (
  <Suspense fallback={null}>
    <CalendarPageContent />
  </Suspense>
);

export default CalendarPage;
