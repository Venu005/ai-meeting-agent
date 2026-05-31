import { useMutation, useQuery } from '@tanstack/react-query';
import { BillingService } from '@/services/billing.service';
import { toast } from 'sonner';

export const billingKeys = {
  all: ['billing'] as const,
  usage: () => [...billingKeys.all, 'usage'] as const,
};

export const useUsage = () => {
  return useQuery({
    queryKey: billingKeys.usage(),
    queryFn: () => BillingService.getUsage(),
    refetchOnMount: 'always',
  });
};

export const useCheckout = () => {
  return useMutation({
    mutationFn: () => BillingService.checkout(),
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

export const useBillingPortal = () => {
  return useMutation({
    mutationFn: () => BillingService.portal(),
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
