import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: createCommentDto.aptos_address },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.comment.create({
      data: {
        post_id: postId,
        user_id: user.id,
        content: createCommentDto.content,
      },
    });
  }

  async remove(
    commentId: string,
    aptosAddress: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== user.id && comment.post.user_id !== user.id) {
      throw new UnauthorizedException(
        'You can only delete your own comments or comments on your posts',
      );
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
