import { MeetingStatusEnum } from '@repo/shared-types/enums';
import { Meeting } from '@repo/shared-types/schemas';

const MEETING_CHAT_REASONS = {
  NOT_READY: 'Meeting is not ready for questions yet.',
  PROCESSING: 'Notes are still processing. Try again in a few minutes.',
  NO_CONTENT: 'No notes or transcript available for this meeting yet.',
  UNAVAILABLE: 'This meeting is not available for Q&A.',
} as const;

type MeetingChatStateInput = Pick<Meeting, 'status' | 'notes' | 'transcript' | 'structuredDoc' | 'keyPoints'>;

export interface MeetingChatAvailabilityState {
  enabled: boolean;
  reason: string | null;
}

const hasTextContent = (value: string | null | undefined): boolean => {
  return Boolean(value?.trim());
};

const hasAnyMeetingContent = (meeting: MeetingChatStateInput): boolean => {
  return (
    hasTextContent(meeting.notes) ||
    hasTextContent(meeting.transcript) ||
    hasTextContent(meeting.structuredDoc) ||
    Boolean(meeting.keyPoints?.length)
  );
};

export const resolveMeetingChatState = (meeting: MeetingChatStateInput): MeetingChatAvailabilityState => {
  if (
    meeting.status === MeetingStatusEnum.SCHEDULED ||
    meeting.status === MeetingStatusEnum.BOT_JOINING ||
    meeting.status === MeetingStatusEnum.IN_PROGRESS
  ) {
    return { enabled: false, reason: MEETING_CHAT_REASONS.NOT_READY };
  }

  if (meeting.status === MeetingStatusEnum.PROCESSING) {
    return { enabled: false, reason: MEETING_CHAT_REASONS.PROCESSING };
  }

  if (meeting.status === MeetingStatusEnum.FAILED || meeting.status === MeetingStatusEnum.CANCELLED) {
    return { enabled: false, reason: MEETING_CHAT_REASONS.UNAVAILABLE };
  }

  if (meeting.status === MeetingStatusEnum.COMPLETED) {
    return hasAnyMeetingContent(meeting)
      ? { enabled: true, reason: null }
      : { enabled: false, reason: MEETING_CHAT_REASONS.NO_CONTENT };
  }

  return { enabled: false, reason: MEETING_CHAT_REASONS.UNAVAILABLE };
};
