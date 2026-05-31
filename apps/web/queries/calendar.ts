import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarService } from '@/services/calendar.service';
import { meetingKeys } from '@/queries/meetings';
import { toast } from 'sonner';

export const calendarKeys = {
  all: ['calendar'] as const,
  events: () => [...calendarKeys.all, 'events'] as const,
};

export const useCalendarEvents = (enabled = true) => {
  return useQuery({
    queryKey: calendarKeys.events(),
    queryFn: () => CalendarService.listEvents(),
    enabled,
    refetchOnMount: 'always',
    retry: false,
  });
};

export const useCalendarConnect = () => {
  return useMutation({
    mutationFn: () => CalendarService.getConnectUrl(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useEnableCalendarBot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, calendarId }: { eventId: string; calendarId: string }) =>
      CalendarService.enableBot(eventId, calendarId),
    onSuccess: () => {
      toast.success('AI bot scheduled for this event');
      queryClient.invalidateQueries({ queryKey: calendarKeys.events() });
      queryClient.invalidateQueries({ queryKey: meetingKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
