import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('delegates register to AuthService', async () => {
    authService.register.mockResolvedValue({
      message: 'Registered successfully',
      status: true,
      data: {
        access_token: 't',
        id: '1',
        email: 'a@b.com',
        role: UserRole.Agent,
      },
      statusCode: '201',
    });

    const dto = {
      email: 'a@b.com',
      password: 'secret1234',
    };
    await expect(controller.register(dto, 's')).resolves.toMatchObject({
      data: {
        access_token: 't',
        id: '1',
        email: 'a@b.com',
        role: UserRole.Agent,
      },
      statusCode: '201',
    });
    expect(authService.register).toHaveBeenCalledWith(dto, 's');
  });

  it('delegates login to AuthService', async () => {
    authService.login.mockResolvedValue({
      message: 'Login successful',
      status: true,
      data: {
        access_token: 't',
        user: { email: 'a@b.com', role: UserRole.Agent },
      },
      statusCode: '200',
    });

    await expect(
      controller.login({ email: 'a@b.com', password: 'p' }),
    ).resolves.toMatchObject({ data: { access_token: 't' } });
    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'p');
  });
});
