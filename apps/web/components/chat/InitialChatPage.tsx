'use client';
import React from 'react';
import { useChatTransition } from '@/hooks/useChatTransition';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateChat } from '@/queries/chat';
import Greeting from './Greeting';
import { useEffect } from 'react';

const InitialChatPage = () => {
  const { setQuery, query, setChatId } = useChatTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: createChat, isPending: isCreatingChat } = useCreateChat();

  const handleSubmit = async (messageText?: string) => {
    if (messageText) {
      setQuery(messageText);
    }
    createChat(undefined, {
      onSuccess: (data) => {
        setChatId(data.id);
        router.push(`/chat/${data.id}`);
        router.refresh();
      },
    });
  };

  useEffect(() => {
    if (searchParams.get('query')) {
      setQuery(searchParams.get('query') || '');
    }
  }, [searchParams]);

  return <Greeting query={query} setQuery={setQuery} isSubmitting={isCreatingChat} handleSubmit={handleSubmit} />;
};

export default InitialChatPage;
