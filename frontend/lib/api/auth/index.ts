import { apiClient } from '@/lib/api/axios';
import type {
  LoginRequestBody,
  LoginResponse,
  RegisterRequestBody,
  RegisterResponse,
} from '@/lib/api/auth/types';

export async function loginRequest(
  body: LoginRequestBody,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body);
  return data;
}

export async function registerRequest(
  body: RegisterRequestBody,
  registrationSecret: string,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    '/auth/register',
    body,
    { headers: { 'x-registration-secret': registrationSecret } },
  );
  return data;
}
