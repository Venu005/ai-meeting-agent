import { Skeleton } from '@repo/ui/components/skeleton';

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-4/5', 'w-full', 'w-3/4', 'w-5/6', 'w-2/3', 'w-1/2'] as const;

const MeetingDetailSkeleton = () => (
  <div className='space-y-6'>
    <Skeleton className='h-9 w-[120px] rounded-md' />

    <div className='bg-card relative space-y-3 rounded-xl border p-6'>
      <Skeleton className='absolute top-6 right-6 h-6 w-24 rounded-full' />
      <Skeleton className='h-8 w-[70%] max-w-md' />
      <Skeleton className='h-4 w-48' />
    </div>

    <div className='flex gap-2'>
      <Skeleton className='h-10 w-28 rounded-md' />
      <Skeleton className='h-10 w-28 rounded-md' />
    </div>

    <div className='bg-card space-y-3 rounded-xl border p-6'>
      {LINE_WIDTHS.map((width, i) => (
        <Skeleton key={i} className={`h-4 ${width}`} />
      ))}
    </div>
  </div>
);

export default MeetingDetailSkeleton;
