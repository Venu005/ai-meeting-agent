import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OnboardingDto } from './dto/onboarding.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Complete user onboarding with persona selection' })
  completeOnboarding(@CurrentUser() user: RequestUser, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile with persona and usage' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.usersService.getProfile(user.id);
  }
}
