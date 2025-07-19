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

@Controller('posts')
@UseGuards(ApiKeyGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async create(
    @Body(ValidationPipe) createPostDto: CreatePostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Add files to the DTO
    createPostDto.files = files;
    return this.postsService.create(createPostDto);
  }

  @Get('feed')
  async getFeed(@Query(ValidationPipe) getFeedDto: GetFeedDto) {
    return this.postsService.getFeed(getFeedDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Post(':id/like')
  async likePost(
    @Param('id') postId: string,
    @Body('aptos_address') aptosAddress: string,
  ) {
    return this.postsService.likePost(postId, aptosAddress);
  }
} 