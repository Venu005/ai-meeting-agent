'use client';

import { Button } from '@repo/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/components/sheet';
import { MessageSquare } from 'lucide-react';
import MeetingChatBody, { MeetingChatBodyMessage } from './MeetingChatBody';

interface MeetingSideChatSheetProps {
  messages: MeetingChatBodyMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  isDisabled: boolean;
  disabledReason?: string | null;
  triggerLabel?: string;
}

const MeetingSideChatSheet = ({
  messages,
  input,
  onInputChange,
  onSend,
  isSending,
  isDisabled,
  disabledReason,
  triggerLabel = 'Ask',
}: MeetingSideChatSheetProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size='sm' className='gap-1.5 shadow-lg shadow-black/30'>
          <MessageSquare className='h-4 w-4' />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side='bottom' className='h-[82vh] rounded-t-2xl border-t border-white/10 p-0'>
        <SheetHeader className='border-b px-4 py-3 text-left'>
          <SheetTitle>Ask about this meeting</SheetTitle>
          <SheetDescription>Get quick answers grounded in this meeting only.</SheetDescription>
        </SheetHeader>
        <div className='flex h-[calc(82vh-74px)] min-h-0 flex-col p-4'>
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
      </SheetContent>
    </Sheet>
  );
};

export default MeetingSideChatSheet;
