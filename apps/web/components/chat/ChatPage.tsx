'use client';
import { UIMessage, useChat } from '@ai-sdk/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { envConfig } from '@/config';
import { useSession } from 'next-auth/react';
import ChatInput from './ChatInput';
import ChatMessages from './ChatMessages';
import Greeting from './Greeting';
import { DefaultChatTransport } from 'ai';
import { useChatTransition } from '@/hooks/useChatTransition';
import { useSWRConfig } from 'swr';
import { getChatHistoryPaginationKey } from './ChatHistory';
import { unstable_serialize } from 'swr/infinite';
import { chatKeys, useGetChatById, useRequestHints } from '@/queries';
import { DataLoader } from '../general/DataLoader';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import EditChatDialog from './EditChatDialog';
import { ChatType } from '@repo/shared-types/types';

type ChatPageProps = {
  id: string;
  initialMessages: UIMessage[];
};

const ChatPage = ({ id, initialMessages }: ChatPageProps) => {
  const { query, chatId, clearTransition } = useChatTransition();
  const { data: session } = useSession();
  const { data: chat, isLoading: isLoadingChat } = useGetChatById(id);
  const initialMessageSentRef = useRef(false);
  const { mutate } = useSWRConfig();
  const [input, setInput] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: requestHints } = useRequestHints();
  const isViewingSharedChat = chat?.isPublic && chat?.userId !== session?.user.id;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editChat, setEditChat] = useState<ChatType | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${envConfig.apiUrl}/api/agents/chat/${id}`,
        headers: {
          Authorization: `Bearer ${session?.user.token}`,
        },
        prepareSendMessagesRequest(request) {
          return {
            headers: {
              Authorization: `Bearer ${session?.user.token}`,
              'X-Timezone': requestHints?.timezone || '',
              'X-City': requestHints?.city || '',
              'X-State': requestHints?.state || '',
              'X-Country': requestHints?.country || '',
              'X-Latitude': requestHints?.latitude?.toString() || '',
              'X-Longitude': requestHints?.longitude?.toString() || '',
            },
            body: {
              message: request.messages.at(-1),
              ...request.body,
            },
          };
        },
      }),
    [id, session?.user, requestHints],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id,
    transport,
    messages: initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      if (messages.length < 3) {
        router.refresh();
        queryClient.invalidateQueries({ queryKey: chatKeys.chat(id) });
      }
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error('Error in chat:', error);
    },
  });

  const handleSubmit = async (messageText?: string) => {
    const textToSend = messageText ?? input;
    if (textToSend.trim()) {
      setInput('');
      await sendMessage({
        role: 'user',
        parts: [{ type: 'text', text: textToSend }],
      });
    }
  };

  useEffect(() => {
    const sendInitialMessage = async () => {
      if (id === chatId && query && !initialMessageSentRef.current) {
        initialMessageSentRef.current = true;
        sendMessage({
          role: 'user',
          parts: [{ type: 'text', text: input || query }],
        });

        clearTransition();
      }
    };

    sendInitialMessage();
  }, [id, chatId, query, clearTransition, sendMessage, input]);

  useEffect(() => {
    if (chat?.title) {
      document.title = `${chat.title} | Chat`;
    }
  }, [chat?.title]);

  if (isLoadingChat && messages.length === 0) {
    return <DataLoader />;
  }

  if (messages.length === 0 && !isViewingSharedChat) {
    return (
      <Greeting query={input} setQuery={setInput} isSubmitting={status === 'streaming'} handleSubmit={handleSubmit} />
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      {messages.length > 0 && !isViewingSharedChat && (
        <div className='border-foreground/10 flex shrink-0 items-center justify-between border-b px-4 py-2'>
          <div className='flex items-center gap-2 align-middle'>
            <p className='text-muted-foreground text-sm font-medium'>{chat?.title}</p>
            <Pencil
              className='text-muted-foreground size-3 cursor-pointer'
              onClick={() => {
                setEditChat(chat ?? null);
                setShowEditDialog(true);
              }}
            />
          </div>
        </div>
      )}
      <div className='flex-1 overflow-auto'>
        <ChatMessages messages={messages} status={status} error={error} />
      </div>
      {!isViewingSharedChat && (
        <div className='shrink-0 p-4 pt-0'>
          <ChatInput
            onSubmit={handleSubmit}
            query={input}
            setQuery={setInput}
            isSubmitting={status === 'streaming'}
            onStop={stop}
          />
        </div>
      )}
      {editChat && showEditDialog && (
        <EditChatDialog
          chat={editChat}
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditChat(null);
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
