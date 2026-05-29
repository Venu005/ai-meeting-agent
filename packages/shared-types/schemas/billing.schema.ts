import { z } from 'zod';
import { SubscriptionPlanEnum } from '../enums';

export const usageSchema = z.object({
  minutesUsed: z.number(),
  minutesIncluded: z.number(),
  minutesRemaining: z.number(),
  plan: z.nativeEnum(SubscriptionPlanEnum),
  periodEnd: z.string(),
});

export type Usage = z.infer<typeof usageSchema>;
