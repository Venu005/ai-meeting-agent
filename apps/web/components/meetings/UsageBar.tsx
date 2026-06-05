'use client';

import { useUsage } from '@/queries/billing';
import { SubscriptionPlanEnum } from '@repo/shared-types/enums';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { Progress } from '@repo/ui/components/progress';
import UsageBarSkeleton from '@/components/skeletons/UsageBarSkeleton';
import { AlertTriangle, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@repo/ui/lib/utils';

const UsageBar = () => {
  const { data: usage, isLoading } = useUsage();

  if (isLoading) {
    return <UsageBarSkeleton />;
  }

  if (!usage) {
    return null;
  }

  const progressValue =
    usage.minutesIncluded > 0 ? Math.min(100, (usage.minutesUsed / usage.minutesIncluded) * 100) : 0;
  const isLow = usage.minutesRemaining <= 2 && usage.minutesRemaining > 0;
  const isExhausted = usage.minutesRemaining <= 0;
  const isPro = usage.plan === SubscriptionPlanEnum.PRO;

  return (
    <div
      className={cn(
        'bg-card/80 space-y-4 rounded-2xl border border-white/10 p-5 backdrop-blur-sm md:p-6',
        isExhausted && 'border-destructive/30',
      )}
    >
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex items-start gap-4'>
          <div className='bg-primary/10 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-xl'>
            <Clock className='h-5 w-5' />
          </div>
          <div>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='font-medium'>Meeting minutes</p>
              {isPro && (
                <span className='bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'>
                  <Zap className='h-3 w-3' />
                  Pro
                </span>
              )}
            </div>
            <p className='text-muted-foreground text-sm'>
              <span className='text-foreground font-serif-accent text-lg'>{usage.minutesUsed}</span>
              {' / '}
              {usage.minutesIncluded} min used
              {usage.periodEnd && (
                <span className='text-muted-foreground'>
                  {' '}
                  · resets {new Date(usage.periodEnd).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
        {(isExhausted || !isPro) && (
          <Button size='sm' asChild className='shadow-md shadow-black/20'>
            <Link href='/settings/billing'>Upgrade</Link>
          </Button>
        )}
      </div>

      <div className='space-y-2'>
        <div className='flex justify-between text-xs'>
          <span className='text-muted-foreground'>{Math.round(progressValue)}% used</span>
          <span className='text-muted-foreground'>{usage.minutesRemaining} min remaining</span>
        </div>
        <Progress value={progressValue} className='h-2' />
      </div>

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
