import { calendar_v3 } from 'googleapis';

/** Google Calendar API supports this param; googleapis types omit it. */
type ConferenceDataVersionParam = {
  conferenceDataVersion?: number;
};

type HiddenInvitationsParam = {
  showHiddenInvitations?: boolean;
};

export type ListCalendarEventsParams = calendar_v3.Params$Resource$Events$List &
  ConferenceDataVersionParam &
  HiddenInvitationsParam;

export type GetCalendarEventParams = calendar_v3.Params$Resource$Events$Get & ConferenceDataVersionParam;
