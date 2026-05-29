import { createHmac, randomUUID } from 'node:crypto';
import { RecallWebhookHeaders } from './verify-request-from-recall';

export function signRecallWebhookPayload(payload: string, secret: string): RecallWebhookHeaders {
  const msgId = `msg_${randomUUID()}`;
  const msgTimestamp = Math.floor(Date.now() / 1000).toString();
  const base64Part = secret.slice('whsec_'.length);
  const key = Buffer.from(base64Part, 'base64');
  const toSign = `${msgId}.${msgTimestamp}.${payload}`;
  const signature = createHmac('sha256', key).update(toSign).digest('base64');

  return {
    'webhook-id': msgId,
    'webhook-timestamp': msgTimestamp,
    'webhook-signature': `v1,${signature}`,
  };
}
