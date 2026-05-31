import { Skeleton } from '@repo/ui/components/skeleton';

const UsageBarSkeleton = () => (
  <div className='bg-card space-y-4 rounded-xl border p-5'>
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <div className='flex items-start gap-3'>
        <Skeleton className='h-10 w-10 shrink-0 rounded-lg' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <Skeleton className='h-9 w-20 rounded-md' />
    </div>
    <Skeleton className='h-2.5 w-full rounded-full' />
  </div>
);

export default UsageBarSkeleton;
