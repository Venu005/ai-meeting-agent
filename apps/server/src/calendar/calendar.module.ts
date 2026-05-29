import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { BillingModule } from 'src/billing/billing.module';
import { MeetingsModule } from 'src/meetings/meetings.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [AuthModule, MeetingsModule, BillingModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
