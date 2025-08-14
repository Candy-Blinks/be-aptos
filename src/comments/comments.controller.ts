import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';

@ApiTags('comments')
@Controller('posts/:postId/comments')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment on a post' })
  @ApiParam({
    name: 'postId',
    description: 'Post ID',
    example: 'clx1234567890',
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'User or post not found' })
  create(
    @Param('postId') postId: string,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, createCommentDto);
  }

  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({
    name: 'postId',
    description: 'Post ID',
    example: 'clx1234567890',
  })
  @ApiParam({
    name: 'commentId',
    description: 'Comment ID',
    example: 'clx1234567890',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        aptos_address: {
          type: 'string',
          description: 'Aptos address of the user deleting the comment',
          example:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
      required: ['aptos_address'],
    },
  })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(
    @Param('commentId') commentId: string,
    @Body('aptos_address') aptosAddress: string,
  ) {
    return this.commentsService.remove(commentId, aptosAddress);
  }
}
