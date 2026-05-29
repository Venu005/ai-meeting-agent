import { BillingService } from './billing.service';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
    webhooks: { constructEvent: jest.fn() },
  }));
});

describe('BillingService', () => {
  describe('canUseMinutes', () => {
    it('returns false when requested minutes exceed remaining balance', () => {
      const service = new BillingService({} as never, {} as never);
      expect(service.canUseMinutes({ minutesUsed: 9, minutesIncluded: 10 }, 2)).toBe(false);
      expect(service.canUseMinutes({ minutesUsed: 8, minutesIncluded: 10 }, 2)).toBe(true);
    });
  });
});
