'use client';

import CustomMarkdown from '@/components/chat/CustomMarkdown';
import EmptyMessage from '@/components/general/EmptyMessage';

interface MeetingNotesTabProps {
  notes: string | null;
  structuredDoc: string | null;
  keyPoints: string[] | null;
}

const MeetingNotesTab = ({ notes, structuredDoc, keyPoints }: MeetingNotesTabProps) => {
  const hasKeyPoints = keyPoints != null && keyPoints.length > 0;
  const hasNotes = Boolean(notes?.trim());
  const hasStructuredDoc = Boolean(structuredDoc?.trim());

  if (!hasKeyPoints && !hasNotes && !hasStructuredDoc) {
    return <EmptyMessage message='No notes available' />;
  }

  return (
    <div className='bg-card space-y-8 rounded-xl border p-6'>
      {hasKeyPoints && (
        <section className='space-y-3'>
          <h2 className='text-lg font-semibold tracking-tight'>Key takeaways</h2>
          <ul className='space-y-3'>
            {keyPoints!.map((point, index) => (
              <li key={`${index}-${point.slice(0, 20)}`} className='flex gap-3 text-sm'>
                <span className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                  {index + 1}
                </span>
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasNotes && (
        <section className='space-y-3'>
          <h2 className='text-lg font-semibold tracking-tight'>Meeting notes</h2>
          <CustomMarkdown message={notes!} />
        </section>
      )}

      {hasStructuredDoc && (
        <section className='space-y-3'>
          <h2 className='text-lg font-semibold tracking-tight'>Structured document</h2>
          <CustomMarkdown message={structuredDoc!} />
        </section>
      )}
    </div>
  );
};

export default MeetingNotesTab;
