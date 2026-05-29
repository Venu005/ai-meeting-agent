import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingService } from 'src/billing/billing.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService
  ) {}

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        persona: dto.persona,
        onboardingCompleted: true,
      },
    });

    await this.billingService.getOrCreateUsagePeriod(userId);

    return this.getProfile(userId);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const usage = await this.billingService.getUsage(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      persona: user.persona,
      onboardingCompleted: user.onboardingCompleted,
      usage,
    };
  }
}
