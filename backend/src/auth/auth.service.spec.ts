jest.mock('bcrypt', () => ({
  __esModule: true,
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: {
    findOne: jest.Mock;
    create: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };

  const mockUserDoc = {
    _id: { toString: () => 'user-id-1' },
    email: 'a@b.com',
    passwordHash: 'hashed',
    role: UserRole.Agent,
  };

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-token') };
    config = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockReturnValue('agent-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  describe('register', () => {
    it('creates an agent when secret matches', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      userModel.create.mockResolvedValue(
        mockUserDoc as unknown as UserDocument,
      );

      const result = await service.register(
        {
          email: 'A@B.com',
          password: 'password123',
        },
        'agent-secret',
      );

      expect(result).toEqual({
        message: 'Registered successfully',
        status: true,
        data: {
          access_token: 'jwt-token',
          id: 'user-id-1',
          email: 'a@b.com',
          role: UserRole.Agent,
        },
        statusCode: '201',
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', role: UserRole.Agent }),
      );
    });

    it('rejects wrong agent secret', async () => {
      await expect(
        service.register(
          {
            email: 'a@b.com',
            password: 'password123',
          },
          'wrong',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates admin when ADMIN_REGISTRATION_SECRET matches', async () => {
      config.get.mockImplementation((key: string) =>
        key === 'ADMIN_REGISTRATION_SECRET' ? 'admin-secret' : undefined,
      );
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      userModel.create.mockResolvedValue({
        ...mockUserDoc,
        role: UserRole.Admin,
      } as unknown as UserDocument);

      const result = await service.register(
        {
          email: 'admin@b.com',
          password: 'password123',
          role: UserRole.Admin,
        },
        'admin-secret',
      );

      expect(result.data?.role).toBe(UserRole.Admin);
    });

    it('throws ConflictException when email exists', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      });

      await expect(
        service.register(
          {
            email: 'a@b.com',
            password: 'password123',
          },
          'agent-secret',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns token when credentials are valid', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      });

      const result = await service.login('a@b.com', 'password123');

      expect(result.data?.access_token).toBe('jwt-token');
      expect(result.data?.user).toEqual({
        email: 'a@b.com',
        role: UserRole.Agent,
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
    });

    it('throws when user not found', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.login('x@y.com', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when password does not match', async () => {
      userModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserDoc),
      });
      jest.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(service.login('a@b.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
