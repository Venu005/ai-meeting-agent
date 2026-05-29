import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@repo/db';
import { SubscriptionPlanEnum } from '@repo/shared-types/enums';
// Stripe publishes a CJS `export=` entry; require import keeps runtime + Jest working.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StripeSdk = require('stripe');
import type { Stripe } from 'stripe/cjs/stripe.core.js';
import { config } from 'src/common/config';
import { PrismaService } from 'src/prisma/prisma.service';

const FREE_MINUTES_INCLUDED = 10;
const PRO_MINUTES_INCLUDED = 300;
const USAGE_PERIOD_DAYS = 30;

export type UsageBalance = {
  minutesUsed: number;
  minutesIncluded: number;
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new StripeSdk(config.stripe.secretKey);
  }

  canUseMinutes(usage: UsageBalance, requestedMinutes: number): boolean {
    return usage.minutesUsed + requestedMinutes <= usage.minutesIncluded;
  }

  async getOrCreateUsagePeriod(userId: string) {
    const existing = await this.prisma.usagePeriod.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }

    return this.prisma.usagePeriod.create({
      data: {
        userId,
        minutesIncluded: FREE_MINUTES_INCLUDED,
        minutesUsed: 0,
        periodEnd: this.addDays(new Date(), USAGE_PERIOD_DAYS),
      },
    });
  }

  async deductMinutes(userId: string, minutes: number): Promise<void> {
    await this.getOrCreateUsagePeriod(userId);
    await this.prisma.usagePeriod.update({
      where: { userId },
      data: { minutesUsed: { increment: minutes } },
    });
  }

  async getUsage(userId: string) {
    const [usagePeriod, subscription] = await Promise.all([
      this.getOrCreateUsagePeriod(userId),
      this.prisma.subscription.findUnique({ where: { userId } }),
    ]);

    const plan = subscription?.plan ?? SubscriptionPlan.FREE;
    const minutesRemaining = Math.max(0, usagePeriod.minutesIncluded - usagePeriod.minutesUsed);

    return {
      minutesUsed: usagePeriod.minutesUsed,
      minutesIncluded: usagePeriod.minutesIncluded,
      minutesRemaining,
      plan: plan as SubscriptionPlanEnum,
      periodEnd: usagePeriod.periodEnd.toISOString(),
    };
  }

  async createCheckoutSession(userId: string, email: string): Promise<{ url: string }> {
    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
    let customerId = existing?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customerId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.active,
        },
        update: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: config.stripe.proPriceId, quantity: 1 }],
      success_url: `${config.urls.frontend}/settings/billing?success=true`,
      cancel_url: `${config.urls.frontend}/settings/billing?canceled=true`,
      metadata: { userId },
      subscription_data: {
        metadata: { userId },
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return { url: session.url };
  }

  async createPortalSession(stripeCustomerId: string): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${config.urls.frontend}/settings/billing`,
    });

    return { url: session.url };
  }

  async createPortalSessionForUser(userId: string): Promise<{ url: string }> {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription?.stripeCustomerId) {
      throw new NotFoundException('No billing account found');
    }

    return this.createPortalSession(subscription.stripeCustomerId);
  }

  async handleWebhook(rawBody: Buffer, signature: string | string[] | undefined): Promise<{ received: boolean }> {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
    } catch (error) {
      this.logger.warn('Stripe webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.warn('checkout.session.completed missing userId metadata');
      return;
    }

    const stripeCustomerId = this.extractId(session.customer);
    const stripeSubscriptionId = this.extractId(session.subscription);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeCustomerId,
        stripeSubscriptionId,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.active,
      },
      update: {
        stripeCustomerId: stripeCustomerId ?? undefined,
        stripeSubscriptionId: stripeSubscriptionId ?? undefined,
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.active,
      },
    });

    await this.prisma.usagePeriod.upsert({
      where: { userId },
      create: {
        userId,
        minutesIncluded: PRO_MINUTES_INCLUDED,
        minutesUsed: 0,
        periodEnd: this.addDays(new Date(), USAGE_PERIOD_DAYS),
      },
      update: {
        minutesIncluded: PRO_MINUTES_INCLUDED,
        minutesUsed: 0,
      },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const stripeCustomerId = this.extractId(invoice.customer);
    if (!stripeCustomerId) {
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId },
    });
    if (!subscription) {
      this.logger.warn(`No subscription for Stripe customer ${stripeCustomerId}`);
      return;
    }

    const minutesIncluded = subscription.plan === SubscriptionPlan.PRO ? PRO_MINUTES_INCLUDED : FREE_MINUTES_INCLUDED;

    await this.prisma.usagePeriod.upsert({
      where: { userId: subscription.userId },
      create: {
        userId: subscription.userId,
        minutesIncluded,
        minutesUsed: 0,
        periodEnd: this.addDays(new Date(), USAGE_PERIOD_DAYS),
      },
      update: {
        minutesIncluded,
        minutesUsed: 0,
        periodStart: new Date(),
        periodEnd: this.addDays(new Date(), USAGE_PERIOD_DAYS),
      },
    });
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) {
      return;
    }

    const status = this.mapStripeStatus(stripeSubscription.status);
    const isActive = stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing';
    const billingItem = stripeSubscription.items.data[0];
    const periodStart = billingItem ? new Date(billingItem.current_period_start * 1000) : undefined;
    const periodEnd = billingItem ? new Date(billingItem.current_period_end * 1000) : undefined;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        plan: isActive ? SubscriptionPlan.PRO : subscription.plan,
        ...(periodStart ? { currentPeriodStart: periodStart } : {}),
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      },
    });
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.canceled,
        stripeSubscriptionId: null,
      },
    });

    await this.prisma.usagePeriod.update({
      where: { userId: subscription.userId },
      data: { minutesIncluded: FREE_MINUTES_INCLUDED },
    });
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    switch (status) {
      case 'active':
      case 'trialing':
        return SubscriptionStatus.active;
      case 'past_due':
      case 'unpaid':
        return SubscriptionStatus.past_due;
      default:
        return SubscriptionStatus.canceled;
    }
  }

  private extractId(
    value: string | Stripe.Customer | Stripe.Subscription | Stripe.DeletedCustomer | null
  ): string | null {
    if (!value) {
      return null;
    }
    return typeof value === 'string' ? value : value.id;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
