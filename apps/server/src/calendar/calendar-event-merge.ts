import { calendar_v3 } from 'googleapis';
import { extractMeetUrl } from './extract-meet-url';

export type CalendarEventRef = {
  event: calendar_v3.Schema$Event;
  calendarId: string;
};

function scoreCalendarEvent(event: calendar_v3.Schema$Event): number {
  let score = 0;

  if (extractMeetUrl(event)) {
    score += 10;
  }
  if (event.hangoutLink) {
    score += 5;
  }
  if (event.conferenceData?.entryPoints?.length) {
    score += 3;
  }
  if (event.description?.includes('meet.google.com') || event.location?.includes('meet.google.com')) {
    score += 2;
  }

  return score;
}

export function dedupeCalendarEvents(items: CalendarEventRef[]): CalendarEventRef[] {
  const byKey = new Map<string, CalendarEventRef>();

  for (const item of items) {
    if (item.event.status === 'cancelled') {
      continue;
    }

    const selfAttendee = item.event.attendees?.find((attendee) => attendee.self);
    if (selfAttendee?.responseStatus === 'declined') {
      continue;
    }

    const key = item.event.iCalUID ?? item.event.id;
    if (!key) {
      continue;
    }

    const existing = byKey.get(key);
    if (!existing || scoreCalendarEvent(item.event) > scoreCalendarEvent(existing.event)) {
      byKey.set(key, item);
    }
  }

  return [...byKey.values()].sort((a, b) => {
    const aStart = a.event.start?.dateTime ?? a.event.start?.date ?? '';
    const bStart = b.event.start?.dateTime ?? b.event.start?.date ?? '';
    return aStart.localeCompare(bStart);
  });
}
