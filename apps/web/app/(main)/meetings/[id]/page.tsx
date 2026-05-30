'use client';

import MeetingDetail from '@/components/meetings/MeetingDetail';
import { use } from 'react';

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

const MeetingDetailPage = ({ params }: MeetingDetailPageProps) => {
  const { id } = use(params);

  return <MeetingDetail meetingId={id} />;
};

export default MeetingDetailPage;
