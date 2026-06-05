import { Skeleton } from '@repo/ui/components/skeleton';

const PlanCardSkeleton = () => (
  <div className='bg-card/80 flex h-full flex-col rounded-2xl border border-white/10 p-6 md:p-8'>
    <div className='mb-6 flex flex-wrap items-start justify-between gap-3'>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-16' />
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
        <Skeleton className='h-4 w-56' />
      </div>
      <Skeleton className='h-6 w-14 rounded-full' />
    </div>
    <ul className='mb-6 space-y-3'>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className='flex items-center gap-2'>
          <Skeleton className='h-5 w-5 shrink-0 rounded-full' />
          <Skeleton className='h-4 w-48' />
        </li>
      ))}
    </ul>
    <Skeleton className='mt-auto h-10 w-full rounded-md' />
  </div>
);

export default PlanCardSkeleton;
