import { Test, TestingModule } from '@nestjs/testing';
import { AuthController, LoginDto } from './auth.controller';
import { AuthService } from './auth.service';
import { TestUtils } from '../../test/test-utils';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      aptos_address: 'test-aptos-address',
      password: 'test-admin-password',
    };

    it('should login successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      const expectedResult = {
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          aptos_address: mockUser.aptos_address,
          display_name: mockUser.display_name,
        },
      };

      (authService.login as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.aptos_address,
        loginDto.password,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors', async () => {
      (authService.login as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.login(loginDto)).rejects.toThrow('Service error');
    });

    it('should handle UnauthorizedException', async () => {
      const unauthorizedError = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });
}); 