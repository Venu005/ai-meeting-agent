import PlanCardSkeleton from '@/components/skeletons/PlanCardSkeleton';
import UsageBarSkeleton from '@/components/skeletons/UsageBarSkeleton';

const BillingSkeleton = () => (
  <div className='space-y-8'>
    <p className='text-muted-foreground text-sm'>Loading billing details…</p>
    <UsageBarSkeleton />
    <div className='grid gap-6 md:grid-cols-2'>
      <PlanCardSkeleton />
      <PlanCardSkeleton />
    </div>
  </div>
);

export default BillingSkeleton;
