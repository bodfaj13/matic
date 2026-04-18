import type { BaseResponse } from '@/lib/api/types';

export type UserRole = 'agent' | 'admin';

export type LoginUser = {
  email: string;
  role: UserRole;
};

export type LoginPayload = {
  access_token: string;
  user: LoginUser;
};

export type LoginResponse = BaseResponse<LoginPayload>;

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type RegisterRequestBody = {
  email: string;
  password: string;
  role?: UserRole;
};

export type RegisterPayload = {
  access_token: string;
  id: string;
  email: string;
  role: UserRole;
};

export type RegisterResponse = BaseResponse<RegisterPayload>;
