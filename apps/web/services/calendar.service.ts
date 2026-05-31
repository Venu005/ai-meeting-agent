import { ApiClient } from '@/lib/api-client';
import { Meeting } from '@repo/shared-types/schemas';

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  meetUrl: string;
  scheduledAt: string;
  endAt: string | null;
  hasBot: boolean;
}

export interface CalendarEventsResponse {
  connected: boolean;
  googleEmail: string;
  events: CalendarEvent[];
}

export class CalendarService {
  static async getConnectUrl() {
    return ApiClient.get<{ url: string }>('/api/calendar/connect');
  }

  static async listEvents() {
    return ApiClient.get<CalendarEventsResponse>('/api/calendar/events');
  }

  static async enableBot(eventId: string, calendarId: string) {
    const params = new URLSearchParams({ calendarId });
    return ApiClient.post<Meeting>(`/api/calendar/events/${encodeURIComponent(eventId)}/bot?${params.toString()}`);
  }
}
