'use client';

import CustomMarkdown from '@/components/chat/CustomMarkdown';
import { DataLoader } from '@/components/general/DataLoader';
import EmptyMessage from '@/components/general/EmptyMessage';
import { useMeeting } from '@/queries/meetings';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { AlertCircle, Loader2 } from 'lucide-react';

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

  if (isLoading) {
    return <DataLoader message='Loading meeting…' />;
  }

  if (isError || !meeting) {
    return <EmptyMessage message='Meeting not found' />;
  }

  const status = meeting.status as MeetingStatusEnum;
  const isProcessing =
    status === MeetingStatusEnum.PROCESSING ||
    status === MeetingStatusEnum.BOT_JOINING ||
    status === MeetingStatusEnum.IN_PROGRESS;

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <CardTitle>{meeting.title}</CardTitle>
              <CardDescription>
                {new Date(meeting.scheduledAt).toLocaleString(undefined, {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
                {meeting.durationMinutes != null && ` · ${meeting.durationMinutes} min recorded`}
              </CardDescription>
            </div>
            <Badge variant={status === MeetingStatusEnum.FAILED ? 'destructive' : 'secondary'}>
              {isProcessing && <Loader2 className='mr-1 h-3 w-3 animate-spin' />}
              {STATUS_LABELS[status]}
            </Badge>
          </div>
        </CardHeader>
        {meeting.failureReason && (
          <CardContent>
            <div className='text-destructive flex items-start gap-2 text-sm'>
              <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
              <span>{meeting.failureReason}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {isProcessing && (
        <Card>
          <CardContent className='text-muted-foreground flex items-center gap-2 py-6 text-sm'>
            <Loader2 className='h-4 w-4 animate-spin' />
            Your meeting is being processed. Notes will appear here when ready.
          </CardContent>
        </Card>
      )}

      {status === MeetingStatusEnum.COMPLETED && (
        <Tabs defaultValue='notes'>
          <TabsList>
            <TabsTrigger value='notes'>Notes</TabsTrigger>
            <TabsTrigger value='doc'>Doc</TabsTrigger>
            <TabsTrigger value='key-points'>Key Points</TabsTrigger>
          </TabsList>
          <TabsContent value='notes' className='mt-4'>
            <Card>
              <CardContent className='pt-6'>
                {meeting.notes ? (
                  <CustomMarkdown message={meeting.notes} />
                ) : (
                  <EmptyMessage message='No notes available' />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='doc' className='mt-4'>
            <Card>
              <CardContent className='pt-6'>
                {meeting.structuredDoc ? (
                  <CustomMarkdown message={meeting.structuredDoc} />
                ) : (
                  <EmptyMessage message='No structured document available' />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='key-points' className='mt-4'>
            <Card>
              <CardContent className='pt-6'>
                {meeting.keyPoints && meeting.keyPoints.length > 0 ? (
                  <ul className='list-disc space-y-2 pl-5'>
                    {meeting.keyPoints.map((point, index) => (
                      <li key={`${index}-${point.slice(0, 20)}`}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyMessage message='No key points available' />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MeetingDetail;
