'use client';

import LoadingButton from '@/components/general/LoadingButton';
import UsageBar from '@/components/meetings/UsageBar';
import { useBillingPortal, useCheckout, useUsage } from '@/queries/billing';
import { SubscriptionPlanEnum } from '@repo/shared-types/enums';
import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { toast } from 'sonner';

const BillingPageContent = () => {
  const searchParams = useSearchParams();
  const { data: usage } = useUsage();
  const { mutate: checkout, isPending: isCheckoutPending } = useCheckout();
  const { mutate: openPortal, isPending: isPortalPending } = useBillingPortal();

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully');
    }
    if (searchParams.get('canceled') === 'true') {
      toast.message('Checkout canceled');
    }
  }, [searchParams]);

  const isPro = usage?.plan === SubscriptionPlanEnum.PRO;

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Billing</h1>
        <p className='text-muted-foreground text-sm'>Manage your plan and meeting minute allowance.</p>
      </div>

      <UsageBar />

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle>Current plan</CardTitle>
            <Badge variant={isPro ? 'default' : 'secondary'}>{usage?.plan ?? 'FREE'}</Badge>
          </div>
          <CardDescription>
            {isPro
              ? 'Pro includes 300 meeting minutes per billing period.'
              : 'Free includes 10 meeting minutes per period. Upgrade for more.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-wrap gap-3'>
          {!isPro && (
            <LoadingButton isLoading={isCheckoutPending} onClick={() => checkout()}>
              Upgrade to Pro
            </LoadingButton>
          )}
          {isPro && (
            <LoadingButton variant='outline' isLoading={isPortalPending} onClick={() => openPortal()}>
              Manage subscription
            </LoadingButton>
          )}
          {!isPro && (
            <p className='text-muted-foreground w-full text-xs'>
              Period ends {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString() : '—'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BillingPage = () => (
  <Suspense fallback={null}>
    <BillingPageContent />
  </Suspense>
);

export default BillingPage;
