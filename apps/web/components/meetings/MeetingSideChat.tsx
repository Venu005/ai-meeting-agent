'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog';
import { Button } from '@repo/ui/components/button';
import { Trash2 } from 'lucide-react';
import MeetingChatBody, { MeetingChatBodyMessage } from './MeetingChatBody';

interface MeetingSideChatProps {
  messages: MeetingChatBodyMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  isDisabled: boolean;
  disabledReason?: string | null;
  onClearChat: () => void;
  isClearing?: boolean;
  className?: string;
}

const MeetingSideChat = ({
  messages,
  input,
  onInputChange,
  onSend,
  isSending,
  isDisabled,
  disabledReason,
  onClearChat,
  isClearing = false,
  className,
}: MeetingSideChatProps) => {
  return (
    <aside className={className}>
      <div className='bg-card flex h-full min-h-[560px] flex-col rounded-xl border p-4'>
        <div className='mb-3 flex items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold'>Ask about this meeting</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='ghost' size='sm' disabled={isClearing || messages.length === 0}>
                <Trash2 className='h-4 w-4' />
                Clear chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear meeting chat?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your saved chat messages for this meeting.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearChat} disabled={isClearing}>
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <MeetingChatBody
          messages={messages}
          input={input}
          onInputChange={onInputChange}
          onSend={onSend}
          isSending={isSending}
          isDisabled={isDisabled}
          disabledReason={disabledReason}
        />
      </div>
    </aside>
  );
};

export default MeetingSideChat;
