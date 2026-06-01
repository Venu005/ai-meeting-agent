import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateMeetingDto, ListMeetingsQueryDto } from './dto/create-meeting.dto';
import { CreateMeetingChatMessageDto } from './dto/meeting-chat.dto';
import { MeetingsService } from './meetings.service';
import { normalizeRecallWebhookHeaders } from './verify-request-from-recall';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a manual meeting' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMeetingDto) {
    return this.meetingsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user meetings (paginated)' })
  list(@CurrentUser() user: RequestUser, @Query() query: ListMeetingsQueryDto) {
    return this.meetingsService.list(user.id, query);
  }

  @Get(':id/recording')
  @ApiOperation({ summary: 'Get meeting recording playback URL' })
  getRecording(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.meetingsService.getRecording(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting detail' })
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.meetingsService.findOne(user.id, id);
  }

  @Get(':id/chat')
  @ApiOperation({ summary: 'Get meeting chat history' })
  getChat(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.meetingsService.getMeetingChat(user.id, id);
  }

  @Post(':id/chat')
  @ApiOperation({ summary: 'Chat with meeting context (streaming)' })
  async chat(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateMeetingChatMessageDto,
    @Res() res: Response
  ) {
    return this.meetingsService.chatWithMeeting(user.id, id, dto, res);
  }

  @Delete(':id/chat')
  @ApiOperation({ summary: 'Clear meeting chat history' })
  clearChat(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.meetingsService.clearMeetingChat(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a scheduled meeting' })
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.meetingsService.cancel(user.id, id);
  }

  @Public()
  @Post('webhook/recall')
  @ApiOperation({ summary: 'Recall.ai webhook handler' })
  handleRecallWebhook(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body for Recall webhook verification');
    }

    return this.meetingsService.handleRecallWebhook(req.rawBody, normalizeRecallWebhookHeaders(req.headers));
  }
}
