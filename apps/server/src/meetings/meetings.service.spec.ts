import { ForbiddenException } from '@nestjs/common';
import { MeetingSource, MeetingStatus } from '@repo/db';
import { BillingService } from 'src/billing/billing.service';
import { MastraClient } from 'src/mastra/mastra.client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingsService } from './meetings.service';
import { RecallClient } from './recall.client';

describe('MeetingsService', () => {
  const userId = 'user-123';
  const dto: CreateMeetingDto = {
    title: 'Standup',
    meetUrl: 'https://meet.google.com/abc-defg-hij',
    scheduledAt: '2026-06-01T14:00:00.000Z',
    estimatedDurationMinutes: 30,
  };

  const prisma = {
    meeting: {
      create: jest.fn(),
    },
  };

  const billingService = {
    getOrCreateUsagePeriod: jest.fn(),
    canUseMinutes: jest.fn(),
  };

  const recallClient = {} as RecallClient;
  const mastraClient = {} as MastraClient;

  const service = new MeetingsService(
    prisma as unknown as PrismaService,
    billingService as unknown as BillingService,
    recallClient,
    mastraClient
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
});
