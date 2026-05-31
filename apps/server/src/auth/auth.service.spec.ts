import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@repo/db';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockVerifyIdToken = jest.fn();
const mockUpsertCalendarConnection = jest.fn();

jest.mock('src/calendar/calendar-connection.helper', () => ({
  upsertCalendarConnection: (...args: unknown[]) => mockUpsertCalendarConnection(...args),
}));

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken,
      })),
    },
  },
}));

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    rolePermission: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const existingUser = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Example',
    avatarUrl: 'https://example.com/avatar.png',
    rolePermissionId: 'role-1',
    onboardingCompleted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    persona: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'alice@example.com',
        sub: 'google-123',
        given_name: 'Alice',
        family_name: 'Example',
        picture: 'https://example.com/avatar.png',
      }),
    });
    jwtService.signAsync.mockResolvedValue('jwt-token');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a token for an existing user', async () => {
    prisma.user.findFirst.mockResolvedValue(existingUser);

    const result = await service.handleGoogleAuth({ idToken: 'valid-id-token' });

    expect(result).toEqual({
      token: 'jwt-token',
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatarUrl: existingUser.avatarUrl,
        onboardingCompleted: true,
        isNewUser: false,
      },
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates a new user when google account is not registered', async () => {
    const newUser = {
      ...existingUser,
      id: 'user-2',
      onboardingCompleted: false,
    };

    prisma.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prisma.rolePermission.findFirst.mockResolvedValue({
      id: 'role-1',
      role: UserRole.USER,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.user.create.mockResolvedValue(newUser);

    const result = await service.handleGoogleAuth({ idToken: 'valid-id-token' });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'alice@example.com',
        name: 'Alice Example',
        avatarUrl: 'https://example.com/avatar.png',
        rolePermissionId: 'role-1',
        onboardingCompleted: false,
      },
    });
    expect(result.user.isNewUser).toBe(true);
    expect(result.user.onboardingCompleted).toBe(false);
  });

  it('creates default USER role permissions when missing', async () => {
    const newUser = {
      ...existingUser,
      id: 'user-2',
      onboardingCompleted: false,
    };

    prisma.user.findFirst.mockResolvedValue(null);
    prisma.rolePermission.findFirst.mockResolvedValue(null);
    prisma.rolePermission.create.mockResolvedValue({
      id: 'role-new',
      role: UserRole.USER,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.user.create.mockResolvedValue(newUser);

    await service.handleGoogleAuth({ idToken: 'valid-id-token' });

    expect(prisma.rolePermission.create).toHaveBeenCalledWith({
      data: {
        role: UserRole.USER,
        permissions: [],
      },
    });
  });

  it('stores calendar tokens when provided at login', async () => {
    prisma.user.findFirst.mockResolvedValue(existingUser);

    await service.handleGoogleAuth({
      idToken: 'valid-id-token',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z').toISOString(),
    });

    expect(mockUpsertCalendarConnection).toHaveBeenCalled();
  });

  it('throws when google token payload is missing email', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-123',
      }),
    });

    await expect(service.handleGoogleAuth({ idToken: 'invalid-id-token' })).rejects.toThrow(UnauthorizedException);
  });
});
