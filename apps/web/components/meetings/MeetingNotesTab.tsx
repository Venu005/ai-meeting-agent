'use client';

import MeetingNotesRenderer from '@/components/meetings/MeetingNotesRenderer';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingNotesTabProps {
  notes: string | null;
  structuredDoc: string | null;
  keyPoints: string[] | null;
}

const MeetingNotesTab = ({ notes, structuredDoc, keyPoints }: MeetingNotesTabProps) => {
  const user = useAuth();

  return (
    <MeetingNotesRenderer
      keyPoints={keyPoints}
      notes={notes}
      structuredDoc={structuredDoc}
      persona={user?.persona ?? null}
    />
  );
};

export default MeetingNotesTab;
