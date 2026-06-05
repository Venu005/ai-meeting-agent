import { Skeleton } from '@repo/ui/components/skeleton';

const MeetingCardSkeleton = () => (
  <div className='bg-card/80 space-y-4 rounded-2xl border border-white/10 p-5'>
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <Skeleton className='h-5 w-2/3 max-w-xs' />
      <Skeleton className='h-6 w-20 rounded-full' />
    </div>
    <div className='flex flex-wrap gap-4'>
      <Skeleton className='h-4 w-32' />
      <Skeleton className='h-4 w-24' />
    </div>
    <div className='flex gap-2 border-t border-white/10 pt-4'>
      <Skeleton className='h-9 w-24 rounded-md' />
      <Skeleton className='h-9 w-20 rounded-md' />
    </div>
  </div>
);

export default MeetingCardSkeleton;
