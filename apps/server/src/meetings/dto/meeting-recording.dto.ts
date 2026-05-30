import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingRecordingResponseDto {
  @ApiProperty({ enum: ['ready', 'processing', 'unavailable'] })
  status: 'ready' | 'processing' | 'unavailable';

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional({ enum: ['s3', 'recall'] })
  source?: 's3' | 'recall';
}
