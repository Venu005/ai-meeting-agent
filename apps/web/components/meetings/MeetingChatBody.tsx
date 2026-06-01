'use client';

import { FormEvent } from 'react';
import { Button } from '@repo/ui/components/button';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Textarea } from '@repo/ui/components/textarea';
import { cn } from '@repo/ui/lib/utils';
import { Bot, Loader2, Send, User } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

type ChatPart = {
  type?: string;
  text?: string;
};

export interface MeetingChatBodyMessage {
  id: string;
  role: ChatRole;
  content?: string;
  parts?: ChatPart[];
}

interface MeetingChatBodyProps {
  messages: MeetingChatBodyMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  isDisabled: boolean;
  disabledReason?: string | null;
  className?: string;
}

const getMessageText = (message: MeetingChatBodyMessage): string => {
  if (message.content?.trim()) {
    return message.content.trim();
  }

  const partText = message.parts
    ?.filter((part) => part.type === 'text' || typeof part.type === 'undefined')
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();

  return partText ?? '';
};

const EMPTY_PROMPTS = ['What are the key decisions?', 'Summarize action items.', 'What risks were discussed?'] as const;

const MeetingChatBody = ({
  messages,
  input,
  onInputChange,
  onSend,
  isSending,
  isDisabled,
  disabledReason,
  className,
}: MeetingChatBodyProps) => {
  const canSend = !isDisabled && !isSending && input.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }
    onSend();
  };

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      {isDisabled && disabledReason && (
        <div className='bg-muted/70 text-muted-foreground flex items-start gap-2 rounded-lg border px-3 py-2 text-xs'>
          <Bot className='mt-0.5 h-3.5 w-3.5 shrink-0' />
          <span>{disabledReason}</span>
        </div>
      )}

      <ScrollArea className='bg-muted/30 min-h-[280px] flex-1 rounded-lg border'>
        <div className='space-y-3 p-3'>
          {messages.length === 0 ? (
            <div className='space-y-3 py-6 text-center'>
              <p className='text-muted-foreground text-sm'>Ask questions about notes, transcript, or key points.</p>
              <div className='flex flex-wrap justify-center gap-2'>
                {EMPTY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type='button'
                    onClick={() => onInputChange(prompt)}
                    disabled={isDisabled || isSending}
                    className='bg-background hover:bg-accent text-muted-foreground rounded-full border px-3 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              const text = getMessageText(message);

              if (!text) {
                return null;
              }

              return (
                <div key={message.id} className={cn('flex gap-2', isUser && 'justify-end')}>
                  {!isUser && (
                    <div className='bg-primary/10 text-primary mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>
                      <Bot className='h-3.5 w-3.5' />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[88%] rounded-lg border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                      isUser ? 'bg-primary text-primary-foreground border-primary' : 'bg-background',
                    )}
                  >
                    {text}
                  </div>
                  {isUser && (
                    <div className='bg-secondary text-secondary-foreground mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full'>
                      <User className='h-3.5 w-3.5' />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {isSending && (
            <div className='text-muted-foreground flex items-center gap-2 px-1 text-xs'>
              <Loader2 className='h-3.5 w-3.5 animate-spin' />
              Thinking...
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className='space-y-2'>
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder='Ask about this meeting...'
          disabled={isDisabled || isSending}
          className='max-h-28 min-h-20 resize-y text-sm'
        />
        <div className='flex justify-end'>
          <Button type='submit' size='sm' disabled={!canSend}>
            {isSending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MeetingChatBody;
