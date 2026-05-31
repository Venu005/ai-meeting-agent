import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MeetingNotesRenderer from '@/components/meetings/MeetingNotesRenderer';
import {
  FIXTURE_KEY_POINTS,
  FIXTURE_NOTES,
  FIXTURE_STRUCTURED_DOC,
} from '@/components/meetings/meeting-notes-fixtures';
import { UserPersonaEnum } from '@repo/shared-types/enums';

describe('MeetingNotesRenderer', () => {
  it('renders unified layout with all sections', () => {
    render(
      <MeetingNotesRenderer
        keyPoints={FIXTURE_KEY_POINTS}
        notes={FIXTURE_NOTES}
        structuredDoc={FIXTURE_STRUCTURED_DOC}
        persona={UserPersonaEnum.PRODUCT_MANAGER}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Generated notes' })).toBeInTheDocument();
    expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Topics Discussed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Questions & Answers' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next Steps & Action Items' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'PRD' })).toBeInTheDocument();
  });

  it('omits empty sections', () => {
    render(<MeetingNotesRenderer keyPoints={null} notes={FIXTURE_NOTES} structuredDoc={null} persona={null} />);

    expect(screen.queryByText('Key Takeaways')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'PRD' })).not.toBeInTheDocument();
  });
});
