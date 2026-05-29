import { z } from 'zod';
import { MeetingSourceEnum, MeetingStatusEnum } from '../enums';

const googleMeetUrlRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i;

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  meetUrl: z.string().regex(googleMeetUrlRegex, 'Must be a valid Google Meet URL'),
  scheduledAt: z.string().datetime({ message: 'Invalid date/time' }),
  estimatedDurationMinutes: z.number().int().min(1).max(480).default(30),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const meetingSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  meetUrl: z.string(),
  scheduledAt: z.string(),
  durationMinutes: z.number().nullable(),
  status: z.nativeEnum(MeetingStatusEnum),
  source: z.nativeEnum(MeetingSourceEnum),
  notes: z.string().nullable(),
  structuredDoc: z.string().nullable(),
  keyPoints: z.array(z.string()).nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Meeting = z.infer<typeof meetingSchema>;
