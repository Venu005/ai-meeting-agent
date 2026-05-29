import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { config } from 'src/common/config';

/**
 * Service responsible for handling all email-related operations.
 * Provides functionality for sending regular emails, template-based emails, and emails with attachments.
 *
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private mailService: MailService) {}
 *
 * // Send a simple email
 * await mailService.sendMail({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   text: 'Hello World!'
 * });
 * ```
 */
@Injectable()
export class MailService {
  /**
   * Creates an instance of MailService.
   * @param mailerService - The NestJS mailer service for sending emails
   */
  constructor(private mailerService: MailerService) {}

  /**
   * Sends an email using the configured transporter.
   *
   * @param options - The email options
   * @param options.to - Recipient email address(es)
   * @param options.subject - Email subject line
   * @param options.text - Plain text content of the email (optional)
   * @param options.html - HTML content of the email (optional)
   * @returns Promise resolving to true if email was sent successfully, false otherwise
   *
   * @example
   * ```typescript
   * const sent = await mailService.sendMail({
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   html: '<h1>Welcome to our platform!</h1>'
   * });
   * ```
   */
  public async sendMail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Sends an email with file attachments.
   *
   * @param options - The email options with attachments
   * @param options.to - Recipient email address(es)
   * @param options.subject - Email subject line
   * @param options.text - Plain text content of the email (optional)
   * @param options.html - HTML content of the email (optional)
   * @param options.attachments - Array of file attachments (optional)
   * @param options.attachments[].filename - Name of the attached file
   * @param options.attachments[].content - Content of the file (Buffer or string)
   * @returns Promise resolving to true if email was sent successfully, false otherwise
   *
   * @example
   * ```typescript
   * await mailService.sendMailWithAttachment({
   *   to: 'user@example.com',
   *   subject: 'Your Invoice',
   *   text: 'Please find your invoice attached.',
   *   attachments: [{
   *     filename: 'invoice.pdf',
   *     content: Buffer.from('...') // PDF content
   *   }]
   * });
   * ```
   */
  async sendMailWithAttachment(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
    }>;
  }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: `"${config.mail.defaults.fromName}" <${config.mail.smtp.auth.user}>`,
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email with attachment:', error);
      return false;
    }
  }

  async sendMeetingCompleted(
    email: string,
    data: { title: string; keyPoints: string[]; meetingUrl: string }
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Meeting notes ready: ${data.title}`,
        template: 'meeting-completed',
        context: {
          title: data.title,
          keyPoints: data.keyPoints.slice(0, 3),
          meetingUrl: data.meetingUrl,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to send meeting completed email:', error);
      return false;
    }
  }

  async sendMeetingFailed(email: string, data: { title: string; reason: string }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Meeting failed: ${data.title}`,
        template: 'meeting-failed',
        context: {
          title: data.title,
          reason: data.reason,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to send meeting failed email:', error);
      return false;
    }
  }

  async sendMinutesLowWarning(email: string, data: { minutesRemaining: number }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your meeting minutes are running low',
        template: 'minutes-low',
        context: {
          minutesRemaining: data.minutesRemaining,
          billingUrl: `${config.urls.frontend}/settings/billing`,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to send minutes low warning email:', error);
      return false;
    }
  }
}
