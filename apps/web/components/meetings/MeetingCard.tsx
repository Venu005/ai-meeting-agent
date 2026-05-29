'use client';

import { Meeting } from '@repo/shared-types/schemas';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<MeetingStatusEnum, string> = {
  [MeetingStatusEnum.SCHEDULED]: 'Scheduled',
  [MeetingStatusEnum.BOT_JOINING]: 'Bot joining',
  [MeetingStatusEnum.IN_PROGRESS]: 'In progress',
  [MeetingStatusEnum.PROCESSING]: 'Processing',
  [MeetingStatusEnum.COMPLETED]: 'Completed',
  [MeetingStatusEnum.FAILED]: 'Failed',
  [MeetingStatusEnum.CANCELLED]: 'Cancelled',
};

const STATUS_VARIANT: Record<MeetingStatusEnum, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [MeetingStatusEnum.SCHEDULED]: 'secondary',
  [MeetingStatusEnum.BOT_JOINING]: 'default',
  [MeetingStatusEnum.IN_PROGRESS]: 'default',
  [MeetingStatusEnum.PROCESSING]: 'default',
  [MeetingStatusEnum.COMPLETED]: 'outline',
  [MeetingStatusEnum.FAILED]: 'destructive',
  [MeetingStatusEnum.CANCELLED]: 'outline',
};

interface MeetingCardProps {
  meeting: Meeting;
  onCancel?: (id: string) => void;
  isCancelling?: boolean;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const MeetingCard = ({ meeting, onCancel, isCancelling }: MeetingCardProps) => {
  const status = meeting.status as MeetingStatusEnum;
  const canCancel = status === MeetingStatusEnum.SCHEDULED && onCancel;
  const showDetail = status === MeetingStatusEnum.COMPLETED || status === MeetingStatusEnum.PROCESSING;

  return (
    <Card>
      <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
        <div className='min-w-0 flex-1 space-y-1'>
          <CardTitle className='truncate text-base'>{meeting.title}</CardTitle>
          <CardDescription className='flex flex-wrap items-center gap-3'>
            <span className='inline-flex items-center gap-1'>
              <Calendar className='h-3.5 w-3.5' />
              {formatDateTime(meeting.scheduledAt)}
            </span>
            {meeting.durationMinutes != null && (
              <span className='inline-flex items-center gap-1'>
                <Clock className='h-3.5 w-3.5' />
                {meeting.durationMinutes} min
              </span>
            )}
          </CardDescription>
        </div>
        <Badge variant={STATUS_VARIANT[status]} className={cn('shrink-0')}>
          {STATUS_LABELS[status]}
        </Badge>
      </CardHeader>
      <CardContent className='flex flex-wrap items-center gap-2'>
        {showDetail && (
          <Button size='sm' variant='outline' asChild>
            <Link href={`/meetings/${meeting.id}`}>View notes</Link>
          </Button>
        )}
        <Button size='sm' variant='ghost' asChild>
          <a href={meeting.meetUrl} target='_blank' rel='noopener noreferrer'>
            <ExternalLink className='mr-1 h-3.5 w-3.5' />
            Meet link
          </a>
        </Button>
        {canCancel && (
          <Button size='sm' variant='destructive' disabled={isCancelling} onClick={() => onCancel(meeting.id)}>
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MeetingCard;
