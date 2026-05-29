'use client';

import ScheduleForm from '@/components/meetings/ScheduleForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';

const NewMeetingPage = () => {
  return (
    <div className='mx-auto max-w-xl space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Schedule a meeting</h1>
        <p className='text-muted-foreground text-sm'>
          Add a Google Meet link and time. Our AI bot will join and generate notes when the call ends.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Meeting details</CardTitle>
          <CardDescription>All fields are required unless marked optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default NewMeetingPage;
