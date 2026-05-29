import { useQuery, useQueryClient } from '@tanstack/react-query';

type ChatTransitionAttachment = File; // forward compatibility if we expand beyond File

export type ChatTransitionState = {
  query: string;
  files: ChatTransitionAttachment[];
  chatId: string | null;
  isUploading: boolean;
};

const chatTransitionQueryKey = ['chatTransition'] as const;

const initialChatTransitionState: ChatTransitionState = {
  query: '',
  files: [],
  chatId: null,
  isUploading: false,
};

export function useChatTransition() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: chatTransitionQueryKey,
    // local client state only; we seed with initial state
    queryFn: async () => initialChatTransitionState,
    initialData: initialChatTransitionState,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000, // keep around long enough for navigations
  });

  const setState = (updater: (prev: ChatTransitionState) => ChatTransitionState) => {
    queryClient.setQueryData(chatTransitionQueryKey, (prev?: ChatTransitionState) => {
      const previous = prev ?? initialChatTransitionState;
      return updater(previous);
    });
  };

  const setQuery = (query: string) => setState((prev) => ({ ...prev, query }));

  const setFiles = (files: ChatTransitionAttachment[]) => setState((prev) => ({ ...prev, files }));

  const addFiles = (newFiles: ChatTransitionAttachment[]) =>
    setState((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));

  const removeFile = (index: number) =>
    setState((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));

  const setChatId = (id: string | null) => setState((prev) => ({ ...prev, chatId: id }));

  const setIsUploading = (isUploading: boolean) => setState((prev) => ({ ...prev, isUploading }));

  const clearTransition = () => queryClient.setQueryData(chatTransitionQueryKey, initialChatTransitionState);

  return {
    query: data!.query,
    files: data!.files,
    chatId: data!.chatId,
    isUploading: data!.isUploading,
    setQuery,
    setFiles,
    addFiles,
    removeFile,
    setChatId,
    setIsUploading,
    clearTransition,
  } as const;
}

export const chatTransitionKeys = {
  root: () => chatTransitionQueryKey,
};
