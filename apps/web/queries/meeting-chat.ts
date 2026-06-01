import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { DefaultChatTransport } from 'ai';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { Meeting } from '@repo/shared-types/schemas';
import { MeetingChatService } from '@/services/meeting-chat.service';
import { resolveMeetingChatState } from '@/components/meetings/meeting-chat-state';

export const meetingChatKeys = {
  all: ['meeting-chat'] as const,
  history: (meetingId: string) => [...meetingChatKeys.all, meetingId, 'history'] as const,
};

const toUIMessage = (message: Awaited<ReturnType<typeof MeetingChatService.getChat>>[number]) => ({
  id: message.id,
  role: message.role,
  parts: [{ type: 'text' as const, text: message.content }],
});

export const useMeetingChatHistory = (meetingId: string, enabled = true) => {
  return useQuery({
    queryKey: meetingChatKeys.history(meetingId),
    queryFn: () => MeetingChatService.getChat(meetingId),
    enabled: enabled && !!meetingId,
    refetchOnMount: 'always',
  });
};

export const useClearMeetingChat = (meetingId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => MeetingChatService.clearChat(meetingId),
    onSuccess: () => {
      toast.success('Meeting chat cleared');
      queryClient.invalidateQueries({ queryKey: meetingChatKeys.history(meetingId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useMeetingChat = (meeting: Meeting | null | undefined) => {
  const { data: session } = useSession();
  const authToken = session?.user?.token;
  const [input, setInput] = useState('');
  const availability = useMemo(
    () =>
      meeting
        ? resolveMeetingChatState({
            status: meeting.status,
            notes: meeting.notes,
            transcript: meeting.transcript,
            structuredDoc: meeting.structuredDoc,
            keyPoints: meeting.keyPoints,
          })
        : { enabled: false, reason: null as string | null },
    [meeting],
  );

  const meetingId = meeting?.id ?? '';
  const historyQuery = useMeetingChatHistory(meetingId, Boolean(meetingId));
  const clearMutation = useClearMeetingChat(meetingId);
  const queryClient = useQueryClient();

  const transport = useMemo(() => {
    if (!meetingId || !authToken || !availability.enabled) {
      return undefined;
    }

    return new DefaultChatTransport({
      api: MeetingChatService.chatApiUrl(meetingId),
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      prepareSendMessagesRequest(request) {
        const latestMessage = request.messages.at(-1);
        const latestMessageText = latestMessage?.parts
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join('\n')
          .trim();

        return {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            message: latestMessageText ?? '',
          },
        };
      },
    });
  }, [authToken, availability.enabled, meetingId]);

  const chat = useChat({
    id: meetingId,
    transport,
    messages: historyQuery.data?.map(toUIMessage) ?? [],
    experimental_throttle: 100,
    onFinish: async () => {
      await queryClient.invalidateQueries({ queryKey: meetingChatKeys.history(meetingId) });
    },
  });

  return {
    availability,
    historyQuery,
    clearMutation,
    chat: {
      ...chat,
      input,
      setInput,
    },
    isTransportReady: Boolean(transport),
  };
};
