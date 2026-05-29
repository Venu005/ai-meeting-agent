'use client';

import { Meeting } from '@repo/shared-types/schemas';
import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, Clock, ExternalLink, FileText } from 'lucide-react';
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
  const isLive =
    status === MeetingStatusEnum.BOT_JOINING ||
    status === MeetingStatusEnum.IN_PROGRESS ||
    status === MeetingStatusEnum.PROCESSING;

  return (
    <div
      className={cn(
        'bg-card group rounded-xl border p-5 shadow-sm transition-colors duration-200 hover:border-primary/30',
        isLive && 'border-primary/30',
      )}
    >
      <div className='flex flex-row items-start justify-between gap-4'>
        <div className='min-w-0 flex-1 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='truncate text-base font-semibold'>{meeting.title}</h3>
            {isLive && (
              <span className='bg-primary/10 relative flex h-2 w-2 shrink-0 rounded-full' aria-hidden='true'>
                <span className='bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75' />
                <span className='bg-primary relative inline-flex h-2 w-2 rounded-full' />
              </span>
            )}
          </div>
          <div className='text-muted-foreground flex flex-wrap items-center gap-3 text-sm'>
            <span className='inline-flex items-center gap-1.5'>
              <Calendar className='h-3.5 w-3.5' />
              {formatDateTime(meeting.scheduledAt)}
            </span>
            {meeting.durationMinutes != null && (
              <span className='inline-flex items-center gap-1.5'>
                <Clock className='h-3.5 w-3.5' />
                {meeting.durationMinutes} min
              </span>
            )}
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[status]} className='shrink-0'>
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-2 border-t pt-4'>
        {showDetail && (
          <Button size='sm' variant='outline' asChild className='gap-1.5'>
            <Link href={`/meetings/${meeting.id}`}>
              <FileText className='h-3.5 w-3.5' />
              View notes
            </Link>
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
      </div>
    </div>
  );
};

export default MeetingCard;
