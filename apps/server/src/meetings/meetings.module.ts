import { Module } from '@nestjs/common';
import { BillingModule } from 'src/billing/billing.module';
import { S3Module } from 'src/common/s3/s3.module';
import { MailModule } from 'src/mail/mail.module';
import { MastraModule } from 'src/mastra/mastra.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsScheduler } from './meetings.scheduler';
import { MeetingsService } from './meetings.service';
import { RecallClient } from './recall.client';

@Module({
  imports: [BillingModule, MailModule, MastraModule, S3Module],
  controllers: [MeetingsController],
  providers: [MeetingsService, RecallClient, MeetingsScheduler],
  exports: [MeetingsService],
})
export class MeetingsModule {}
