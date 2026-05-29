import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MeetingService } from '@/services/meeting.service';
import { CreateMeetingInput } from '@repo/shared-types/schemas';
import { toast } from 'sonner';

export const meetingKeys = {
  all: ['meetings'] as const,
  list: (page?: number, limit?: number) => [...meetingKeys.all, 'list', page, limit] as const,
  detail: (id: string) => [...meetingKeys.all, id] as const,
};

export const useMeetings = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: meetingKeys.list(params?.page, params?.limit),
    queryFn: () => MeetingService.list(params),
    refetchOnMount: 'always',
  });
};

export const useMeeting = (id: string) => {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => MeetingService.get(id),
    enabled: !!id,
    refetchOnMount: 'always',
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PROCESSING' || status === 'BOT_JOINING' || status === 'IN_PROGRESS' ? 5000 : false;
    },
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) => MeetingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
  });
};

export const useCancelMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MeetingService.cancel(id),
    onSuccess: (_, id) => {
      toast.success('Meeting cancelled');
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
      queryClient.invalidateQueries({ queryKey: meetingKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
