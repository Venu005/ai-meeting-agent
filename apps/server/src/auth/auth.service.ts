import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { User, UserRole } from '@repo/db';
import { Prisma } from '@repo/db';
import { JwtService } from '@nestjs/jwt';
import { Auth, google } from 'googleapis';
import { config } from 'src/common/config';
import { upsertCalendarConnection } from 'src/calendar/calendar-connection.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleAuthDto } from './dto/auth.dto';

type GoogleProfile = {
  email: string;
  googleId: string;
  givenName?: string | null;
  familyName?: string | null;
  picture?: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private oauth2Client: Auth.OAuth2Client;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl
    );
  }

  async handleGoogleAuth(body: GoogleAuthDto) {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: body.idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub) {
        throw new UnauthorizedException('Invalid google id token');
      }

      const profile: GoogleProfile = {
        email: payload.email,
        googleId: payload.sub,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
      };

      let user = await this.prismaService.user.findFirst({
        where: { email: profile.email },
      });

      if (!user) {
        user = await this.createGoogleUser(profile);
      }

      await this.persistCalendarTokensFromLogin(user.id, profile.email, body);

      return this.buildAuthResponse(user, profile.email, profile.googleId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`error occured while verifying google id token: ${error}`);
      throw new UnauthorizedException('Invalid google id token');
    }
  }

  private async createGoogleUser(profile: GoogleProfile): Promise<User> {
    const rolePermission = await this.getDefaultUserRolePermission();
    const name = this.buildDisplayName(profile);

    try {
      return await this.prismaService.user.create({
        data: {
          email: profile.email,
          name,
          avatarUrl: profile.picture ?? null,
          rolePermissionId: rolePermission.id,
          onboardingCompleted: false,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingUser = await this.prismaService.user.findFirst({
          where: { email: profile.email },
        });
        if (existingUser) {
          return existingUser;
        }
      }

      throw error;
    }
  }

  private async getDefaultUserRolePermission() {
    const existing = await this.prismaService.rolePermission.findFirst({
      where: { role: UserRole.USER },
    });

    if (existing) {
      return existing;
    }

    return this.prismaService.rolePermission.create({
      data: {
        role: UserRole.USER,
        permissions: [],
      },
    });
  }

  private buildDisplayName(profile: GoogleProfile): string {
    const fullName = [profile.givenName, profile.familyName].filter(Boolean).join(' ').trim();
    if (fullName) {
      return fullName;
    }

    const localPart = profile.email.split('@')[0]?.trim();
    return localPart || 'User';
  }

  private async persistCalendarTokensFromLogin(
    userId: string,
    googleEmail: string,
    body: GoogleAuthDto
  ): Promise<void> {
    if (!body.accessToken || !body.refreshToken) {
      this.logger.warn(`Google login for ${googleEmail} did not include calendar OAuth tokens`);
      return;
    }

    try {
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 3600 * 1000);

      await upsertCalendarConnection(this.prismaService, userId, {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt,
        googleEmail,
      });
    } catch (error) {
      this.logger.error(`Failed to store calendar tokens for ${googleEmail} during login`, error);
    }
  }

  private async buildAuthResponse(user: User, email: string, googleId: string) {
    const jwtPayload = {
      id: user.id,
      email,
      avatarUrl: user.avatarUrl,
      name: user.name,
      sub: googleId,
    };

    const token = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: config.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        isNewUser: !user.onboardingCompleted,
      },
    };
  }
}
