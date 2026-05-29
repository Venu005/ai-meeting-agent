import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { GoogleAuthDto } from './dto/auth.dto';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  @Public()
  async googleAuth(@Body() body: GoogleAuthDto) {
    return this.authService.handleGoogleAuth(body.idToken);
  }
}
