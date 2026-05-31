import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Meeting, MeetingSource, MeetingStatus, RecordingStatus, User, UserPersona } from '@repo/db';
import { Prisma } from '@repo/db';
import { BillingService } from 'src/billing/billing.service';
import { config } from 'src/common/config';
import { S3Service } from 'src/common/s3/s3.service';
import { MailService } from 'src/mail/mail.service';
import { MastraClient } from 'src/mastra/mastra.client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMeetingDto, ListMeetingsQueryDto, MeetingResponseDto } from './dto/create-meeting.dto';
import { MeetingRecordingResponseDto } from './dto/meeting-recording.dto';
import { RecallClient } from './recall.client';
import {
  RecallWebhookHeaders,
  RecallWebhookVerificationError,
  verifyRequestFromRecall,
} from './verify-request-from-recall';

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
    private readonly mastraClient: MastraClient,
    private readonly mailService: MailService,
    private readonly s3Service: S3Service
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

  async getRecording(userId: string, meetingId: string): Promise<MeetingRecordingResponseDto> {
    const meeting = await this.prisma.meeting.findFirst({ where: { id: meetingId, userId } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    switch (meeting.recordingStatus) {
      case RecordingStatus.PROCESSING:
        return { status: 'processing' };
      case RecordingStatus.READY: {
        if (!meeting.recordingKey) {
          return { status: 'unavailable' };
        }
        const url = await this.s3Service.getPresignedRecordingUrl(meeting.recordingKey);
        return { status: 'ready', source: 's3', url };
      }
      case RecordingStatus.FALLBACK: {
        if (!meeting.recordingFallbackUrl) {
          return { status: 'unavailable' };
        }
        return { status: 'ready', source: 'recall', url: meeting.recordingFallbackUrl };
      }
      default:
        return { status: 'unavailable' };
    }
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
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { user: true },
    });
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
      const failureReason = error instanceof Error ? error.message : 'Failed to dispatch bot';
      await this.prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: MeetingStatus.FAILED,
          failureReason,
        },
      });
      await this.mailService.sendMeetingFailed(meeting.user.email, {
        title: meeting.title,
        reason: failureReason,
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

  async handleRecallWebhook(rawBody: Buffer, headers: RecallWebhookHeaders): Promise<{ received: boolean }> {
    if (!config.recall.webhookSecret) {
      throw new BadRequestException('Recall webhook secret is not configured');
    }

    try {
      verifyRequestFromRecall({
        secret: config.recall.webhookSecret,
        headers,
        payload: rawBody,
      });
    } catch (error) {
      if (error instanceof RecallWebhookVerificationError) {
        this.logger.warn(`Recall webhook signature verification failed: ${error.message}`);
        throw new BadRequestException('Invalid Recall webhook signature');
      }
      throw error;
    }

    let payload: RecallWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as RecallWebhookPayload;
    } catch {
      throw new BadRequestException('Invalid Recall webhook payload');
    }

    return this.processRecallWebhook(payload);
  }

  private async processRecallWebhook(payload: RecallWebhookPayload): Promise<{ received: boolean }> {
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
      const failureReason = payload.data?.status?.message ?? statusCode;
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: MeetingStatus.FAILED,
          failureReason,
        },
      });

      await this.mailService.sendMeetingFailed(meeting.user.email, {
        title: meeting.title,
        reason: failureReason,
      });

      return { received: true };
    }

    if (this.isDoneStatus(statusCode)) {
      await this.processCompletedMeeting(meeting);
    }

    return { received: true };
  }

  private async processCompletedMeeting(meeting: Meeting & { user: Pick<User, 'email' | 'persona'> }): Promise<void> {
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
          recordingStatus: RecordingStatus.PROCESSING,
          processingAttempts: { increment: 1 },
        },
      });

      const userRole = meeting.user.persona ?? UserPersona.SOLO_FOUNDER;
      const [, result] = await Promise.all([
        this.persistRecording(meeting),
        this.mastraClient.processMeeting(
          {
            transcript,
            userRole,
            meetingTitle: meeting.title,
            durationMinutes,
          },
          meeting.id
        ),
      ]);

      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          notes: result.notes,
          structuredDoc: result.structuredDoc,
          keyPoints: result.keyPoints as Prisma.InputJsonValue,
          status: MeetingStatus.COMPLETED,
        },
      });

      await this.mailService.sendMeetingCompleted(meeting.user.email, {
        title: meeting.title,
        keyPoints: result.keyPoints,
        meetingUrl: `${config.urls.frontend}/meetings/${meeting.id}`,
      });
    } catch (error) {
      this.logger.error(`Failed to process meeting ${meeting.id}`, error);
      const failureReason = error instanceof Error ? error.message : 'Processing failed';
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          status: MeetingStatus.FAILED,
          failureReason,
        },
      });
      await this.mailService.sendMeetingFailed(meeting.user.email, {
        title: meeting.title,
        reason: failureReason,
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

  private buildRecordingKey(userId: string, meetingId: string): string {
    return `recordings/${userId}/${meetingId}.mp4`;
  }

  private async persistRecording(meeting: Meeting): Promise<void> {
    if (!meeting.recallBotId) {
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: { recordingStatus: RecordingStatus.UNAVAILABLE },
      });
      return;
    }

    try {
      const downloadUrl = await this.recallClient.getBotRecordingDownloadUrl(meeting.recallBotId);
      if (!downloadUrl) {
        await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: { recordingStatus: RecordingStatus.UNAVAILABLE },
        });
        return;
      }

      const buffer = await this.recallClient.downloadRecording(downloadUrl);
      const key = this.buildRecordingKey(meeting.userId, meeting.id);
      await this.s3Service.uploadRecording(key, buffer);

      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          recordingKey: key,
          recordingFallbackUrl: null,
          recordingStatus: RecordingStatus.READY,
        },
      });
    } catch (error) {
      this.logger.error(`S3 upload failed for meeting ${meeting.id}, storing Recall fallback`, error);
      const fallbackUrl = await this.recallClient.getBotRecordingDownloadUrl(meeting.recallBotId);
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: {
          recordingFallbackUrl: fallbackUrl,
          recordingStatus: fallbackUrl ? RecordingStatus.FALLBACK : RecordingStatus.UNAVAILABLE,
        },
      });
    }
  }

  private computeRecordingFlags(status: RecordingStatus) {
    return {
      hasRecording: status === RecordingStatus.READY || status === RecordingStatus.FALLBACK,
      showRecordingPanel:
        status === RecordingStatus.PROCESSING ||
        status === RecordingStatus.READY ||
        status === RecordingStatus.FALLBACK,
    };
  }

  private toResponse(meeting: Meeting): MeetingResponseDto {
    const recordingStatus = meeting.recordingStatus ?? RecordingStatus.NONE;
    const { hasRecording, showRecordingPanel } = this.computeRecordingFlags(recordingStatus);

    return {
      id: meeting.id,
      title: meeting.title,
      meetUrl: meeting.meetUrl,
      scheduledAt: meeting.scheduledAt.toISOString(),
      durationMinutes: meeting.durationMinutes,
      status: meeting.status,
      source: meeting.source,
      transcript: meeting.transcript,
      recordingStatus,
      hasRecording,
      showRecordingPanel,
      notes: meeting.notes,
      structuredDoc: meeting.structuredDoc,
      keyPoints: Array.isArray(meeting.keyPoints) ? (meeting.keyPoints as string[]) : null,
      failureReason: meeting.failureReason,
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    };
  }
}
