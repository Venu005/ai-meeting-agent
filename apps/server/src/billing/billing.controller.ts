import { BadRequestException, Controller, Get, Post, RawBodyRequest, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('usage')
  @ApiOperation({ summary: 'Get current minute usage' })
  getUsage(@CurrentUser() user: RequestUser) {
    return this.billingService.getUsage(user.id);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session for Pro plan' })
  createCheckout(@CurrentUser() user: RequestUser) {
    return this.billingService.createCheckoutSession(user.id, user.email);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  createPortal(@CurrentUser() user: RequestUser) {
    return this.billingService.createPortalSessionForUser(user.id);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'];
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body for webhook verification');
    }

    return this.billingService.handleWebhook(req.rawBody, signature);
  }
}
