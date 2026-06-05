'use client';

import CalendarEventList from '@/components/calendar/CalendarEventList';
import PageHeader from '@/components/layout/PageHeader';
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
    <div className='space-y-10'>
      <PageHeader
        eyebrow='Integrations'
        title='Calendar'
        description='Your Google Calendar is connected at sign-in. Enable the AI bot for upcoming Meet events.'
      />

      {searchParams.get('connected') === 'true' && (
        <Alert className='border-primary/20 bg-primary/5'>
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
