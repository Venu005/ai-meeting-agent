import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
import { config } from 'src/common/config';
@Module({
  imports: [
    MailerModule.forRoot({
      transport: config.mail.smtp,
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
