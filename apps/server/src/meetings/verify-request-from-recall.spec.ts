import { createHmac } from 'node:crypto';
import {
  RecallWebhookVerificationError,
  normalizeRecallWebhookHeaders,
  verifyRequestFromRecall,
} from './verify-request-from-recall';

const TEST_KEY = Buffer.from('recall-webhook-test-signing-key!!');
const TEST_SECRET = `whsec_${TEST_KEY.toString('base64')}`;

function signRecallPayload(payload: string, secret = TEST_SECRET) {
  const msgId = 'msg_test_123';
  const msgTimestamp = '1731705121';
  const base64Part = secret.slice('whsec_'.length);
  const key = Buffer.from(base64Part, 'base64');
  const toSign = `${msgId}.${msgTimestamp}.${payload}`;
  const signature = createHmac('sha256', key).update(toSign).digest('base64');

  return {
    msgId,
    msgTimestamp,
    headers: {
      'webhook-id': msgId,
      'webhook-timestamp': msgTimestamp,
      'webhook-signature': `v1,${signature}`,
    },
  };
}

describe('verifyRequestFromRecall', () => {
  it('accepts a valid signed payload', () => {
    const payload = JSON.stringify({ event: 'bot.done', data: { bot_id: 'bot-1' } });
    const { headers } = signRecallPayload(payload);

    expect(() =>
      verifyRequestFromRecall({
        secret: TEST_SECRET,
        headers,
        payload,
      })
    ).not.toThrow();
  });

  it('accepts svix-prefixed headers', () => {
    const payload = '{"event":"bot.done"}';
    const { msgId, msgTimestamp, headers } = signRecallPayload(payload);

    expect(() =>
      verifyRequestFromRecall({
        secret: TEST_SECRET,
        headers: {
          'svix-id': msgId,
          'svix-timestamp': msgTimestamp,
          'svix-signature': headers['webhook-signature'],
        },
        payload,
      })
    ).not.toThrow();
  });

  it('rejects tampered payloads', () => {
    const payload = '{"event":"bot.done"}';
    const { headers } = signRecallPayload(payload);

    expect(() =>
      verifyRequestFromRecall({
        secret: TEST_SECRET,
        headers,
        payload: '{"event":"bot.fatal"}',
      })
    ).toThrow(RecallWebhookVerificationError);
  });

  it('rejects missing signature headers', () => {
    expect(() =>
      verifyRequestFromRecall({
        secret: TEST_SECRET,
        headers: {},
        payload: '{}',
      })
    ).toThrow('Missing Recall webhook signature headers');
  });
});

describe('normalizeRecallWebhookHeaders', () => {
  it('lowercases header names', () => {
    expect(
      normalizeRecallWebhookHeaders({
        'Webhook-Id': 'msg_1',
        'Webhook-Timestamp': '123',
      })
    ).toEqual({
      'webhook-id': 'msg_1',
      'webhook-timestamp': '123',
    });
  });
});
