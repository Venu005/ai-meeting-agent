import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export const MEETING_CHAT_MAX_MESSAGE_LENGTH = 4000;

export class CreateMeetingChatMessageDto {
  @ApiProperty({
    description: 'User message for meeting-scoped chat',
    example: 'What were the top 3 action items from this meeting?',
    maxLength: MEETING_CHAT_MAX_MESSAGE_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MEETING_CHAT_MAX_MESSAGE_LENGTH)
  message: string;
}

export class MeetingChatMessageDto {
  @ApiProperty({ description: 'Message id', format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Message role', enum: ['user', 'assistant'] })
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Message creation timestamp', example: '2026-06-01T14:00:00.000Z' })
  @IsDateString()
  createdAt: string;
}
