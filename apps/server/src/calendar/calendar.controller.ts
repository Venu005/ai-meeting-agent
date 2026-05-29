import { Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('connect')
  @ApiOperation({ summary: 'Start Google Calendar OAuth' })
  connect(
    @CurrentUser() user: RequestUser,
    @Query('redirect') redirect: string | undefined,
    @Res({ passthrough: true }) res: Response
  ) {
    const url = this.calendarService.getConnectUrl(user.id);

    if (redirect === 'true') {
      return res.redirect(url);
    }

    return { url };
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Google Calendar OAuth callback' })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response
  ) {
    if (error || !code || !state) {
      return res.redirect(this.calendarService.getCallbackErrorRedirectUrl());
    }

    try {
      const redirectUrl = await this.calendarService.handleCallback(code, state);
      return res.redirect(redirectUrl);
    } catch {
      return res.redirect(this.calendarService.getCallbackErrorRedirectUrl());
    }
  }

  @Get('events')
  @ApiOperation({ summary: 'List upcoming calendar events with Google Meet links' })
  listEvents(@CurrentUser() user: RequestUser) {
    return this.calendarService.listEvents(user.id);
  }

  @Post('events/:eventId/bot')
  @ApiOperation({ summary: 'Schedule AI bot for a calendar event' })
  enableBot(@CurrentUser() user: RequestUser, @Param('eventId') eventId: string) {
    return this.calendarService.enableBotForEvent(user.id, eventId);
  }
}
