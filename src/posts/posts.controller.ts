import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('posts')
@Controller('posts')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({ summary: 'Create a new post' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aptos_address: {
          type: 'string',
          description: 'Aptos blockchain wallet address of the post author',
          example:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        content: {
          type: 'string',
          description: 'Content of the post',
          example: 'This is my first post!',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Optional files to upload with the post (max 10 files)',
        },
      },
      required: ['aptos_address', 'content'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    schema: {
      example: {
        id: 'clx1234567890',
        user_id: 'clx1234567890',
        content: 'This is my first post!',
        media_urls: ['https://example.com/image1.jpg'],
        like_count: 0,
        comment_count: 0,
        share_count: 0,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        user: {
          id: 'clx1234567890',
          username: 'johndoe',
          display_name: 'John Doe',
          profile_url: 'https://example.com/profile.jpg',
          aptos_address:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body(ValidationPipe) createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Add files to the DTO
    createPostDto.files = files;
    return this.postsService.create(createPostDto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get user feed with posts from followed users' })
  @ApiQuery({
    name: 'aptos_address',
    description: 'Aptos address of the user requesting the feed',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @ApiQuery({
    name: 'take',
    description: 'Number of posts to return (default: 20)',
    example: 20,
    required: false,
  })
  @ApiQuery({
    name: 'skip',
    description: 'Number of posts to skip (default: 0)',
    example: 0,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'User feed' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFeed(@Query(ValidationPipe) getFeedDto: GetFeedDto) {
    return this.postsService.getFeed(getFeedDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'clx1234567890' })
  @ApiResponse({ status: 200, description: 'Post details' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'clx1234567890' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aptos_address: {
          type: 'string',
          description: 'Aptos address of the user liking the post',
          example:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
      required: ['aptos_address'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Like status updated',
    schema: {
      example: {
        liked: true,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User or post not found' })
  async likePost(
    @Param('id') postId: string,
    @Body('aptos_address') aptosAddress: string,
  ) {
    return this.postsService.likePost(postId, aptosAddress);
  }
}
