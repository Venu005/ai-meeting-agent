'use client';

import LoadingButton from '@/components/general/LoadingButton';
import PageHeader from '@/components/layout/PageHeader';
import UsageBar from '@/components/meetings/UsageBar';
import { useBillingPortal, useCheckout, useUsage } from '@/queries/billing';
import { SubscriptionPlanEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';

const PRO_FEATURES = ['300 meeting minutes per period', 'Priority processing', 'All persona templates'] as const;
const FREE_FEATURES = ['10 meeting minutes per period', 'Basic notes & key points', 'Google Calendar sync'] as const;

type PlanCardProps = {
  title: string;
  description: string;
  priceLabel: string;
  features: readonly string[];
  isCurrent: boolean;
  action: ReactNode;
};

const PlanCard = ({ title, description, priceLabel, features, isCurrent, action }: PlanCardProps) => {
  return (
    <div className='bg-card flex h-full flex-col rounded-xl border p-6 md:p-8'>
      <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold'>{title}</h2>
            {isCurrent && <Badge variant='secondary'>Current</Badge>}
          </div>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </div>
        <Badge variant={title === 'Pro' ? 'default' : 'secondary'} className='text-sm'>
          {priceLabel}
        </Badge>
      </div>

      <ul className='mb-6 space-y-2'>
        {features.map((feature) => (
          <li key={feature} className='flex items-center gap-2 text-sm'>
            <Check className='text-primary h-4 w-4 shrink-0' />
            {feature}
          </li>
        ))}
      </ul>

      <div className='mt-auto'>{action}</div>
    </div>
  );
};

const BillingPageContent = () => {
  const searchParams = useSearchParams();
  const { data: usage, refetch } = useUsage();
  const { mutate: checkout, isPending: isCheckoutPending } = useCheckout();
  const { mutate: openPortal, isPending: isPortalPending } = useBillingPortal();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully');
      refetch();
    }
    if (searchParams.get('canceled') === 'true') {
      toast.message('Checkout canceled');
    }
  }, [refetch, searchParams]);

  const isPro = usage?.plan === SubscriptionPlanEnum.PRO;

  return (
    <div className='mx-auto max-w-5xl space-y-8'>
      <PageHeader title='Billing' description='Manage your plan and meeting minute allowance.' />

      <UsageBar />

      <div className='grid gap-6 md:grid-cols-2'>
        <PlanCard
          title='Free'
          description='Start with a small monthly allowance for trying Meetra.'
          priceLabel='$0'
          features={FREE_FEATURES}
          isCurrent={!isPro}
          action={
            usage?.periodEnd ? (
              <p className='text-muted-foreground text-xs'>
                Period ends {new Date(usage.periodEnd).toLocaleDateString()}
              </p>
            ) : null
          }
        />

        <PlanCard
          title='Pro'
          description='Unlock more meeting minutes and priority AI processing.'
          priceLabel='$19/mo'
          features={PRO_FEATURES}
          isCurrent={isPro}
          action={
            isPro ? (
              <LoadingButton variant='outline' isLoading={isPortalPending} onClick={() => openPortal()}>
                Manage subscription
              </LoadingButton>
            ) : (
              <LoadingButton isLoading={isCheckoutPending} onClick={() => checkout()}>
                Upgrade to Pro
              </LoadingButton>
            )
          }
        />
      </div>

      {isPro && usage?.periodEnd && (
        <div className='bg-card rounded-xl border p-6'>
          <p className='text-muted-foreground mt-4 text-xs'>
            Period ends {new Date(usage.periodEnd).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

const BillingPage = () => (
  <Suspense fallback={null}>
    <BillingPageContent />
  </Suspense>
);

export default BillingPage;
