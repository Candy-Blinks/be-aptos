import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { TestUtils } from '../../test/test-utils';

describe('PostsService', () => {
  let service: PostsService;
  let prismaService: PrismaService;
  let filesService: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: TestUtils.createMockPrismaService(),
        },
        {
          provide: FilesService,
          useValue: TestUtils.createMockFilesService(),
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    prismaService = module.get<PrismaService>(PrismaService);
    filesService = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPostDto: CreatePostDto = {
      aptos_address: 'test-aptos-address',
      content: 'Test post content',
    };

    it('should create a post without files successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      const mockPost = {
        ...TestUtils.createMockPost(),
        user: {
          id: mockUser.id,
          username: mockUser.username,
          display_name: mockUser.display_name,
          profile_url: mockUser.profile_url,
          aptos_address: mockUser.aptos_address,
        },
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.post.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.create(createPostDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
      });
      expect(prismaService.post.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          content: 'Test post content',
          media_urls: [],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              display_name: true,
              profile_url: true,
              aptos_address: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPost);
    });

    it('should create a post with files successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      const mockFiles = [TestUtils.createMockFile(), TestUtils.createMockFile()];
      const createPostDtoWithFiles = { ...createPostDto, files: mockFiles };
      const mockPost = {
        ...TestUtils.createMockPost(),
        media_urls: ['https://mock-cloudinary-url.com/image1.jpg'],
        user: {
          id: mockUser.id,
          username: mockUser.username,
          display_name: mockUser.display_name,
          profile_url: mockUser.profile_url,
          aptos_address: mockUser.aptos_address,
        },
      };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (filesService.uploadMultipleImages as jest.Mock).mockResolvedValue(['https://mock-cloudinary-url.com/image1.jpg']);
      (prismaService.post.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.create(createPostDtoWithFiles);

      expect(filesService.uploadMultipleImages).toHaveBeenCalledWith(mockFiles, 'posts');
      expect(prismaService.post.create).toHaveBeenCalledWith({
        data: {
          user_id: mockUser.id,
          content: 'Test post content',
          media_urls: ['https://mock-cloudinary-url.com/image1.jpg'],
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              display_name: true,
              profile_url: true,
              aptos_address: true,
            },
          },
        },
      });
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createPostDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.post.create).not.toHaveBeenCalled();
    });
  });

  describe('getFeed', () => {
    const getFeedDto: GetFeedDto = {
      aptos_address: 'test-aptos-address',
      take: 20,
      skip: 0,
    };

    it('should get feed successfully', async () => {
      const mockUser = {
        ...TestUtils.createMockUser(),
        following: [
          { following_id: 'user1' },
          { following_id: 'user2' },
        ],
      };
      const mockPosts = [
        {
          ...TestUtils.createMockPost(),
          user: { id: 'user1', username: 'user1', display_name: 'User 1' },
          comments: [],
          likes: [],
        },
      ];

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.post.findMany as jest.Mock).mockResolvedValue(mockPosts);

      const result = await service.getFeed(getFeedDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { aptos_address: 'test-aptos-address' },
        include: {
          following: {
            select: {
              following_id: true,
            },
          },
        },
      });

      expect(prismaService.post.findMany).toHaveBeenCalledWith({
        where: {
          user_id: {
            in: ['user1', 'user2', mockUser.id], // following + own posts
          },
        },
        include: expect.objectContaining({
          user: expect.any(Object),
          comments: expect.any(Object),
          likes: expect.any(Object),
        }),
        orderBy: { created_at: 'desc' },
        take: 20,
        skip: 0,
      });
      expect(result).toEqual(mockPosts);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getFeed(getFeedDto)).rejects.toThrow(NotFoundException);
      expect(prismaService.post.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find post by ID successfully', async () => {
      const mockPost = {
        ...TestUtils.createMockPost(),
        user: { id: 'user1', username: 'user1', display_name: 'User 1' },
        comments: [],
        likes: [],
      };

      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.findById('test-post-id');

      expect(prismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-post-id' },
        include: expect.objectContaining({
          user: expect.any(Object),
          comments: expect.any(Object),
          likes: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockPost);
    });

    it('should throw NotFoundException if post not found', async () => {
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('likePost', () => {
    const postId = 'test-post-id';
    const aptosAddress = 'test-aptos-address';

    it('should like a post successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      const mockPost = TestUtils.createMockPost();

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prismaService.like.findUnique as jest.Mock).mockResolvedValue(null); // No existing like
      (prismaService.$transaction as jest.Mock).mockResolvedValue([]);

      const result = await service.likePost(postId, aptosAddress);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { aptos_address: aptosAddress },
      });
      expect(prismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
      });
      expect(prismaService.like.findUnique).toHaveBeenCalledWith({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: mockUser.id,
          },
        },
      });
      expect(prismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // Like creation
        }),
        expect.objectContaining({
          // Post like count increment
        }),
      ]);
      expect(result).toEqual({ liked: true });
    });

    it('should unlike a post successfully', async () => {
      const mockUser = TestUtils.createMockUser();
      const mockPost = TestUtils.createMockPost();
      const mockLike = { id: 'like-id', post_id: postId, user_id: mockUser.id };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(mockPost);
      (prismaService.like.findUnique as jest.Mock).mockResolvedValue(mockLike); // Existing like
      (prismaService.$transaction as jest.Mock).mockResolvedValue([]);

      const result = await service.likePost(postId, aptosAddress);

      expect(prismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // Like deletion
        }),
        expect.objectContaining({
          // Post like count decrement
        }),
      ]);
      expect(result).toEqual({ liked: false });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.likePost(postId, aptosAddress)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if post not found', async () => {
      const mockUser = TestUtils.createMockUser();
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.likePost(postId, aptosAddress)).rejects.toThrow(NotFoundException);
    });
  });
}); 