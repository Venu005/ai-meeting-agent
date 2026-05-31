import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MeetingStatus } from '@repo/db';
import { calendar_v3, google } from 'googleapis';
import { config } from 'src/common/config';
import { decrypt, encrypt } from 'src/common/utils/encryption';
import { upsertCalendarConnection } from './calendar-connection.helper';
import { CalendarEventRef, dedupeCalendarEvents } from './calendar-event-merge';
import { ListCalendarEventsParams, GetCalendarEventParams } from './calendar-google-request';
import { extractMeetUrl } from './extract-meet-url';
import { MeetingsService } from 'src/meetings/meetings.service';
import { PrismaService } from 'src/prisma/prisma.service';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];

const STATE_PURPOSE = 'calendar_oauth';
const DEFAULT_DURATION_MINUTES = 30;

type CalendarOAuthState = {
  sub: string;
  purpose: string;
};

type CalendarEventSummary = {
  id: string;
  calendarId: string;
  title: string;
  meetUrl: string;
  scheduledAt: string;
  endAt: string | null;
};

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly oauth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly meetingsService: MeetingsService
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      config.calendar.clientId,
      config.calendar.clientSecret,
      config.calendar.redirectUri
    );
  }

  getConnectUrl(userId: string, loginHint?: string): string {
    const state = this.jwtService.sign({ sub: userId, purpose: STATE_PURPOSE }, { expiresIn: '10m' });

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: CALENDAR_SCOPES,
      state,
      ...(loginHint ? { login_hint: loginHint } : {}),
    });
  }

  async handleCallback(code: string, state: string): Promise<string> {
    const userId = this.verifyOAuthState(state);

    const { tokens } = await this.oauth2Client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new BadRequestException('Google did not return required OAuth tokens');
    }

    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: this.oauth2Client, version: 'v2' });
    const { data: userInfo } = await oauth2.userinfo.get();
    const googleEmail = userInfo.email;
    if (!googleEmail) {
      throw new BadRequestException('Unable to retrieve Google account email');
    }

    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    await upsertCalendarConnection(this.prisma, userId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      googleEmail,
    });

    return `${config.urls.frontend}/calendar?connected=true`;
  }

  getCallbackErrorRedirectUrl(): string {
    return `${config.urls.frontend}/calendar?error=oauth_failed`;
  }

  async listEvents(userId: string) {
    const connection = await this.prisma.calendarConnection.findUnique({ where: { userId } });
    if (!connection) {
      throw new NotFoundException('Calendar not connected');
    }

    const calendar = await this.getCalendarClient(userId, connection);
    const calendarIds = await this.getReadableCalendarIds(calendar);

    const baseListParams: Omit<ListCalendarEventsParams, 'calendarId'> = {
      timeMin: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
      conferenceDataVersion: 1,
      showHiddenInvitations: true,
    };

    const rawEvents: CalendarEventRef[] = [];
    for (const calendarId of calendarIds) {
      const listParams: ListCalendarEventsParams = { ...baseListParams, calendarId };
      const response = await calendar.events.list(listParams);
      for (const event of response.data.items ?? []) {
        rawEvents.push({ event, calendarId });
      }
    }

    const uniqueEvents = dedupeCalendarEvents(rawEvents);
    this.logger.log(
      `Calendar sync for user ${userId}: ${uniqueEvents.length} upcoming event(s) across ${calendarIds.length} calendar(s)`
    );

    const meetEvents = uniqueEvents
      .map(({ event, calendarId }) => this.toCalendarEvent(event, calendarId))
      .filter((event): event is CalendarEventSummary => event !== null);

    if (uniqueEvents.length > 0 && meetEvents.length === 0) {
      this.logger.warn(
        `Calendar sync for user ${userId}: ${uniqueEvents.length} event(s) found but none had a detectable Google Meet link`
      );
    }

    const eventIds = meetEvents.map((event) => event.id);
    const existingMeetings =
      eventIds.length > 0
        ? await this.prisma.meeting.findMany({
            where: {
              userId,
              googleEventId: { in: eventIds },
              status: { not: MeetingStatus.CANCELLED },
            },
            select: { googleEventId: true },
          })
        : [];

    const botEventIds = new Set(
      existingMeetings.map((meeting) => meeting.googleEventId).filter((id): id is string => Boolean(id))
    );

    return {
      connected: true,
      googleEmail: connection.googleEmail,
      events: meetEvents.map((event) => ({
        ...event,
        hasBot: botEventIds.has(event.id),
      })),
    };
  }

  async enableBotForEvent(userId: string, eventId: string, calendarId?: string) {
    const connection = await this.prisma.calendarConnection.findUnique({ where: { userId } });
    if (!connection) {
      throw new NotFoundException('Calendar not connected');
    }

    const calendar = await this.getCalendarClient(userId, connection);
    const calendarIds = await this.getReadableCalendarIds(calendar);
    const { event } = await this.getCalendarEvent(calendar, calendarIds, eventId, calendarId);

    const parsed = this.toCalendarEvent(event, calendarId ?? 'primary');
    if (!parsed) {
      throw new BadRequestException('Event does not have a Google Meet link');
    }

    const existing = await this.prisma.meeting.findFirst({
      where: {
        userId,
        googleEventId: eventId,
        status: { not: MeetingStatus.CANCELLED },
      },
    });

    if (existing) {
      return this.meetingsService.findOne(userId, existing.id);
    }

    return this.meetingsService.createFromCalendarEvent(userId, {
      title: parsed.title,
      meetUrl: parsed.meetUrl,
      scheduledAt: parsed.scheduledAt,
      googleEventId: eventId,
      estimatedDurationMinutes: this.estimateDurationMinutes(event),
    });
  }

  private async getReadableCalendarIds(calendar: calendar_v3.Calendar): Promise<string[]> {
    const response = await calendar.calendarList.list({ minAccessRole: 'reader' });
    const ids = new Set<string>(['primary']);

    for (const item of response.data.items ?? []) {
      if (item.id && item.selected !== false) {
        ids.add(item.id);
      }
    }

    return [...ids];
  }

  private async getCalendarEvent(
    calendar: calendar_v3.Calendar,
    calendarIds: string[],
    eventId: string,
    preferredCalendarId?: string
  ): Promise<CalendarEventRef> {
    const lookupOrder = preferredCalendarId
      ? [preferredCalendarId, ...calendarIds.filter((id) => id !== preferredCalendarId)]
      : calendarIds;

    for (const calendarId of lookupOrder) {
      try {
        const getParams: GetCalendarEventParams = {
          calendarId,
          eventId,
          conferenceDataVersion: 1,
        };
        const { data } = await calendar.events.get(getParams);
        if (data.id) {
          return { event: data, calendarId };
        }
      } catch {
        continue;
      }
    }

    throw new NotFoundException('Calendar event not found');
  }

  private verifyOAuthState(state: string): string {
    try {
      const payload = this.jwtService.verify<CalendarOAuthState>(state);
      if (payload.purpose !== STATE_PURPOSE || !payload.sub) {
        throw new UnauthorizedException('Invalid OAuth state');
      }
      return payload.sub;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }
  }

  private async getCalendarClient(
    userId: string,
    connection: { id: string; accessToken: string; refreshToken: string; expiresAt: Date }
  ): Promise<calendar_v3.Calendar> {
    const accessToken = decrypt(connection.accessToken);
    const refreshToken = decrypt(connection.refreshToken);

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: connection.expiresAt.getTime(),
    });

    if (connection.expiresAt.getTime() <= Date.now() + 60_000) {
      await this.refreshTokens(userId, connection.id);
    }

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  private async refreshTokens(userId: string, connectionId: string): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      if (!credentials.access_token) {
        throw new Error('Missing access token after refresh');
      }

      const expiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : new Date(Date.now() + 3600 * 1000);

      await this.prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: encrypt(credentials.access_token),
          ...(credentials.refresh_token ? { refreshToken: encrypt(credentials.refresh_token) } : {}),
          expiresAt,
        },
      });

      this.oauth2Client.setCredentials(credentials);
    } catch (error) {
      this.logger.error(`Failed to refresh calendar tokens for user ${userId}`, error);
      throw new UnauthorizedException('Calendar connection expired; please reconnect');
    }
  }

  private toCalendarEvent(event: calendar_v3.Schema$Event, calendarId: string): CalendarEventSummary | null {
    const meetUrl = extractMeetUrl(event);
    if (!meetUrl || !event.id) {
      return null;
    }

    const start = event.start?.dateTime ?? event.start?.date;
    if (!start) {
      return null;
    }

    const end = event.end?.dateTime ?? event.end?.date ?? null;

    return {
      id: event.id,
      calendarId,
      title: event.summary ?? 'Untitled event',
      meetUrl,
      scheduledAt: new Date(start).toISOString(),
      endAt: end ? new Date(end).toISOString() : null,
    };
  }

  private estimateDurationMinutes(event: calendar_v3.Schema$Event): number {
    const start = event.start?.dateTime ?? event.start?.date;
    const end = event.end?.dateTime ?? event.end?.date;
    if (start && end) {
      const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
      if (minutes >= 1 && minutes <= 480) {
        return minutes;
      }
    }

    return DEFAULT_DURATION_MINUTES;
  }
}
