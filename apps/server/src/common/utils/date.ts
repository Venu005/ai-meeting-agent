import { format, getYear, isValid, parse } from 'date-fns';

export const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const getTomorrow = (): Date => {
  const tomorrow = new Date(getToday());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

export const getTodayRange = (): { start: Date; end: Date } => {
  const start = getToday();
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const getDateRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const isWithinLastMinutes = (date: Date | null, minutes: number): boolean => {
  if (!date) return false;
  return new Date().getTime() - date.getTime() < minutes * 60 * 1000;
};

export const msToHours = (ms: number): number => Math.round(ms / (1000 * 60 * 60));

export const secondsToHours = (seconds: number): number => parseFloat((seconds / (60 * 60)).toFixed(2));

export const validFormats = [
  'M/d/yy',
  'M/d/yyyy',
  'MM/dd/yyyy',
  'M/dd/yyyy',
  'MM/d/yyyy',
  'MM/d/yy',
  'M/dd/yy',
  'MM/dd/yy',
];

export const validateDateFormat = (input: string): boolean => {
  return validFormats.some((fmt) => parse(input, fmt, new Date()));
};

/**
 * Normalizes a date string to a fixed format (MM/dd/yyyy)
 * @param input - The date string to normalize
 * @returns The normalized date string or null if the input is not a valid date
 */
export const normalizeDateFormat = (input: string, outputFormat: string): string | null => {
  for (const fmt of validFormats) {
    const parsed = parse(input, fmt, new Date());
    if (isValid(parsed)) {
      const year = getYear(parsed);
      if (year < 100) {
        parsed.setFullYear(2000 + year);
        return format(parsed, outputFormat);
      } else {
        return format(parsed, outputFormat);
      }
    }
  }

  return null;
};

/**
 * Returns the offset in minutes between the given IANA timezone and UTC.
 * @param timezone - IANA timezone string (e.g., "America/New_York")
 * @param date - Optional date (defaults to now)
 * @returns Offset in minutes from UTC (positive if ahead, negative if behind)
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: currentTimezone }));
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  // Offset in milliseconds
  const offsetMs = localDate.getTime() - utcDate.getTime();
  // Convert to minutes
  return Math.round(offsetMs / (1000 * 60));
}

export const convertToTimezone = (date: Date, timezone: string) => {
  const offset = getTimezoneOffset(timezone);
  return new Date(date.getTime() - offset * 60 * 1000);
};
