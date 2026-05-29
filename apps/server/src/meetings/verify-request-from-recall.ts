import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

export type RecallWebhookHeaders = Record<string, string>;

export class RecallWebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecallWebhookVerificationError';
  }
}

export function normalizeRecallWebhookHeaders(
  headers: Record<string, string | string[] | undefined>
): RecallWebhookHeaders {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value) ? value.join(',') : (value ?? ''),
    ])
  );
}

export function verifyRequestFromRecall(args: {
  secret: string;
  headers: RecallWebhookHeaders;
  payload: string | Buffer | null;
}): void {
  const { secret, headers, payload } = args;
  const msgId = headers['webhook-id'] ?? headers['svix-id'];
  const msgTimestamp = headers['webhook-timestamp'] ?? headers['svix-timestamp'];
  const msgSignature = headers['webhook-signature'] ?? headers['svix-signature'];

  if (!secret || !secret.startsWith('whsec_')) {
    throw new RecallWebhookVerificationError('Recall webhook secret is missing or invalid (expected whsec_ prefix)');
  }

  if (!msgId || !msgTimestamp || !msgSignature) {
    throw new RecallWebhookVerificationError('Missing Recall webhook signature headers');
  }

  const base64Part = secret.slice('whsec_'.length);
  const key = Buffer.from(base64Part, 'base64');

  let payloadStr = '';
  if (payload) {
    payloadStr = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
  }

  const toSign = `${msgId}.${msgTimestamp}.${payloadStr}`;
  const expectedSig = createHmac('sha256', key).update(toSign).digest('base64');

  const passedSigs = msgSignature.split(' ');
  for (const versionedSig of passedSigs) {
    const [version, signature] = versionedSig.split(',');
    if (version !== 'v1' || !signature) {
      continue;
    }

    const sigBytes = Buffer.from(signature, 'base64');
    const expectedSigBytes = Buffer.from(expectedSig, 'base64');
    if (
      expectedSigBytes.length === sigBytes.length &&
      timingSafeEqual(new Uint8Array(expectedSigBytes), new Uint8Array(sigBytes))
    ) {
      return;
    }
  }

  throw new RecallWebhookVerificationError('No matching Recall webhook signature found');
}
