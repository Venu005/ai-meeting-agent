'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import MeetingRecordingPlayer from '@/components/meetings/MeetingRecordingPlayer';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const SPEAKER_LINE_REGEX = /^Speaker \d+:/;

interface MeetingTranscriptTabProps {
  meetingId: string;
  transcript: string | null;
  showRecordingPanel: boolean;
  recordingEnabled: boolean;
}

const renderTranscriptLine = (line: string, index: number) => {
  if (!line) {
    return <br key={index} />;
  }

  if (SPEAKER_LINE_REGEX.test(line)) {
    const colonIndex = line.indexOf(':');
    const speakerLabel = line.slice(0, colonIndex + 1);
    const remainder = line.slice(colonIndex + 1);

    return (
      <p key={index} className='text-sm leading-relaxed'>
        <span className='text-muted-foreground font-medium'>{speakerLabel}</span>
        {remainder}
      </p>
    );
  }

  return (
    <p key={index} className='text-sm leading-relaxed'>
      {line}
    </p>
  );
};

const MeetingTranscriptTab = ({
  meetingId,
  transcript,
  showRecordingPanel,
  recordingEnabled,
}: MeetingTranscriptTabProps) => {
  const [copied, setCopied] = useState(false);
  const hasTranscript = Boolean(transcript?.trim());
  const lines = hasTranscript ? transcript!.split('\n') : [];

  const handleCopy = async () => {
    if (!transcript) {
      return;
    }

    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy transcript');
    }
  };

  return (
    <div className={cn('grid gap-6', showRecordingPanel && 'lg:grid-cols-2')}>
      <div className='bg-card flex min-h-0 flex-col rounded-xl border p-6'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <h2 className='text-lg font-semibold tracking-tight'>Transcript</h2>
          {hasTranscript && (
            <Button variant='outline' size='sm' className='gap-1.5' onClick={handleCopy}>
              {copied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </div>

        {hasTranscript ? (
          <div className='max-h-[32rem] space-y-1 overflow-y-auto pr-1'>{lines.map(renderTranscriptLine)}</div>
        ) : (
          <EmptyMessage message='No transcript available' />
        )}
      </div>

      <MeetingRecordingPlayer
        meetingId={meetingId}
        showRecordingPanel={showRecordingPanel}
        recordingEnabled={recordingEnabled}
      />
    </div>
  );
};

export default MeetingTranscriptTab;
