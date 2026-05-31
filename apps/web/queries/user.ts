import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/user.service';
import { UserPersonaEnum } from '@repo/shared-types/enums';
import { toast } from 'sonner';

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => UserService.me(),
    enabled,
    refetchOnMount: 'always',
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (persona: UserPersonaEnum) => UserService.completeOnboarding(persona),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
