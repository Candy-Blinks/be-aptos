import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePointsDto } from './dto/update-points.dto';
import { TestUtils } from '../../test/test-utils';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByAptosAddress: jest.fn(),
            incrementPoints: jest.fn(),
            decrementPoints: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(require('../auth/guards/api-key.guard').ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      aptos_address: 'test-aptos-address',
      display_name: 'Test User',
      bio: 'Test bio',
    };

    it('should create a user successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors', async () => {
      (usersService.create as jest.Mock).mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('findByAptosAddress', () => {
    it('should find user by aptos address successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      (usersService.findByAptosAddress as jest.Mock).mockResolvedValue(
        mockUser,
      );

      const result = await controller.findByAptosAddress('test-aptos-address');

      expect(usersService.findByAptosAddress).toHaveBeenCalledWith(
        'test-aptos-address',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error when aptos_address is missing', async () => {
      await expect(controller.findByAptosAddress('')).rejects.toThrow(
        'aptos_address query parameter is required',
      );
    });

    it('should throw error when aptos_address is undefined', async () => {
      await expect(
        controller.findByAptosAddress(undefined as any),
      ).rejects.toThrow('aptos_address query parameter is required');
    });
  });

  describe('incrementPoints', () => {
    const updatePointsDto: UpdatePointsDto = {
      aptos_address: 'test-aptos-address',
      points: 10,
    };

    it('should increment user points successfully', async () => {
      const mockUser = { ...TestUtils.createMockUser(), activity_points: 10 };
      (usersService.incrementPoints as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.incrementPoints(updatePointsDto);

      expect(usersService.incrementPoints).toHaveBeenCalledWith(
        updatePointsDto,
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors', async () => {
      (usersService.incrementPoints as jest.Mock).mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.incrementPoints(updatePointsDto)).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('decrementPoints', () => {
    const updatePointsDto: UpdatePointsDto = {
      aptos_address: 'test-aptos-address',
      points: 5,
    };

    it('should decrement user points successfully', async () => {
      const mockUser = { ...TestUtils.createMockUser(), activity_points: 5 };
      (usersService.decrementPoints as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.decrementPoints(updatePointsDto);

      expect(usersService.decrementPoints).toHaveBeenCalledWith(
        updatePointsDto,
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle service errors', async () => {
      (usersService.decrementPoints as jest.Mock).mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.decrementPoints(updatePointsDto)).rejects.toThrow(
        'Service error',
      );
    });
  });
});
