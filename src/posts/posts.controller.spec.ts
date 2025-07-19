import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { TestUtils } from '../../test/test-utils';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
            getFeed: jest.fn(),
            findById: jest.fn(),
            likePost: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(require('../auth/guards/api-key.guard').ApiKeyGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPostDto: CreatePostDto = {
      aptos_address: 'test-aptos-address',
      content: 'Test post content',
    };

    it('should create a post without files successfully', async () => {
      const mockPost = {
        ...TestUtils.createMockPost(),
        user: TestUtils.createMockUser(),
      };
      (postsService.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await controller.create(createPostDto);

      expect(postsService.create).toHaveBeenCalledWith({
        ...createPostDto,
        files: undefined,
      });
      expect(result).toEqual(mockPost);
    });

    it('should create a post with files successfully', async () => {
      const mockFiles = [TestUtils.createMockFile()];
      const mockPost = {
        ...TestUtils.createMockPost(),
        user: TestUtils.createMockUser(),
      };
      (postsService.create as jest.Mock).mockResolvedValue(mockPost);

      const result = await controller.create(createPostDto, mockFiles);

      expect(postsService.create).toHaveBeenCalledWith({
        ...createPostDto,
        files: mockFiles,
      });
      expect(result).toEqual(mockPost);
    });

    it('should handle service errors', async () => {
      (postsService.create as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.create(createPostDto)).rejects.toThrow('Service error');
    });
  });

  describe('getFeed', () => {
    const getFeedDto: GetFeedDto = {
      aptos_address: 'test-aptos-address',
      take: 20,
      skip: 0,
    };

    it('should get feed successfully', async () => {
      const mockPosts = [
        {
          ...TestUtils.createMockPost(),
          user: TestUtils.createMockUser(),
        },
      ];
      (postsService.getFeed as jest.Mock).mockResolvedValue(mockPosts);

      const result = await controller.getFeed(getFeedDto);

      expect(postsService.getFeed).toHaveBeenCalledWith(getFeedDto);
      expect(result).toEqual(mockPosts);
    });

    it('should handle service errors', async () => {
      (postsService.getFeed as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.getFeed(getFeedDto)).rejects.toThrow('Service error');
    });
  });

  describe('findById', () => {
    it('should find post by ID successfully', async () => {
      const mockPost = {
        ...TestUtils.createMockPost(),
        user: TestUtils.createMockUser(),
      };
      (postsService.findById as jest.Mock).mockResolvedValue(mockPost);

      const result = await controller.findById('test-post-id');

      expect(postsService.findById).toHaveBeenCalledWith('test-post-id');
      expect(result).toEqual(mockPost);
    });

    it('should handle service errors', async () => {
      (postsService.findById as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.findById('test-post-id')).rejects.toThrow('Service error');
    });
  });

  describe('likePost', () => {
    it('should like/unlike post successfully', async () => {
      const mockResult = { liked: true };
      (postsService.likePost as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.likePost('test-post-id', 'test-aptos-address');

      expect(postsService.likePost).toHaveBeenCalledWith('test-post-id', 'test-aptos-address');
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      (postsService.likePost as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(controller.likePost('test-post-id', 'test-aptos-address')).rejects.toThrow('Service error');
    });
  });
}); 