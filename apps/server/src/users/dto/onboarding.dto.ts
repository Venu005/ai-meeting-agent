import { ApiProperty } from '@nestjs/swagger';
import { UserPersona } from '@repo/db';
import { IsEnum } from 'class-validator';

export class OnboardingDto {
  @ApiProperty({ enum: UserPersona, example: UserPersona.SOLO_FOUNDER })
  @IsEnum(UserPersona)
  persona: UserPersona;
}
