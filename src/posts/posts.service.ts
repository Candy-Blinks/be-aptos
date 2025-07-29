import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFollowingFeedDto } from './dto/get-following-feed.dto';
import { Post, User, Comment, Like } from '@prisma/client';
import { UpdatePostDto } from './dto/update-post.dto';
import { SharePostDto } from './dto/share-post.dto';
import { GetGlobalFeedDto } from './dto/get-global-feed.dto';

export type PostWithRelations = Post & {
  user: User;
  comments: (Comment & { user: User })[];
  likes: (Like & { user: User })[];
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<PostWithRelations> {
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
        has_blink: createPostDto.has_blink ?? false,
        collection_uri: createPostDto.collection_uri,
        media_urls: mediaUrls,
        has_shared_post: false, // Explicitly set default
        shared_post_id: null, // Explicitly set default
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

    return post as PostWithRelations;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    aptosAddress: string,
  ): Promise<Post> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user_id !== user.id) {
      throw new UnauthorizedException('You can only edit your own posts');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { aptos_address, ...postData } = updatePostDto;

    return this.prisma.post.update({
      where: { id },
      data: postData,
    });
  }

  async remove(id: string, aptosAddress: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: aptosAddress },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.user_id !== user.id) {
      throw new UnauthorizedException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id } });
  }

  async getGlobalFeed(
    getGlobalFeedDto: GetGlobalFeedDto,
  ): Promise<PostWithRelations[]> {
    const posts = await this.prisma.post.findMany({
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
      take: getGlobalFeedDto.take,
      skip: getGlobalFeedDto.skip,
    });

    return posts as PostWithRelations[];
  }

  async getFollowingFeed(
    getFollowingFeedDto: GetFollowingFeedDto,
  ): Promise<PostWithRelations[]> {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { aptos_address: getFollowingFeedDto.aptos_address },
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

    // Get IDs of users being followed
    const followingIds = user.following.map((f) => f.following_id);

    // Include the user's own posts in the feed
    followingIds.push(user.id);

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
      take: getFollowingFeedDto.take,
      skip: getFollowingFeedDto.skip,
    });

    return posts as PostWithRelations[];
  }

  async findById(id: string): Promise<PostWithRelations> {
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

    return post as PostWithRelations;
  }

  async likePost(
    postId: string,
    aptosAddress: string,
  ): Promise<{ liked: boolean }> {
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

  async share(
    originalPostId: string,
    sharePostDto: SharePostDto,
  ): Promise<Post> {
    const sharer = await this.prisma.user.findUnique({
      where: { aptos_address: sharePostDto.aptos_address },
    });
    if (!sharer) {
      throw new NotFoundException('User not found');
    }

    const originalPost = await this.prisma.post.findUnique({
      where: { id: originalPostId },
    });
    if (!originalPost) {
      throw new NotFoundException('Original post not found');
    }

    // Create a new post for the share
    const sharePost = await this.prisma.post.create({
      data: {
        user_id: sharer.id,
        content: sharePostDto.content ?? '',
        has_shared_post: true,
        shared_post_id: originalPostId,
        has_blink: false, // Explicitly set default
        collection_uri: null, // Explicitly set default
      },
    });

    // Increment the share_count of the original post
    await this.prisma.post.update({
      where: { id: originalPostId },
      data: {
        share_count: {
          increment: 1,
        },
      },
    });

    return sharePost;
  }
}
