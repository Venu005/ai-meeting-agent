'use client';

import AppPanel from '@/components/layout/AppPanel';
import PageHeader from '@/components/layout/PageHeader';
import ScheduleForm from '@/components/meetings/ScheduleForm';
import { Bot } from 'lucide-react';

const NewMeetingPage = () => {
  return (
    <div className='mx-auto max-w-xl space-y-10'>
      <PageHeader
        eyebrow='Schedule'
        title='Schedule a meeting'
        description='Add a Google Meet link and time. Our AI bot will join and generate notes when the call ends.'
      />

      <AppPanel glow className='p-6 md:p-8'>
        <div className='mb-8 flex items-center gap-4'>
          <div className='bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl'>
            <Bot className='h-6 w-6' />
          </div>
          <div>
            <h2 className='font-semibold tracking-tight'>Meeting details</h2>
            <p className='text-muted-foreground text-sm'>All fields are required unless marked optional.</p>
          </div>
        </div>
        <ScheduleForm />
      </AppPanel>
    </div>
  );
};

export default NewMeetingPage;
