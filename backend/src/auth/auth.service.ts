import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserRole } from '../common/enums/user-role.enum';
import type { LoginResponseDto } from './dto/login.response.dto';
import type { RegisterResponseDto } from './dto/register.response.dto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from './jwt.strategy';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    registrationSecret: string,
  ): Promise<RegisterResponseDto> {
    const role = dto.role ?? UserRole.Agent;
    if (role === UserRole.Admin) {
      const adminSecret = this.config.get<string>('ADMIN_REGISTRATION_SECRET');
      if (!adminSecret || registrationSecret !== adminSecret) {
        throw new ForbiddenException(
          'Invalid registration credentials for admin',
        );
      }
    } else {
      const agentSecret = this.config.getOrThrow<string>(
        'AGENT_REGISTRATION_SECRET',
      );
      if (registrationSecret !== agentSecret) {
        throw new ForbiddenException('Invalid registration credentials');
      }
    }

    const existing = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role,
    });

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Registered successfully',
      status: true,
      data: {
        access_token: await this.jwtService.signAsync(payload),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      statusCode: '201',
    };
  }

  async login(email: string, password: string): Promise<LoginResponseDto> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Login successful',
      status: true,
      data: {
        access_token: await this.jwtService.signAsync(payload),
        user: { email: user.email, role: user.role },
      },
      statusCode: '200',
    };
  }
}
