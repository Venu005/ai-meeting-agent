import { TextUIPart } from 'ai';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: Date | undefined;

  @IsNotEmpty()
  @IsString()
  @IsIn(['system', 'user', 'assistant'])
  role: 'system' | 'user' | 'assistant';

  @IsOptional()
  parts: TextUIPart[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments: string[];
}

export class ChatAgentInputDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;
}

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class GetChatsQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => Math.min(value, 50))
  limit: number = 10;
}
