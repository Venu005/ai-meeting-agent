'use client';

import MeetingDetail from '@/components/meetings/MeetingDetail';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

const MeetingDetailPage = ({ params }: MeetingDetailPageProps) => {
  const { id } = use(params);

  return (
    <div className='space-y-6'>
      <Button variant='ghost' size='sm' asChild>
        <Link href='/dashboard'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to dashboard
        </Link>
      </Button>
      <MeetingDetail meetingId={id} />
    </div>
  );
};

export default MeetingDetailPage;
