import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MeetingSource, MeetingStatus, UserPersona } from '@repo/db';
import { BillingService } from 'src/billing/billing.service';
import { MastraClient } from 'src/mastra/mastra.client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';
import { RecallClient } from './recall.client';
import { signRecallWebhookPayload } from './recall-webhook.test-utils';

jest.mock('src/common/config', () => ({
  config: {
    urls: { frontend: 'http://localhost:3000' },
    recall: {
      webhookSecret: `whsec_${Buffer.from('recall-webhook-test-signing-key!!').toString('base64')}`,
    },
  },
}));

const TEST_RECALL_WEBHOOK_SECRET = `whsec_${Buffer.from('recall-webhook-test-signing-key!!').toString('base64')}`;

describe('MeetingsService', () => {
  const userId = 'user-123';
  const meetingId = 'meeting-1';
  const botId = 'recall-bot-1';
  const dto: CreateMeetingDto = {
    title: 'Standup',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    scheduledAt: '2026-06-01T14:00:00.000Z',
    estimatedDurationMinutes: 30,
  };

  const prisma = {
    meeting: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const billingService = {
    getOrCreateUsagePeriod: jest.fn(),
    canUseMinutes: jest.fn(),
    deductMinutes: jest.fn(),
  };

  const getBotTranscriptMock = jest.fn();
  const recallClient = {
    getBotTranscript: getBotTranscriptMock,
  } as unknown as RecallClient;

  const processMeetingMock = jest.fn();
  const mastraClient = {
    processMeeting: processMeetingMock,
  } as unknown as MastraClient;

  const mailService = {
    sendMeetingCompleted: jest.fn().mockResolvedValue(true),
    sendMeetingFailed: jest.fn().mockResolvedValue(true),
  };

  const service = new MeetingsService(
    prisma as unknown as PrismaService,
    billingService as unknown as BillingService,
    recallClient,
    mastraClient,
    mailService as never
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('rejects scheduling when insufficient minutes', async () => {
      billingService.getOrCreateUsagePeriod.mockResolvedValue({
        minutesUsed: 9,
        minutesIncluded: 10,
      });
      billingService.canUseMinutes.mockReturnValue(false);

      await expect(service.create(userId, dto)).rejects.toMatchObject({
        status: 403,
        response: { code: 'INSUFFICIENT_MINUTES' },
      });

      expect(prisma.meeting.create).not.toHaveBeenCalled();
    });

    it('creates a scheduled meeting when minutes are available', async () => {
      const createdMeeting = {
        id: 'meeting-1',
        userId,
        title: dto.title,
        meetUrl: dto.meetUrl,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: null,
        status: MeetingStatus.SCHEDULED,
        source: MeetingSource.MANUAL,
        notes: null,
        structuredDoc: null,
        keyPoints: null,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      billingService.getOrCreateUsagePeriod.mockResolvedValue({
        minutesUsed: 0,
        minutesIncluded: 10,
      });
      billingService.canUseMinutes.mockReturnValue(true);
      prisma.meeting.create.mockResolvedValue(createdMeeting);

      const result = await service.create(userId, dto);

      expect(prisma.meeting.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: dto.title,
          status: MeetingStatus.SCHEDULED,
        }),
      });
      expect(result.id).toBe('meeting-1');
    });

    it('throws ForbiddenException with INSUFFICIENT_MINUTES code', async () => {
      billingService.getOrCreateUsagePeriod.mockResolvedValue({
        minutesUsed: 10,
        minutesIncluded: 10,
      });
      billingService.canUseMinutes.mockReturnValue(false);

      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('handleRecallWebhook lifecycle', () => {
    const meetingWithUser = {
      id: meetingId,
      userId,
      title: 'Product Sync',
      recallBotId: botId,
      user: { email: 'user@example.com', persona: UserPersona.PRODUCT_MANAGER },
    };

    const callRecallWebhook = async (payload: Record<string, unknown>) => {
      const body = JSON.stringify(payload);
      await service.handleRecallWebhook(Buffer.from(body), signRecallWebhookPayload(body, TEST_RECALL_WEBHOOK_SECRET));
    };

    it('rejects webhooks with invalid signatures', async () => {
      const body = JSON.stringify({ event: 'bot.done', data: { bot_id: botId } });

      await expect(
        service.handleRecallWebhook(Buffer.from(body), {
          'webhook-id': 'msg_invalid',
          'webhook-timestamp': '1731705121',
          'webhook-signature': 'v1,invalid',
        })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('processes bot.done webhook and completes meeting with notes', async () => {
      prisma.meeting.findFirst.mockResolvedValue(meetingWithUser);
      prisma.meeting.update.mockResolvedValue({});
      getBotTranscriptMock.mockResolvedValue({
        transcript: 'Alice: Hello team\nBob: Ship by Friday',
        durationMinutes: 5,
      });
      processMeetingMock.mockResolvedValue({
        notes: '## Summary\nTeam aligned on Friday ship date.',
        structuredDoc: '# PRD\nShip feature by Friday.',
        keyPoints: ['Friday deadline', 'Scope agreed'],
      });

      await callRecallWebhook({
        event: 'bot.done',
        data: { bot_id: botId, status: { code: 'done' } },
      });

      expect(billingService.deductMinutes).toHaveBeenCalledWith(userId, 5);
      expect(processMeetingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          transcript: 'Alice: Hello team\nBob: Ship by Friday',
          userRole: UserPersona.PRODUCT_MANAGER,
          meetingTitle: 'Product Sync',
        }),
        meetingId
      );
      expect(prisma.meeting.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: meetingId },
          data: expect.objectContaining({ status: MeetingStatus.COMPLETED }),
        })
      );
      expect(mailService.sendMeetingCompleted).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          title: 'Product Sync',
          keyPoints: ['Friday deadline', 'Scope agreed'],
        })
      );
    });

    it('marks meeting failed and sends email on bot.fatal webhook', async () => {
      prisma.meeting.findFirst.mockResolvedValue(meetingWithUser);
      prisma.meeting.update.mockResolvedValue({});

      await callRecallWebhook({
        event: 'bot.fatal',
        data: { bot_id: botId, status: { code: 'fatal', message: 'Bot denied entry' } },
      });

      expect(prisma.meeting.update).toHaveBeenCalledWith({
        where: { id: meetingId },
        data: {
          status: MeetingStatus.FAILED,
          failureReason: 'Bot denied entry',
        },
      });
      expect(mailService.sendMeetingFailed).toHaveBeenCalledWith('user@example.com', {
        title: 'Product Sync',
        reason: 'Bot denied entry',
      });
      expect(billingService.deductMinutes).not.toHaveBeenCalled();
    });
  });
});
