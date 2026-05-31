import { IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
