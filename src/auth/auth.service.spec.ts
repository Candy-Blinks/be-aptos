import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TestUtils } from '../../test/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: TestUtils.createMockPrismaService(),
        },
        {
          provide: JwtService,
          useValue: TestUtils.createMockJwtService(),
        },
        {
          provide: ConfigService,
          useValue: TestUtils.createMockConfigService(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const aptosAddress = 'test-aptos-address';
    const password = 'test-admin-password';

    it('should login successfully with correct credentials', async () => {
      const mockUser = TestUtils.createMockUser();
      (configService.get as jest.Mock).mockReturnValue('test-admin-password');
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await service.login(aptosAddress, password);

      expect(configService.get).toHaveBeenCalledWith('ADMIN_PASSWORD');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { aptos_address: aptosAddress },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        aptosAddress: mockUser.aptos_address,
        username: mockUser.username,
        sub: mockUser.id,
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          aptos_address: mockUser.aptos_address,
          display_name: mockUser.display_name,
        },
      });
    });

    it('should throw UnauthorizedException with incorrect password', async () => {
      (configService.get as jest.Mock).mockReturnValue('correct-password');

      await expect(service.login(aptosAddress, 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (configService.get as jest.Mock).mockReturnValue('test-admin-password');
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(aptosAddress, password)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should use default password if not configured', async () => {
      const mockUser = TestUtils.createMockUser();
      (configService.get as jest.Mock).mockReturnValue(undefined);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await service.login(aptosAddress, 'admin123');

      expect(result).toBeDefined();
      expect(result.access_token).toBe('mock-jwt-token');
    });
  });

  describe('validateApiKey', () => {
    it('should validate production API key in production', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production-key') // API_KEY
        .mockReturnValueOnce('dev-key') // API_KEY_DEV
        .mockReturnValueOnce('production'); // NODE_ENV

      const result = service.validateApiKey('production-key');

      expect(result).toBe(true);
    });

    it('should validate development API key in development', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production-key') // API_KEY
        .mockReturnValueOnce('dev-key') // API_KEY_DEV
        .mockReturnValueOnce('development'); // NODE_ENV

      const result = service.validateApiKey('dev-key');

      expect(result).toBe(true);
    });

    it('should validate production API key in development', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production-key') // API_KEY
        .mockReturnValueOnce('dev-key') // API_KEY_DEV
        .mockReturnValueOnce('development'); // NODE_ENV

      const result = service.validateApiKey('production-key');

      expect(result).toBe(true);
    });

    it('should reject invalid API key', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production-key') // API_KEY
        .mockReturnValueOnce('dev-key') // API_KEY_DEV
        .mockReturnValueOnce('development'); // NODE_ENV

      const result = service.validateApiKey('invalid-key');

      expect(result).toBe(false);
    });

    it('should reject development API key in production', () => {
      (configService.get as jest.Mock)
        .mockReturnValueOnce('production-key') // API_KEY
        .mockReturnValueOnce('dev-key') // API_KEY_DEV
        .mockReturnValueOnce('production'); // NODE_ENV

      const result = service.validateApiKey('dev-key');

      expect(result).toBe(false);
    });
  });
}); 