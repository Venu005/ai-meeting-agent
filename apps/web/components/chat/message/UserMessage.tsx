import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { UIMessage } from 'ai';
import AttachmentView from '../AttachmentView';

const UserMessage = ({ message }: { message: UIMessage }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const content = message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n');
      if (content) {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className='flex w-full justify-end gap-3'>
      <div className={cn('flex flex-col gap-1', 'items-end')}>
        <div className={'bg-primary text-primary-foreground w-full rounded-2xl px-4 py-2'}>
          <div className='text-sm whitespace-pre-wrap'>
            {message.parts?.map((part, index) => {
              if (part.type === 'text') {
                return <div key={index}>{part.text}</div>;
              }
            })}
            <AttachmentView attachments={[...(message.parts?.filter((part) => part.type === 'file') ?? [])]} />
          </div>
        </div>
        <div className='flex items-center gap-1.5'>
          <button
            onClick={handleCopy}
            className='hover:bg-muted text-muted-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm p-0.5'
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserMessage;
