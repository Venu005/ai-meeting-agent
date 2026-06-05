import { Skeleton } from '@repo/ui/components/skeleton';

const UsageBarSkeleton = () => (
  <div className='bg-card/80 space-y-4 rounded-2xl border border-white/10 p-5 md:p-6'>
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex items-start gap-4'>
        <Skeleton className='h-11 w-11 shrink-0 rounded-xl' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-5 w-48' />
        </div>
      </div>
      <Skeleton className='h-9 w-20 rounded-md' />
    </div>
    <Skeleton className='h-2 w-full rounded-full' />
  </div>
);

export default UsageBarSkeleton;
