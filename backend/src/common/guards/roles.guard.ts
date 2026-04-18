import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // No @Roles() on the route → any authenticated user passes (JwtAuthGuard
    // still runs first via @UseGuards order).
    if (!required?.length) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();
    if (!user?.role) {
      throw new UnauthorizedException();
    }
    if (!required.includes(user.role)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
