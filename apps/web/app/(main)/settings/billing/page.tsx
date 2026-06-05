'use client';

import LoadingButton from '@/components/general/LoadingButton';
import PageHeader from '@/components/layout/PageHeader';
import UsageBar from '@/components/meetings/UsageBar';
import AppPanel from '@/components/layout/AppPanel';
import BillingSkeleton from '@/components/skeletons/BillingSkeleton';
import { useBillingPortal, useCheckout, useUsage } from '@/queries/billing';
import { SubscriptionPlanEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Check, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { cn } from '@repo/ui/lib/utils';

const PRO_FEATURES = ['300 meeting minutes per period', 'Priority processing', 'All persona templates'] as const;
const FREE_FEATURES = ['10 meeting minutes per period', 'Basic notes & key points', 'Google Calendar sync'] as const;

type PlanCardProps = {
  title: string;
  description: string;
  priceLabel: string;
  features: readonly string[];
  isCurrent: boolean;
  featured?: boolean;
  action: ReactNode;
};

const PlanCard = ({ title, description, priceLabel, features, isCurrent, featured, action }: PlanCardProps) => {
  return (
    <AppPanel
      glow={featured}
      className={cn(
        'flex h-full flex-col p-6 md:p-8',
        featured && 'border-primary/25 bg-primary/[0.03]',
        isCurrent && !featured && 'ring-primary/20 ring-1',
      )}
    >
      <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold tracking-tight'>{title}</h2>
            {isCurrent && <Badge variant='secondary'>Current</Badge>}
            {featured && (
              <Badge className='gap-1'>
                <Sparkles className='h-3 w-3' />
                Popular
              </Badge>
            )}
          </div>
          <p className='text-muted-foreground text-sm leading-relaxed'>{description}</p>
        </div>
        <Badge variant={featured ? 'default' : 'secondary'} className='text-sm'>
          {priceLabel}
        </Badge>
      </div>

      <ul className='mb-6 space-y-3'>
        {features.map((feature) => (
          <li key={feature} className='flex items-center gap-2.5 text-sm'>
            <div className='bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full'>
              <Check className='h-3 w-3' />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      <div className='mt-auto'>{action}</div>
    </AppPanel>
  );
};

const BillingPageContent = () => {
  const searchParams = useSearchParams();
  const { data: usage, isLoading, refetch } = useUsage();
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
    <div className='space-y-10'>
      <PageHeader eyebrow='Account' title='Billing' description='Manage your plan and meeting minute allowance.' />

      {isLoading ? (
        <BillingSkeleton />
      ) : (
        <>
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
              featured
              action={
                isPro ? (
                  <LoadingButton variant='outline' isLoading={isPortalPending} onClick={() => openPortal()}>
                    Manage subscription
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    isLoading={isCheckoutPending}
                    onClick={() => checkout()}
                    className='shadow-lg shadow-black/20'
                  >
                    Upgrade to Pro
                  </LoadingButton>
                )
              }
            />
          </div>
        </>
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
