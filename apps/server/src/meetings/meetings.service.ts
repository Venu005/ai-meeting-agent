import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Meeting, MeetingSource, MeetingStatus, UserPersona } from '@repo/db';
import { Prisma } from '@repo/db';
import { BillingService } from 'src/billing/billing.service';
import { MastraClient } from 'src/mastra/mastra.client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMeetingDto, ListMeetingsQueryDto, MeetingResponseDto } from './dto/create-meeting.dto';
import { RecallClient } from './recall.client';

export type CreateCalendarMeetingInput = {
  title: string;
  meetUrl: string;
  scheduledAt: string;
  googleEventId: string;
  estimatedDurationMinutes?: number;
};

type RecallWebhookPayload = {
  event?: string;
  data?: {
    bot_id?: string;
    status?: {
      code?: string;
      message?: string | null;
    };
    data?: {
      code?: string;
      sub_code?: string | null;
    };
    bot?: {
      id?: string;
    };
  };
};

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly recallClient: RecallClient,
    private readonly mastraClient: MastraClient
  ) {}

  async create(userId: string, dto: CreateMeetingDto): Promise<MeetingResponseDto> {
    const usagePeriod = await this.billingService.getOrCreateUsagePeriod(userId);

    if (!this.billingService.canUseMinutes(usagePeriod, dto.estimatedDurationMinutes)) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_MINUTES', message: 'Insufficient minutes remaining' });
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        userId,
        title: dto.title,
        meetUrl: dto.meetUrl,
        scheduledAt: new Date(dto.scheduledAt),
        status: MeetingStatus.SCHEDULED,
        source: MeetingSource.MANUAL,
      },
    });

    return this.toResponse(meeting);
  }

  async createFromCalendarEvent(userId: string, data: CreateCalendarMeetingInput): Promise<MeetingResponseDto> {
    const estimatedDurationMinutes = data.estimatedDurationMinutes ?? 30;
    const usagePeriod = await this.billingService.getOrCreateUsagePeriod(userId);

    if (!this.billingService.canUseMinutes(usagePeriod, estimatedDurationMinutes)) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_MINUTES', message: 'Insufficient minutes remaining' });
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        userId,
        title: data.title,
        meetUrl: data.meetUrl,
        scheduledAt: new Date(data.scheduledAt),
        status: MeetingStatus.SCHEDULED,
        source: MeetingSource.GOOGLE_CALENDAR,
        googleEventId: data.googleEventId,
      },
    });

    return this.toResponse(meeting);
  }

  async list(userId: string, query: ListMeetingsQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where: { userId },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.meeting.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      meetings: meetings.map((meeting) => this.toResponse(meeting)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(userId: string, id: string): Promise<MeetingResponseDto> {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, userId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return this.toResponse(meeting);
  }

  async cancel(userId: string, id: string): Promise<MeetingResponseDto> {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, userId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled meetings can be cancelled');
    }

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: { status: MeetingStatus.CANCELLED },
    });

    return this.toResponse(updated);
  }

  async dispatchBot(meetingId: string): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting || meeting.status !== MeetingStatus.SCHEDULED) {
      return;
    }

    try {
      const bot = await this.recallClient.createBot({
        meetingUrl: meeting.meetUrl,
        joinAt: meeting.scheduledAt.toISOString(),
      });

      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: MeetingStatus.BOT_JOINING,
          recallBotId: bot.id,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to dispatch bot for meeting ${meetingId}`, error);
      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: MeetingStatus.FAILED,
          failureReason: error instanceof Error ? error.message : 'Failed to dispatch bot',
        },
      });
    }
  }

  async dispatchDueMeetings(): Promise<void> {
    const dueMeetings = await this.prisma.meeting.findMany({
      where: {
        status: MeetingStatus.SCHEDULED,
        scheduledAt: { lte: new Date() },
      },
    });

    for (const meeting of dueMeetings) {
      await this.dispatchBot(meeting.id);
    }
  }

  async handleRecallWebhook(payload: RecallWebhookPayload): Promise<{ received: boolean }> {
    const statusCode = this.extractStatusCode(payload);
    const botId = this.extractBotId(payload);

    if (!statusCode || !botId) {
      this.logger.warn('Recall webhook missing status code or bot id', payload);
      return { received: true };
    }

    const meeting = await this.prisma.meeting.findFirst({
      where: { recallBotId: botId },
      include: { user: true },
    });

    if (!meeting) {
      this.logger.warn(`No meeting found for Recall bot ${botId}`);
      return { received: true };
    }

    if (this.isJoiningStatus(statusCode)) {
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: MeetingStatus.IN_PROGRESS },
      });
      return { received: true };
    }

    if (this.isFatalStatus(statusCode)) {
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: MeetingStatus.FAILED,
          failureReason: payload.data?.status?.message ?? statusCode,
        },
      });

      return { received: true };
    }

    if (this.isDoneStatus(statusCode)) {
      await this.processCompletedMeeting(meeting);
    }

    return { received: true };
  }

  private async processCompletedMeeting(meeting: Meeting & { user: { persona: UserPersona | null } }): Promise<void> {
    if (!meeting.recallBotId) {
      return;
    }

    try {
      const { transcript, durationMinutes } = await this.recallClient.getBotTranscript(meeting.recallBotId);

      await this.billingService.deductMinutes(meeting.userId, durationMinutes);

      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          transcript,
          durationMinutes,
          status: MeetingStatus.PROCESSING,
          processingAttempts: { increment: 1 },
        },
      });

      const userRole = meeting.user.persona ?? UserPersona.SOLO_FOUNDER;
      const result = await this.mastraClient.processMeeting({
        transcript,
        userRole,
        meetingTitle: meeting.title,
        durationMinutes,
      });

      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          notes: result.notes,
          structuredDoc: result.structuredDoc,
          keyPoints: result.keyPoints as Prisma.InputJsonValue,
          status: MeetingStatus.COMPLETED,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process meeting ${meeting.id}`, error);
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: MeetingStatus.FAILED,
          failureReason: error instanceof Error ? error.message : 'Processing failed',
        },
      });
    }
  }

  private extractStatusCode(payload: RecallWebhookPayload): string | null {
    const event = payload.event ?? '';
    const nestedCode = payload.data?.data?.code;
    const statusCode = payload.data?.status?.code;

    if (nestedCode) {
      return nestedCode;
    }

    if (statusCode) {
      return statusCode;
    }

    if (event.startsWith('bot.')) {
      return event.replace('bot.', '');
    }

    return null;
  }

  private extractBotId(payload: RecallWebhookPayload): string | null {
    return payload.data?.bot_id ?? payload.data?.bot?.id ?? null;
  }

  private isJoiningStatus(code: string): boolean {
    return code === 'joining_call' || code === 'joining';
  }

  private isDoneStatus(code: string): boolean {
    return code === 'done';
  }

  private isFatalStatus(code: string): boolean {
    return code === 'fatal' || code === 'failed';
  }

  private toResponse(meeting: Meeting): MeetingResponseDto {
    return {
      id: meeting.id,
      title: meeting.title,
      meetUrl: meeting.meetUrl,
      scheduledAt: meeting.scheduledAt.toISOString(),
      durationMinutes: meeting.durationMinutes,
      status: meeting.status,
      source: meeting.source,
      notes: meeting.notes,
      structuredDoc: meeting.structuredDoc,
      keyPoints: Array.isArray(meeting.keyPoints) ? (meeting.keyPoints as string[]) : null,
      failureReason: meeting.failureReason,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    };
  }
}
