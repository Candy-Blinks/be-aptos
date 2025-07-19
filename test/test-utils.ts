import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';
import { User, Post } from '@prisma/client';

export class TestUtils {
  static createMockPrismaService() {
    return {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      post: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      like: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      comment: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      follower: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      accessLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      errorLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      collection: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      setUserContext: jest.fn(),
      clearUserContext: jest.fn(),
    };
  }

  static createMockConfigService() {
    return {
      get: jest.fn((key: string) => {
        const config = {
          API_KEY: 'test-api-key',
          API_KEY_DEV: 'test-dev-api-key',
          JWT_SECRET: 'test-jwt-secret',
          NODE_ENV: 'test',
          ADMIN_PASSWORD: 'test-admin-password',
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-api-key',
          CLOUDINARY_API_SECRET: 'test-api-secret',
        };
        return config[key];
      }),
    };
  }

  static createMockJwtService() {
    return {
      sign: jest.fn(() => 'mock-jwt-token'),
      verify: jest.fn(() => ({ aptosAddress: 'test-address', userId: 'test-user-id' })),
    };
  }

  static createMockFilesService() {
    return {
      uploadImage: jest.fn(() => Promise.resolve('https://mock-cloudinary-url.com/image.jpg')),
      uploadMultipleImages: jest.fn(() => Promise.resolve(['https://mock-cloudinary-url.com/image1.jpg'])),
      deleteImage: jest.fn(() => Promise.resolve()),
      extractPublicId: jest.fn(() => 'mock-public-id'),
    };
  }

  static createMockNotificationsGateway() {
    return {
      notifyNewPost: jest.fn(),
      notifyUserFollow: jest.fn(),
      notifyPostLike: jest.fn(),
    };
  }

  static createMockUser(): User {
    return {
      id: 'test-user-id',
      username: 'testuser',
      aptos_address: 'test-aptos-address',
      display_name: 'Test User',
      header_url: null,
      profile_url: null,
      bio: null,
      activity_points: 0,
      created_at: new Date(),
      updated_at: new Date(),
      socials: {
        website: '',
        x: '',
        tiktok: '',
        linkedin: '',
        youtube: '',
        instagram: '',
        facebook: '',
      },
    };
  }

  static createMockPost(): Post {
    return {
      id: 'test-post-id',
      user_id: 'test-user-id',
      content: 'Test post content',
      media_urls: [],
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  static async generateValidApiHeaders(): Promise<Record<string, string>> {
    return {
      'X-API-KEY': 'test-api-key',
      'Content-Type': 'application/json',
    };
  }

  static async generateValidJwtHeaders(jwtService?: JwtService): Promise<Record<string, string>> {
    const token = jwtService?.sign({ aptosAddress: 'test-address' }) || 'mock-jwt-token';
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static createMockFile(): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('mock-file-content'),
      destination: '/tmp',
      filename: 'test-image.jpg',
      path: '/tmp/test-image.jpg',
      stream: null as any,
    };
  }

  static async cleanupTestData(prisma: PrismaService) {
    // Clean up test data in reverse dependency order
    await prisma.like.deleteMany({ where: { user_id: { contains: 'test-' } } });
    await prisma.comment.deleteMany({ where: { user_id: { contains: 'test-' } } });
    await prisma.share.deleteMany({ where: { user_id: { contains: 'test-' } } });
    await prisma.follower.deleteMany({ where: { follower_id: { contains: 'test-' } } });
    await prisma.post.deleteMany({ where: { user_id: { contains: 'test-' } } });
    await prisma.user.deleteMany({ where: { id: { contains: 'test-' } } });
    await prisma.accessLog.deleteMany({ where: { user_id: { contains: 'test-' } } });
    await prisma.errorLog.deleteMany({ where: { user_id: { contains: 'test-' } } });
  }
} 