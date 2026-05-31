import { calendar_v3 } from 'googleapis';

const MEET_URL_IN_TEXT = /(?:https?:\/\/)?(?:www\.)?meet\.google\.com\/(?:lookup\/)?[a-z0-9-]+(?:\/[a-z0-9-]+)*/i;

const MEET_CONFERENCE_ID = /^[a-z0-9]+(-[a-z0-9]+)+$/i;

export function findMeetUrlInText(text?: string | null): string | null {
  if (!text) {
    return null;
  }

  const match = text.match(MEET_URL_IN_TEXT);
  if (!match?.[0]) {
    return null;
  }

  const raw = match[0];
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`;
  return normalizeMeetUrl(withProtocol);
}

export function normalizeMeetUrl(url: string): string {
  return url.replace(/[.,>)\]"']+$/, '').split('?')[0] ?? url;
}

function meetUrlFromConferenceId(conferenceId: string): string | null {
  if (!MEET_CONFERENCE_ID.test(conferenceId)) {
    return null;
  }

  return `https://meet.google.com/${conferenceId.toLowerCase()}`;
}

export function extractMeetUrl(event: calendar_v3.Schema$Event): string | null {
  if (event.hangoutLink?.includes('meet.google.com')) {
    return normalizeMeetUrl(event.hangoutLink);
  }

  for (const entry of event.conferenceData?.entryPoints ?? []) {
    if (entry.uri?.includes('meet.google.com')) {
      return normalizeMeetUrl(entry.uri);
    }

    if (entry.meetingCode && MEET_CONFERENCE_ID.test(entry.meetingCode)) {
      const fromCode = meetUrlFromConferenceId(entry.meetingCode);
      if (fromCode) {
        return fromCode;
      }
    }
  }

  const conferenceId = event.conferenceData?.conferenceId;
  if (conferenceId) {
    const fromConferenceId = meetUrlFromConferenceId(conferenceId);
    if (fromConferenceId) {
      return fromConferenceId;
    }
  }

  return findMeetUrlInText(event.location) ?? findMeetUrlInText(event.description);
}
