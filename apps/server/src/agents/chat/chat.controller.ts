import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import 'multer';
import { ChatService } from './chat.service';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatAgentInputDto, GetChatsQueryDto, UpdateChatDto } from '../dto/chat-agent.dto';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestHints } from 'src/common/decorators/request-hint.decorator';
import { RequestHint } from '@repo/shared-types/types';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Agents')
@Controller('agents')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('transcript')
  @UseInterceptors(FileInterceptor('voice'))
  async createTranscript(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.createTranscript(file);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  createChat(@CurrentUser() user: RequestUser) {
    return this.chatService.createChat(user?.id);
  }

  @Post('chat/:chatId')
  @ApiOperation({ summary: 'Chat with the AI agent' })
  async chat(
    @Body() body: ChatAgentInputDto,
    @Param('chatId') chatId: string,
    @CurrentUser() user: RequestUser,
    @RequestHints() requestHints: RequestHint,
    @Res() res: Response
  ) {
    return this.chatService.chat(chatId, body.message, user, res, requestHints);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get chat' })
  getChat(@Param('chatId') chatId: string, @CurrentUser() user: RequestUser) {
    return this.chatService.getChat(user.id, chatId);
  }

  @Get('chat/:chatId/messages')
  @ApiOperation({ summary: 'Get chat with messages' })
  getChatWithMessages(@Param('chatId') chatId: string, @CurrentUser() user: RequestUser) {
    return this.chatService.getChatWithMessages(user.id, chatId);
  }

  @Get('chats')
  @ApiOperation({ summary: 'Get all chats' })
  getChats(@Query() query: GetChatsQueryDto, @CurrentUser() user: RequestUser) {
    return this.chatService.getChats(user.id, query);
  }

  @Delete('chat/:chatId')
  @ApiOperation({ summary: 'Delete a chat' })
  deleteChat(@Param('chatId') chatId: string, @CurrentUser() user: RequestUser) {
    return this.chatService.deleteChat(user.id, chatId);
  }

  @Put('chat/:chatId')
  @ApiOperation({ summary: 'Update a chat' })
  updateChat(@Param('chatId') chatId: string, @Body() body: UpdateChatDto, @CurrentUser() user: RequestUser) {
    return this.chatService.updateChat(user.id, chatId, body);
  }

  @Get('chats/public')
  @ApiOperation({ summary: 'Get all public chats for the user' })
  getPublicChatsForUser(@CurrentUser() user: RequestUser) {
    return this.chatService.getPublicChatsForUser(user.id);
  }
}
