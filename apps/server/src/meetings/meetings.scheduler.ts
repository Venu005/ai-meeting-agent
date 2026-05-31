import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MeetingsService } from './meetings.service';

@Injectable()
export class MeetingsScheduler {
  private readonly logger = new Logger(MeetingsScheduler.name);

  constructor(private readonly meetingsService: MeetingsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchScheduledBots(): Promise<void> {
    try {
      await this.meetingsService.dispatchDueMeetings();
    } catch (error) {
      this.logger.error('Failed to dispatch scheduled bots', error);
    }
  }
}
