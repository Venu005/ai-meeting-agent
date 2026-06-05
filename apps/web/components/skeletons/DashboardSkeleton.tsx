import MeetingCardSkeleton from '@/components/skeletons/MeetingCardSkeleton';
import PageHeaderSkeleton from '@/components/skeletons/PageHeaderSkeleton';
import UsageBarSkeleton from '@/components/skeletons/UsageBarSkeleton';
import { Skeleton } from '@repo/ui/components/skeleton';

const DashboardSkeleton = () => (
  <div className='space-y-10'>
    <PageHeaderSkeleton showAction />

    <div className='grid gap-4 lg:grid-cols-12'>
      <div className='bg-card/80 space-y-4 rounded-2xl border border-white/10 p-6 lg:col-span-5 lg:p-8'>
        <Skeleton className='h-6 w-40 rounded-full' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-9 w-32 rounded-md' />
      </div>

      <div className='grid gap-4 sm:grid-cols-3 lg:col-span-7'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='bg-card/80 space-y-3 rounded-2xl border border-white/10 p-5'>
            <Skeleton className='h-8 w-24' />
            <Skeleton className='h-10 w-12' />
          </div>
        ))}
      </div>
    </div>

    <UsageBarSkeleton />

    <section className='space-y-4'>
      <Skeleton className='h-6 w-44' />
      <div className='grid gap-4'>
        <MeetingCardSkeleton />
        <MeetingCardSkeleton />
      </div>
    </section>

    <section className='space-y-4'>
      <Skeleton className='h-6 w-40' />
      <div className='grid gap-4'>
        <MeetingCardSkeleton />
        <MeetingCardSkeleton />
      </div>
    </section>
  </div>
);

export default DashboardSkeleton;
