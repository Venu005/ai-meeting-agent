'use client';

import EmptyMessage from '@/components/general/EmptyMessage';
import MeetingNotesMarkdown, { MeetingNotesInlineMarkdown } from '@/components/meetings/MeetingNotesMarkdown';
import { getPersonaDocTitle } from '@/components/meetings/persona-doc-title';
import { UserPersonaEnum } from '@repo/shared-types/enums';

type MeetingNotesRendererProps = {
  keyPoints: string[] | null;
  notes: string | null;
  structuredDoc: string | null;
  persona: UserPersonaEnum | null;
};

const MeetingNotesRenderer = ({ keyPoints, notes, structuredDoc, persona }: MeetingNotesRendererProps) => {
  const hasKeyPoints = keyPoints != null && keyPoints.length > 0;
  const hasNotes = Boolean(notes?.trim());
  const hasStructuredDoc = Boolean(structuredDoc?.trim());

  if (!hasKeyPoints && !hasNotes && !hasStructuredDoc) {
    return <EmptyMessage message='No notes available' />;
  }

  return (
    <div className='bg-card space-y-6 rounded-xl border p-6'>
      <h2 className='text-xl font-semibold tracking-tight'>Generated notes</h2>

      {hasKeyPoints && (
        <div className='space-y-3'>
          <h3 className='text-lg font-semibold tracking-tight'>Key Takeaways</h3>
          <ul className='space-y-3'>
            {keyPoints!.map((point, index) => (
              <li key={`${index}-${point.slice(0, 24)}`} className='flex gap-3 text-sm'>
                <span className='bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                  {index + 1}
                </span>
                <MeetingNotesInlineMarkdown message={point} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasNotes && <MeetingNotesMarkdown message={notes!} />}

      {hasStructuredDoc && (
        <>
          <hr className='border-border/60 my-8' />
          <h2 className='text-lg font-semibold tracking-tight'>{getPersonaDocTitle(persona)}</h2>
          <MeetingNotesMarkdown message={structuredDoc!} />
        </>
      )}
    </div>
  );
};

export default MeetingNotesRenderer;
