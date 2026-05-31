'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import MeetingNotesTab from '@/components/meetings/MeetingNotesTab';
import MeetingTranscriptTab from '@/components/meetings/MeetingTranscriptTab';
import MeetingDetailSkeleton from '@/components/skeletons/MeetingDetailSkeleton';
import { useMeeting } from '@/queries/meetings';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { AlertCircle, ArrowLeft, Bot, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface MeetingDetailProps {
  meetingId: string;
}

const STATUS_LABELS: Record<MeetingStatusEnum, string> = {
  [MeetingStatusEnum.SCHEDULED]: 'Scheduled',
  [MeetingStatusEnum.BOT_JOINING]: 'Bot joining',
  [MeetingStatusEnum.IN_PROGRESS]: 'In progress',
  [MeetingStatusEnum.PROCESSING]: 'Processing notes',
  [MeetingStatusEnum.COMPLETED]: 'Completed',
  [MeetingStatusEnum.FAILED]: 'Failed',
  [MeetingStatusEnum.CANCELLED]: 'Cancelled',
};

const MeetingDetail = ({ meetingId }: MeetingDetailProps) => {
  const { data: meeting, isLoading, isError } = useMeeting(meetingId);
  const [activeTab, setActiveTab] = useState('notes');

  if (isLoading) {
    return <MeetingDetailSkeleton />;
  }

  if (isError || !meeting) {
    return (
      <EmptyMessage message='Meeting not found' description='This meeting may have been deleted or you lack access.' />
    );
  }

  const status = meeting.status as MeetingStatusEnum;
  const isProcessing =
    status === MeetingStatusEnum.PROCESSING ||
    status === MeetingStatusEnum.BOT_JOINING ||
    status === MeetingStatusEnum.IN_PROGRESS;

  return (
    <div className='space-y-6'>
      <Button variant='ghost' size='sm' asChild className='-ml-2 gap-1.5'>
        <Link href='/dashboard'>
          <ArrowLeft className='h-4 w-4' />
          Back to dashboard
        </Link>
      </Button>

      <div className='bg-card rounded-xl border p-6'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-semibold tracking-tight'>{meeting.title}</h1>
            <p className='text-muted-foreground text-sm'>
              {new Date(meeting.scheduledAt).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
              {meeting.durationMinutes != null && ` · ${meeting.durationMinutes} min recorded`}
            </p>
          </div>
          <Badge variant={status === MeetingStatusEnum.FAILED ? 'destructive' : 'secondary'} className='shrink-0'>
            {isProcessing && <Loader2 className='mr-1 h-3 w-3 animate-spin' />}
            {STATUS_LABELS[status]}
          </Badge>
        </div>

        {meeting.failureReason && (
          <div className='text-destructive mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm'>
            <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
            <span>{meeting.failureReason}</span>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className='bg-primary/5 border-primary/20 flex items-center gap-3 rounded-xl border p-5'>
          <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
            <Bot className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm font-medium'>Processing your meeting</p>
            <p className='text-muted-foreground text-sm'>
              Notes will appear here when ready. This usually takes a few minutes.
            </p>
          </div>
          <Loader2 className='text-primary ml-auto h-5 w-5 shrink-0 animate-spin' />
        </div>
      )}

      {status === MeetingStatusEnum.COMPLETED && (
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue='notes'>
          <TabsList className='bg-muted/60'>
            <TabsTrigger value='notes'>Notes</TabsTrigger>
            <TabsTrigger value='transcript'>Transcript</TabsTrigger>
          </TabsList>
          <TabsContent value='notes' className='mt-4'>
            <MeetingNotesTab
              notes={meeting.notes}
              structuredDoc={meeting.structuredDoc}
              keyPoints={meeting.keyPoints}
            />
          </TabsContent>
          <TabsContent value='transcript' className='mt-4'>
            <MeetingTranscriptTab
              meetingId={meeting.id}
              transcript={meeting.transcript}
              showRecordingPanel={meeting.showRecordingPanel}
              recordingEnabled={activeTab === 'transcript'}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MeetingDetail;
