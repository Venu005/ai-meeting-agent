'use client';

import PageHeader from '@/components/layout/PageHeader';
import ScheduleForm from '@/components/meetings/ScheduleForm';
import { Bot } from 'lucide-react';

const NewMeetingPage = () => {
  return (
    <div className='mx-auto max-w-xl space-y-8'>
      <PageHeader
        title='Schedule a meeting'
        description='Add a Google Meet link and time. Our AI bot will join and generate notes when the call ends.'
      />

      <div className='bg-card rounded-xl border p-6 md:p-8'>
        <div className='mb-6 flex items-center gap-3'>
          <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
            <Bot className='h-5 w-5' />
          </div>
          <div>
            <h2 className='font-semibold'>Meeting details</h2>
            <p className='text-muted-foreground text-sm'>All fields are required unless marked optional.</p>
          </div>
        </div>
        <ScheduleForm />
      </div>
    </div>
  );
};

export default NewMeetingPage;
