import MeetingCardSkeleton from '@/components/skeletons/MeetingCardSkeleton';
import PageHeaderSkeleton from '@/components/skeletons/PageHeaderSkeleton';
import UsageBarSkeleton from '@/components/skeletons/UsageBarSkeleton';
import { Skeleton } from '@repo/ui/components/skeleton';

const DashboardSkeleton = () => (
  <div className='space-y-8'>
    <PageHeaderSkeleton showAction />

    <div className='grid gap-4 sm:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='bg-card space-y-3 rounded-xl border p-5'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-9 w-12' />
        </div>
      ))}
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
