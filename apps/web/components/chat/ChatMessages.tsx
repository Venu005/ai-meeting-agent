import { ChatMessage } from './ChatMessage';
import { ChatStatus, UIMessage } from 'ai';
import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@repo/ui/lib/utils';
import MessageLoading from './MessageLoading';
import ErrorMessage from './ErrorMessage';

interface ChatMessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
}

const ChatMessages = ({ messages, status, error }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  let isMessageLoading = false;
  if (messages && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if ((lastMessage?.parts?.length ?? 0) <= 1) {
      if (status === 'submitted' || status === 'streaming') {
        isMessageLoading = true;
      }
    }
  }

  const lastMessage = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }, [messages]);

  return (
    <div className='mx-auto w-full flex-1 overflow-y-auto px-4 pt-4 md:mt-0'>
      <div className='mx-auto flex max-w-3xl min-w-0 flex-col gap-4'>
        {messages?.map((message, index) => (
          <div key={message.id || index} className={cn(lastMessage?.id === message.id ? 'min-h-[50vh]' : '')}>
            <ChatMessage
              key={message.id || index}
              message={message}
              status={status}
              isLast={index === messages.length - 1}
              isMessageLoading={isMessageLoading && index === messages.length - 1}
            />
            {index === messages.length - 1 && (
              <>
                {isMessageLoading && <MessageLoading isLast={index === messages.length - 1} />}
                {error && <ErrorMessage error={error?.message ?? 'An error occurred'} />}
              </>
            )}
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} className='min-h-[24px] min-w-[24px] shrink-0' />
    </div>
  );
};

export default ChatMessages;
