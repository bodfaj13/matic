import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const ctx = (user: { role?: UserRole } | undefined): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(ctx({ role: UserRole.Agent }))).toBe(true);
  });

  it('allows when user role matches', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.Agent,
      UserRole.Admin,
    ]);

    expect(guard.canActivate(ctx({ role: UserRole.Admin }))).toBe(true);
  });

  it('throws when user missing', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Agent]);

    expect(() => guard.canActivate(ctx(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('throws when role not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);

    expect(() => guard.canActivate(ctx({ role: UserRole.Agent }))).toThrow(
      UnauthorizedException,
    );
  });
});
