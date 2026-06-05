'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import AppPanel from '@/components/layout/AppPanel';
import MeetingSideChat from '@/components/meetings/MeetingSideChat';
import MeetingSideChatSheet from '@/components/meetings/MeetingSideChatSheet';
import MeetingNotesTab from '@/components/meetings/MeetingNotesTab';
import MeetingTranscriptTab from '@/components/meetings/MeetingTranscriptTab';
import MeetingDetailSkeleton from '@/components/skeletons/MeetingDetailSkeleton';
import { useMeetingChat } from '@/queries/meeting-chat';
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
  const { availability, chat, clearMutation, isTransportReady } = useMeetingChat(meeting);

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

  const handleSendMessage = async () => {
    const message = chat.input.trim();
    if (!message || !isTransportReady) {
      return;
    }

    chat.setInput('');
    await chat.sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: message }],
    });
  };

  const handleClearChat = async () => {
    await clearMutation.mutateAsync();
    chat.setMessages([]);
  };

  const isChatDisabled = !availability.enabled || !isTransportReady;
  const disabledReason =
    availability.reason ?? (!isTransportReady ? 'Sign in to ask questions about this meeting.' : null);
  const isSending = chat.status === 'submitted' || chat.status === 'streaming';
  const shouldShowChatLayout = status === MeetingStatusEnum.COMPLETED || Boolean(disabledReason);

  return (
    <div className='relative space-y-8'>
      <Button variant='ghost' size='sm' asChild className='-ml-2 gap-1.5 text-muted-foreground hover:text-foreground'>
        <Link href='/dashboard'>
          <ArrowLeft className='h-4 w-4' />
          Back to dashboard
        </Link>
      </Button>

      <AppPanel glow className='p-6 md:p-8'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='space-y-2'>
            <p className='app-section-label'>Meeting</p>
            <h1 className='font-serif-accent text-2xl tracking-tight md:text-3xl'>{meeting.title}</h1>
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
          <div className='text-destructive mt-5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm'>
            <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
            <span>{meeting.failureReason}</span>
          </div>
        )}
      </AppPanel>

      {isProcessing && (
        <AppPanel className='border-primary/20 bg-primary/[0.03] p-5'>
          <div className='flex items-center gap-4'>
            <div className='bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'>
              <Bot className='h-5 w-5' />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium'>Processing your meeting</p>
              <p className='text-muted-foreground text-sm'>
                Notes will appear here when ready. This usually takes a few minutes.
              </p>
            </div>
            <Loader2 className='text-primary h-5 w-5 shrink-0 animate-spin' />
          </div>
        </AppPanel>
      )}

      {shouldShowChatLayout && (
        <div className='grid grid-cols-1 gap-6 lg:items-start lg:gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]'>
          <div className='min-w-0'>
            {status === MeetingStatusEnum.COMPLETED && (
              <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue='notes'>
                <TabsList className='bg-muted/40 h-11 rounded-xl p-1'>
                  <TabsTrigger value='notes' className='rounded-lg px-4'>
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value='transcript' className='rounded-lg px-4'>
                    Transcript
                  </TabsTrigger>
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

          <MeetingSideChat
            className='hidden lg:block lg:sticky lg:top-4 lg:self-start lg:h-[calc(100dvh-7rem)]'
            messages={chat.messages}
            input={chat.input}
            onInputChange={chat.setInput}
            onSend={handleSendMessage}
            isSending={isSending}
            isDisabled={isChatDisabled}
            disabledReason={disabledReason}
            onClearChat={handleClearChat}
            isClearing={clearMutation.isPending}
          />
        </div>
      )}

      {shouldShowChatLayout && (
        <div className='fixed right-4 bottom-4 z-20 lg:hidden'>
          <MeetingSideChatSheet
            messages={chat.messages}
            input={chat.input}
            onInputChange={chat.setInput}
            onSend={handleSendMessage}
            isSending={isSending}
            isDisabled={isChatDisabled}
            disabledReason={disabledReason}
            triggerLabel='Ask'
          />
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;
