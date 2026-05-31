import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import BillingSkeleton from '@/components/skeletons/BillingSkeleton';
import CalendarSkeleton from '@/components/skeletons/CalendarSkeleton';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import MeetingDetailSkeleton from '@/components/skeletons/MeetingDetailSkeleton';

describe('Skeleton components', () => {
  it.each([
    ['DashboardSkeleton', DashboardSkeleton],
    ['CalendarSkeleton', CalendarSkeleton],
    ['MeetingDetailSkeleton', MeetingDetailSkeleton],
    ['BillingSkeleton', BillingSkeleton],
  ])('%s renders without throwing', (_name, Component) => {
    expect(() => render(<Component />)).not.toThrow();
  });
});
