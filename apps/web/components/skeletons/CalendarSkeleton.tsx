import { Skeleton } from '@repo/ui/components/skeleton';

const CalendarEventSkeleton = () => (
  <div className='bg-card space-y-4 rounded-xl border p-6'>
    <div className='flex items-start justify-between gap-4'>
      <div className='min-w-0 flex-1 space-y-2'>
        <Skeleton className='h-5 w-3/5 max-w-sm' />
        <Skeleton className='h-4 w-2/5 max-w-xs' />
      </div>
      <Skeleton className='h-6 w-16 shrink-0 rounded-full' />
    </div>
    <Skeleton className='h-8 w-32 rounded-md' />
  </div>
);

const CalendarSkeleton = () => (
  <div className='space-y-4'>
    <Skeleton className='h-4 w-[35%]' />
    <div className='grid gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <CalendarEventSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default CalendarSkeleton;
