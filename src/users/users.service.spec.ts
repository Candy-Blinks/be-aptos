import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePointsDto } from './dto/update-points.dto';
import { TestUtils } from '../../test/test-utils';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: TestUtils.createMockPrismaService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: 'testuser' },
            { aptos_address: 'test-aptos-address' },
          ],
        },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...createUserDto,
          username: 'testuser',
          socials: {
            website: '',
            x: '',
            tiktok: '',
            linkedin: '',
            youtube: '',
            instagram: '',
            facebook: '',
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if username already exists', async () => {
      const existingUser = { ...TestUtils.createMockUser(), username: 'testuser' };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if aptos_address already exists', async () => {
      const existingUser = { ...TestUtils.createMockUser(), aptos_address: 'test-aptos-address' };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should convert username to lowercase', async () => {
      const createUserDtoWithUppercase = { ...createUserDto, username: 'TestUser' };
      const mockUser = TestUtils.createMockUser();
      
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      await service.create(createUserDtoWithUppercase);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: 'testuser' },
            { aptos_address: 'test-aptos-address' },
          ],
        },
      });
    });

    it('should handle database errors', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto)).rejects.toThrow('Failed to create user: Database error');
    });
  });

  describe('findByAptosAddress', () => {
    it('should find user by aptos address successfully', async () => {
      const mockUser = {
        ...TestUtils.createMockUser(),
        posts: [],
        _count: { posts: 0, followers: 5, following: 10 },
      };
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findByAptosAddress('test-aptos-address');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
        include: {
          posts: {
            take: 10,
            orderBy: { created_at: 'desc' },
          },
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findByAptosAddress('nonexistent-address')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementPoints', () => {
    const updatePointsDto: UpdatePointsDto = {
      aptos_address: 'test-aptos-address',
      points: 10,
    };

    it('should increment user points successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      const updatedUser = { ...mockUser, activity_points: 10 };
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.incrementPoints(updatePointsDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
        data: {
          activity_points: {
            increment: 10,
          },
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.incrementPoints(updatePointsDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('decrementPoints', () => {
    const updatePointsDto: UpdatePointsDto = {
      aptos_address: 'test-aptos-address',
      points: 5,
    };

    it('should decrement user points successfully', async () => {
      const mockUser = { ...TestUtils.createMockUser(), activity_points: 10 };
      const updatedUser = { ...mockUser, activity_points: 5 };
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.decrementPoints(updatePointsDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
        data: {
          activity_points: 5, // Math.max(0, 10 - 5)
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should not allow points to go below 0', async () => {
      const mockUser = { ...TestUtils.createMockUser(), activity_points: 3 };
      const updatedUser = { ...mockUser, activity_points: 0 };
      
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.decrementPoints({ ...updatePointsDto, points: 10 });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
        data: {
          activity_points: 0, // Math.max(0, 3 - 10)
        },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.decrementPoints(updatePointsDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
