import UserMessage from './message/UserMessage';
import AIMessage from './message/AIMessage';
import { UIMessage, ChatStatus } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
  status: ChatStatus;
  isLast: boolean;
  isMessageLoading: boolean;
}

function PureChatMessage({ message, status, isLast, isMessageLoading }: ChatMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  } else {
    return <AIMessage message={message} status={status} isMessageLoading={isMessageLoading} isLast={isLast} />;
  }
}

export const ChatMessage = PureChatMessage;
