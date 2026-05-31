'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import { useMeetingRecording } from '@/queries/meetings';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface MeetingRecordingPlayerProps {
  meetingId: string;
  showRecordingPanel: boolean;
  recordingEnabled: boolean;
}

const MeetingRecordingPlayer = ({ meetingId, showRecordingPanel, recordingEnabled }: MeetingRecordingPlayerProps) => {
  const [expired, setExpired] = useState(false);
  const { data, isLoading } = useMeetingRecording(meetingId, showRecordingPanel && recordingEnabled);

  if (!showRecordingPanel) {
    return null;
  }

  return (
    <div className='bg-card space-y-4 rounded-xl border p-6'>
      <h2 className='text-lg font-semibold tracking-tight'>Meeting Recording</h2>

      {expired ? (
        <EmptyMessage message='Recording expired or unavailable' />
      ) : isLoading || data?.status === 'processing' ? (
        <div className='bg-muted/40 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center'>
          <Loader2 className='text-muted-foreground mb-3 h-8 w-8 animate-spin' />
          <p className='text-sm font-medium'>Processing recording…</p>
        </div>
      ) : data?.status === 'ready' && data.url ? (
        <video src={data.url} controls className='w-full rounded-lg' onError={() => setExpired(true)} />
      ) : (
        <EmptyMessage message='Recording not available' />
      )}
    </div>
  );
};

export default MeetingRecordingPlayer;
