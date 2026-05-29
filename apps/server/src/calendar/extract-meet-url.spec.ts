import { calendar_v3 } from 'googleapis';
import { extractMeetUrl, findMeetUrlInText, normalizeMeetUrl } from './extract-meet-url';

describe('extractMeetUrl', () => {
  it('returns hangoutLink when present', () => {
    const event: calendar_v3.Schema$Event = {
      hangoutLink: 'https://meet.google.com/abc-defg-hij',
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('returns conference entry point uri', () => {
    const event: calendar_v3.Schema$Event = {
      conferenceData: {
        entryPoints: [{ uri: 'https://meet.google.com/xyz-abcd-efg?authuser=0' }],
      },
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/xyz-abcd-efg');
  });

  it('builds meet url from conferenceId', () => {
    const event: calendar_v3.Schema$Event = {
      conferenceData: {
        conferenceId: 'abc-defg-hij',
      },
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('finds meet url in location', () => {
    const event: calendar_v3.Schema$Event = {
      location: 'Room 4 — https://meet.google.com/abc-defg-hij',
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('finds meet url in description', () => {
    const event: calendar_v3.Schema$Event = {
      description: 'Join at https://meet.google.com/abc-defg-hij thanks!',
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('finds bare meet url in location without https', () => {
    const event: calendar_v3.Schema$Event = {
      location: 'meet.google.com/yxg-kvgu-cgi',
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/yxg-kvgu-cgi');
  });

  it('builds meet url from entry point meetingCode', () => {
    const event: calendar_v3.Schema$Event = {
      conferenceData: {
        entryPoints: [{ meetingCode: 'yxg-kvgu-cgi', entryPointType: 'video' }],
      },
    };

    expect(extractMeetUrl(event)).toBe('https://meet.google.com/yxg-kvgu-cgi');
  });

  it('returns null when no meet link exists', () => {
    const event: calendar_v3.Schema$Event = {
      summary: 'Standup',
      location: 'Conference room A',
    };

    expect(extractMeetUrl(event)).toBeNull();
  });
});

describe('findMeetUrlInText', () => {
  it('normalizes trailing punctuation', () => {
    expect(findMeetUrlInText('Link: https://meet.google.com/abc-defg-hij.')).toBe(
      'https://meet.google.com/abc-defg-hij'
    );
  });
});

describe('normalizeMeetUrl', () => {
  it('strips query params', () => {
    expect(normalizeMeetUrl('https://meet.google.com/abc-defg-hij?authuser=1')).toBe(
      'https://meet.google.com/abc-defg-hij'
    );
  });
});
