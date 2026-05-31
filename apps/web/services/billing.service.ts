import { ApiClient } from '@/lib/api-client';
import { Usage } from '@repo/shared-types/schemas';

export interface StripeRedirectResponse {
  url: string;
}

export class BillingService {
  static async getUsage() {
    return ApiClient.get<Usage>('/api/billing/usage');
  }

  static async checkout() {
    return ApiClient.post<StripeRedirectResponse>('/api/billing/checkout');
  }

  static async portal() {
    return ApiClient.post<StripeRedirectResponse>('/api/billing/portal');
  }
}
