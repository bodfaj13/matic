import { apiClient } from '@/lib/api/axios';
import { loginRequest, registerRequest } from './index';

jest.mock('@/lib/api/axios', () => ({
  apiClient: { post: jest.fn() },
}));

describe('auth request functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loginRequest POSTs /auth/login and returns body', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        data: { access_token: 'tok', user: { email: 'a@b.co', role: 'agent' } },
      },
    });

    const out = await loginRequest({ email: 'a@b.co', password: 'p' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.co',
      password: 'p',
    });
    expect(out.data?.access_token).toBe('tok');
  });

  it('registerRequest POSTs /auth/register with x-registration-secret header', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: {
        data: { access_token: 'tok', id: 'u1', email: 'a@b.co', role: 'agent' },
      },
    });

    await registerRequest({ email: 'a@b.co', password: 'p' }, 'shh-secret');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'a@b.co', password: 'p' },
      { headers: { 'x-registration-secret': 'shh-secret' } },
    );
  });
});
