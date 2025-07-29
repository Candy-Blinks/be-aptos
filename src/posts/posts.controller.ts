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
  Patch,
  Delete,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService, PostWithRelations } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFollowingFeedDto } from './dto/get-following-feed.dto';
import { GetGlobalFeedDto } from './dto/get-global-feed.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AptosAddressDto } from './dto/aptos-address.dto';
import { SharePostDto } from './dto/share-post.dto';
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
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async create(
    @Body(ValidationPipe) createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<PostWithRelations> {
    // Add files to the DTO
    createPostDto.files = files;
    return this.postsService.create(createPostDto);
  }

  @Get('feed/global')
  @ApiOperation({ summary: 'Get global feed with all posts' })
  @ApiResponse({ status: 200, description: 'Global feed' })
  async getGlobalFeed(
    @Query(ValidationPipe) getGlobalFeedDto: GetGlobalFeedDto,
  ): Promise<PostWithRelations[]> {
    return this.postsService.getGlobalFeed(getGlobalFeedDto);
  }

  @Get('feed/following')
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
  async getFollowingFeed(
    @Query(ValidationPipe) getFollowingFeedDto: GetFollowingFeedDto,
  ): Promise<PostWithRelations[]> {
    return this.postsService.getFollowingFeed(getFollowingFeedDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'clx1234567890' })
  @ApiResponse({ status: 200, description: 'Post details' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findById(@Param('id') id: string): Promise<PostWithRelations> {
    return this.postsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'clx1234567890' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePostDto: UpdatePostDto,
  ) {
    return await this.postsService.update(
      id,
      updatePostDto,
      updatePostDto.aptos_address,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'clx1234567890' })
  @ApiBody({ type: AptosAddressDto })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @Body(ValidationPipe) aptosAddressDto: AptosAddressDto,
  ) {
    return await this.postsService.remove(id, aptosAddressDto.aptos_address);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like or unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID', example: 'clx1234567890' })
  @ApiBody({ type: AptosAddressDto })
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
    @Body(ValidationPipe) aptosAddressDto: AptosAddressDto,
  ) {
    return await this.postsService.likePost(
      postId,
      aptosAddressDto.aptos_address,
    );
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a post' })
  @ApiParam({
    name: 'id',
    description: 'Post ID to share',
    example: 'clx1234567890',
  })
  @ApiResponse({ status: 201, description: 'Post shared successfully' })
  @ApiResponse({ status: 404, description: 'User or original post not found' })
  async share(
    @Param('id') originalPostId: string,
    @Body(ValidationPipe) sharePostDto: SharePostDto,
  ) {
    return await this.postsService.share(originalPostId, sharePostDto);
  }
}
