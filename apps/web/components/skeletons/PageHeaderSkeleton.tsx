import { Skeleton } from '@repo/ui/components/skeleton';

type PageHeaderSkeletonProps = {
  showAction?: boolean;
};

const PageHeaderSkeleton = ({ showAction = false }: PageHeaderSkeletonProps) => (
  <div className='flex flex-wrap items-start justify-between gap-4'>
    <div className='space-y-2'>
      <Skeleton className='h-8 w-56 max-w-full' />
      <Skeleton className='h-4 w-80 max-w-full' />
    </div>
    {showAction && <Skeleton className='h-10 w-40 rounded-md' />}
  </div>
);

export default PageHeaderSkeleton;
