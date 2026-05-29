'use client';

import { useUsage } from '@/queries/billing';
import { SubscriptionPlanEnum } from '@repo/shared-types/enums';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import { Skeleton } from '@repo/ui/components/skeleton';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const UsageBar = () => {
  const { data: usage, isLoading } = useUsage();

  if (isLoading) {
    return <Skeleton className='h-24 w-full rounded-lg' />;
  }

  if (!usage) {
    return null;
  }

  const progressValue =
    usage.minutesIncluded > 0 ? Math.min(100, (usage.minutesUsed / usage.minutesIncluded) * 100) : 0;
  const isLow = usage.minutesRemaining <= 2 && usage.minutesRemaining > 0;
  const isExhausted = usage.minutesRemaining <= 0;

  return (
    <div className='bg-card space-y-3 rounded-lg border p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-medium'>Meeting minutes</p>
          <p className='text-muted-foreground text-sm'>
            {usage.minutesUsed} / {usage.minutesIncluded} min used · {usage.plan} plan
          </p>
        </div>
        {(isExhausted || usage.plan === SubscriptionPlanEnum.FREE) && (
          <Button size='sm' asChild>
            <Link href='/settings/billing'>Upgrade</Link>
          </Button>
        )}
      </div>
      <Progress value={progressValue} className='h-2' />
      {(isLow || isExhausted) && (
        <Alert variant={isExhausted ? 'destructive' : 'default'}>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            {isExhausted
              ? 'You have no minutes remaining. Upgrade to schedule more meetings.'
              : `Only ${usage.minutesRemaining} minute${usage.minutesRemaining === 1 ? '' : 's'} left this period.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UsageBar;
