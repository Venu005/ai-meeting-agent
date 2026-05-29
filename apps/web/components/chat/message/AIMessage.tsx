import { cn } from '@repo/ui/lib/utils';
import React, { useState } from 'react';
import CustomMarkdown from '../CustomMarkdown';
import { toolComponents } from '../tools';
import { UIMessage, isToolUIPart, getToolName, ChatStatus } from 'ai';
import { Check } from 'lucide-react';
import { Copy } from 'lucide-react';
import GenericTool from '../tools/GenericTool';
import IconLoading from '../IconLoading';

type AIMessageProps = {
  message: UIMessage;
  status: ChatStatus;
  isMessageLoading: boolean;
  isLast: boolean;
};

const AIMessage = ({ message, status, isMessageLoading, isLast }: AIMessageProps) => {
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
    <div className='flex max-w-full items-start justify-start gap-3'>
      {!isMessageLoading && <IconLoading status={status} isLast={isLast} />}
      <div className={cn('flex flex-1 flex-col gap-1', 'items-start')}>
        <div className={'w-full text-sm'}>
          {message.parts?.map((part, index) => {
            const { type } = part;
            if (type === 'reasoning') {
              return <CustomMarkdown key={index} className='text-sm italic' message={part.text} />;
            }
            if (type === 'text') {
              return <CustomMarkdown key={index} message={part.text} />;
            }
            if (isToolUIPart(part)) {
              const toolInvocation = part;
              const toolName = getToolName(toolInvocation);
              if (toolName in toolComponents) {
                const ToolComponent = toolComponents[toolName as keyof typeof toolComponents];
                return <ToolComponent key={index} tool={toolInvocation} />;
              }
              return <GenericTool key={index} tool={toolInvocation} />;
            }
          })}
        </div>
        {(status === 'ready' || !isLast) && (
          <div className='flex items-center gap-1.5'>
            <button
              onClick={handleCopy}
              className='hover:bg-muted text-muted-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm p-0.5'
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessage;
