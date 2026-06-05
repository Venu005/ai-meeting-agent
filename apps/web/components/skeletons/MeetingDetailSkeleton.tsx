import { Skeleton } from '@repo/ui/components/skeleton';

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-1/2'] as const;

const MeetingDetailSkeleton = () => (
  <div className='space-y-8'>
    <Skeleton className='h-9 w-[120px] rounded-md' />

    <div className='bg-card/80 relative space-y-3 rounded-2xl border border-white/10 p-6 md:p-8'>
      <Skeleton className='absolute top-6 right-6 h-6 w-24 rounded-full' />
      <Skeleton className='h-4 w-20' />
      <Skeleton className='h-8 w-[70%] max-w-md' />
      <Skeleton className='h-4 w-48' />
    </div>

    <div className='flex gap-2'>
      <Skeleton className='h-11 w-28 rounded-xl' />
      <Skeleton className='h-11 w-28 rounded-xl' />
    </div>

    <div className='bg-card/80 space-y-3 rounded-2xl border border-white/10 p-6 md:p-8'>
      {LINE_WIDTHS.map((width, i) => (
        <Skeleton key={i} className={`h-4 ${width}`} />
      ))}
    </div>
  </div>
);

export default MeetingDetailSkeleton;
