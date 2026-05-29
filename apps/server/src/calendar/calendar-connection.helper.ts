import { PrismaService } from 'src/prisma/prisma.service';
import { encrypt } from 'src/common/utils/encryption';

export type CalendarOAuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  googleEmail: string;
};

export async function upsertCalendarConnection(
  prisma: PrismaService,
  userId: string,
  tokens: CalendarOAuthTokens
): Promise<void> {
  await prisma.calendarConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      googleEmail: tokens.googleEmail,
    },
    update: {
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      googleEmail: tokens.googleEmail,
    },
  });
}
