import { ApiProperty } from '@nestjs/swagger';
import { MeetingSource } from '@repo/db';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const googleMeetUrlRegex = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/i;

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting title', example: 'Product sync', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Google Meet URL',
    example: 'https://meet.google.com/abc-defg-hij',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(googleMeetUrlRegex, { message: 'Must be a valid Google Meet URL' })
  meetUrl: string;

  @ApiProperty({ description: 'Scheduled start time (ISO 8601)', example: '2026-06-01T14:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  @Type(() => Number)
  estimatedDurationMinutes: number = 30;
}

export class ListMeetingsQueryDto {
  @ApiProperty({ description: 'Page number', example: 1, default: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({ description: 'Items per page', example: 10, default: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => Math.min(Number(value), 50))
  limit: number = 10;
}

export class MeetingResponseDto {
  id: string;
  title: string;
  meetUrl: string;
  scheduledAt: string;
  durationMinutes: number | null;
  status: string;
  source: MeetingSource;
  notes: string | null;
  structuredDoc: string | null;
  keyPoints: string[] | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}
