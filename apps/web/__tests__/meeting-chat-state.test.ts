import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { resolveMeetingChatState } from '@/components/meetings/meeting-chat-state';

describe('resolveMeetingChatState', () => {
  it('disables chat for scheduled-like states', () => {
    const scheduled = resolveMeetingChatState({ status: MeetingStatusEnum.SCHEDULED });
    const botJoining = resolveMeetingChatState({ status: MeetingStatusEnum.BOT_JOINING });
    const inProgress = resolveMeetingChatState({ status: MeetingStatusEnum.IN_PROGRESS });

    expect(scheduled).toEqual({
      enabled: false,
      reason: 'Meeting is not ready for questions yet.',
    });
    expect(botJoining).toEqual({
      enabled: false,
      reason: 'Meeting is not ready for questions yet.',
    });
    expect(inProgress).toEqual({
      enabled: false,
      reason: 'Meeting is not ready for questions yet.',
    });
  });

  it('disables chat while notes are processing', () => {
    const result = resolveMeetingChatState({ status: MeetingStatusEnum.PROCESSING });

    expect(result).toEqual({
      enabled: false,
      reason: 'Notes are still processing. Try again in a few minutes.',
    });
  });

  it('disables chat for completed meetings without content', () => {
    const result = resolveMeetingChatState({
      status: MeetingStatusEnum.COMPLETED,
      notes: null,
      transcript: null,
      structuredDoc: null,
      keyPoints: null,
    });

    expect(result).toEqual({
      enabled: false,
      reason: 'No notes or transcript available for this meeting yet.',
    });
  });

  it('enables chat for completed meetings with content', () => {
    const notesResult = resolveMeetingChatState({
      status: MeetingStatusEnum.COMPLETED,
      notes: 'Action items captured',
    });
    const transcriptResult = resolveMeetingChatState({
      status: MeetingStatusEnum.COMPLETED,
      transcript: 'Discussion transcript',
    });
    const structuredDocResult = resolveMeetingChatState({
      status: MeetingStatusEnum.COMPLETED,
      structuredDoc: '## PRD',
    });
    const keyPointsResult = resolveMeetingChatState({
      status: MeetingStatusEnum.COMPLETED,
      keyPoints: ['Ship beta by Friday'],
    });

    expect(notesResult).toEqual({ enabled: true, reason: null });
    expect(transcriptResult).toEqual({ enabled: true, reason: null });
    expect(structuredDocResult).toEqual({ enabled: true, reason: null });
    expect(keyPointsResult).toEqual({ enabled: true, reason: null });
  });

  it('disables chat for failed or cancelled meetings', () => {
    const failed = resolveMeetingChatState({ status: MeetingStatusEnum.FAILED });
    const cancelled = resolveMeetingChatState({ status: MeetingStatusEnum.CANCELLED });

    expect(failed).toEqual({
      enabled: false,
      reason: 'This meeting is not available for Q&A.',
    });
    expect(cancelled).toEqual({
      enabled: false,
      reason: 'This meeting is not available for Q&A.',
    });
  });
});
