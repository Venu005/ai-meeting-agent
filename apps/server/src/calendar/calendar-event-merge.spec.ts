import { CalendarEventRef, dedupeCalendarEvents } from './calendar-event-merge';

describe('dedupeCalendarEvents', () => {
  it('keeps invited copy with meet link over organizer calendar copy without one', () => {
    const invitedCopy: CalendarEventRef = {
      calendarId: 'primary',
      event: {
        id: 'invited-event-id',
        iCalUID: 'shared-ical-uid',
        summary: 'Team sync',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        start: { dateTime: '2026-06-01T10:00:00+05:30' },
        attendees: [{ self: true, responseStatus: 'needsAction' }],
      },
    };

    const sparseCopy: CalendarEventRef = {
      calendarId: 'organizer@example.com',
      event: {
        id: 'organizer-event-id',
        iCalUID: 'shared-ical-uid',
        summary: 'Team sync',
        start: { dateTime: '2026-06-01T10:00:00+05:30' },
      },
    };

    const result = dedupeCalendarEvents([sparseCopy, invitedCopy]);

    expect(result).toHaveLength(1);
    expect(result[0]?.event.id).toBe('invited-event-id');
    expect(result[0]?.calendarId).toBe('primary');
  });

  it('skips declined invitations', () => {
    const declined: CalendarEventRef = {
      calendarId: 'primary',
      event: {
        id: 'declined-event',
        iCalUID: 'declined-uid',
        summary: 'Declined sync',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        start: { dateTime: '2026-06-01T10:00:00+05:30' },
        attendees: [{ self: true, responseStatus: 'declined' }],
      },
    };

    expect(dedupeCalendarEvents([declined])).toHaveLength(0);
  });
});
