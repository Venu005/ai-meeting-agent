import { randomBytes } from 'crypto';

function randomId(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

export function generateSlug(name: string): string {
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 6–8 chars
  const length = 6 + Math.floor(Math.random() * 3);
  const unique = randomId(length);

  return `${cleaned}-${unique}`;
}

export const enumToText = (enumValue?: string): string => {
  if (!enumValue) return '';
  const values = enumValue.split('_');
  return values.join(' ');
};

export function generateRandomNumber(length = 6): string {
  const digits = '0123456789';
  const bytes = randomBytes(length);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits[bytes[i] % digits.length];
  }

  return result;
}
