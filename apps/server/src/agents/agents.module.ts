import { Module } from '@nestjs/common';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class AgentsModule {}
