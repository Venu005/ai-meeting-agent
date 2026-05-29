import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services';
import { toast } from 'sonner';

export const chatKeys = {
  all: ['chats'] as const,
  chat: (chatId: string) => [...chatKeys.all, chatId] as const,
  chats: () => [...chatKeys.all, 'list'] as const,
  publicChats: () => [...chatKeys.all, 'public'] as const,
};

export const useCreateTranscript = () => {
  return useMutation({
    mutationFn: (file: File) => ChatService.createTranscript(file),
    onError: (error: Error) => {
      throw new Error(error.message);
    },
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => ChatService.createChat(),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.chats() });
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => ChatService.deleteChat(chatId),
    onSuccess: () => {
      toast.success('Chat deleted successfully');
      queryClient.invalidateQueries({ queryKey: chatKeys.chats() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: { title?: string; isPublic?: boolean } }) =>
      ChatService.updateChat(chatId, body),
    onSuccess: (_, variables) => {
      toast.success('Chat updated successfully');
      queryClient.invalidateQueries({ queryKey: chatKeys.chat(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.chats() });
      if (variables.body.isPublic !== undefined) {
        queryClient.invalidateQueries({ queryKey: chatKeys.publicChats() });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useGetChatById = (chatId: string) => {
  return useQuery({
    queryKey: chatKeys.chat(chatId),
    queryFn: () => ChatService.getChatById(chatId),
    enabled: !!chatId,
  });
};

export const useGetPublicChatsForUser = () => {
  return useQuery({
    queryKey: chatKeys.publicChats(),
    queryFn: () => ChatService.getPublicChatsForUser(),
  });
};
