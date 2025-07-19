import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { Post, User } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    // Find the user by aptos_address
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: createPostDto.aptos_address },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload images to Cloudinary if provided
    let mediaUrls: string[] = [];
    if (createPostDto.files && createPostDto.files.length > 0) {
      mediaUrls = await this.filesService.uploadMultipleImages(
        createPostDto.files,
        'posts',
      );
    }

    // Create the post
    const post = await this.prisma.post.create({
      data: {
        user_id: user.id,
        content: createPostDto.content,
        media_urls: mediaUrls,
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

    // TODO: Implement real-time notifications for followers
    // This will be handled by the notifications module

    return post;
  }

  async getFeed(getFeedDto: GetFeedDto): Promise<Post[]> {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: getFeedDto.aptos_address },
      include: {
        following: {
          select: {
            following_id: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the IDs of users this user is following
    const followingIds = user.following.map((f) => f.following_id);
    
    // Include the user's own posts in the feed
    followingIds.push(user.id);

    // Get posts from followed users (and own posts)
    const posts = await this.prisma.post.findMany({
      where: {
        user_id: {
          in: followingIds,
        },
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
        comments: {
          take: 3,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                profile_url: true,
              },
            },
          },
        },
        likes: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: getFeedDto.take,
      skip: getFeedDto.skip,
    });

    return posts;
  }

  async findById(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                profile_url: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async likePost(postId: string, aptosAddress: string): Promise<{ liked: boolean }> {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.like.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await this.prisma.$transaction([
        this.prisma.like.delete({
          where: {
            post_id_user_id: {
              post_id: postId,
              user_id: user.id,
            },
          },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: {
            like_count: {
              decrement: 1,
            },
          },
        }),
      ]);
      return { liked: false };
    } else {
      // Like the post
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: {
            post_id: postId,
            user_id: user.id,
          },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: {
            like_count: {
              increment: 1,
            },
          },
        }),
      ]);
      return { liked: true };
    }
  }
} 