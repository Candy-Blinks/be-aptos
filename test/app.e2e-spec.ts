import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TestUtils } from './test-utils';
import { TestDatabase } from './test-database';

describe('Social Media API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtToken: string;
  let testUserId: string;
  let testPostId: string;

  beforeAll(async () => {
    // Check if test database is available
    const isAvailable = await TestDatabase.isAvailable();
    if (!isAvailable) {
      console.warn('Skipping E2E tests: Test database not available');
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
    
    // Setup clean test database
    await TestDatabase.cleanup();
  }, 30000);

  afterAll(async () => {
    if (prismaService) {
      await TestUtils.cleanupTestData(prismaService);
    }
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    await TestUtils.cleanupTestData(prismaService);
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });
  });

  describe('Authentication Flow', () => {
    describe('/auth/login (POST)', () => {
      beforeEach(async () => {
        // Create a test user first
        const testUser = await prismaService.user.create({
          data: {
            username: 'testadmin',
            aptos_address: 'test-admin-address',
            display_name: 'Test Admin',
          },
        });
        testUserId = testUser.id;
      });

      it('should login with correct credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            aptos_address: 'test-admin-address',
            password: 'test-admin-password',
          })
          .expect(200);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.aptos_address).toBe('test-admin-address');
        
        jwtToken = response.body.access_token;
      });

      it('should reject invalid credentials', async () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            aptos_address: 'test-admin-address',
            password: 'wrong-password',
          })
          .expect(401);
      });

      it('should reject non-existent user', async () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            aptos_address: 'non-existent-address',
            password: 'test-admin-password',
          })
          .expect(401);
      });
    });
  });

  describe('Users API', () => {
    const apiHeaders = { 'CB-API-KEY': 'test-api-key' };

    describe('/api/users (POST)', () => {
      it('should create a new user with valid data', async () => {
        const userData = {
          username: 'testuser123',
          aptos_address: 'test-user-address-123',
          display_name: 'Test User 123',
          bio: 'This is a test user',
        };

        const response = await request(app.getHttpServer())
          .post('/api/users')
          .set(apiHeaders)
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.username).toBe('testuser123');
        expect(response.body.aptos_address).toBe('test-user-address-123');
        expect(response.body.display_name).toBe('Test User 123');
        expect(response.body.activity_points).toBe(0);
        
        testUserId = response.body.id;
      });

      it('should reject duplicate username', async () => {
        // Create first user
        await prismaService.user.create({
          data: {
            username: 'duplicate',
            aptos_address: 'address1',
            display_name: 'User 1',
          },
        });

        // Try to create second user with same username
        return request(app.getHttpServer())
          .post('/api/users')
          .set(apiHeaders)
          .send({
            username: 'duplicate',
            aptos_address: 'address2',
            display_name: 'User 2',
          })
          .expect(409);
      });

      it('should reject duplicate aptos_address', async () => {
        // Create first user
        await prismaService.user.create({
          data: {
            username: 'user1',
            aptos_address: 'duplicate-address',
            display_name: 'User 1',
          },
        });

        // Try to create second user with same address
        return request(app.getHttpServer())
          .post('/api/users')
          .set(apiHeaders)
          .send({
            username: 'user2',
            aptos_address: 'duplicate-address',
            display_name: 'User 2',
          })
          .expect(409);
      });

      it('should reject request without API key', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .send({
            username: 'testuser',
            aptos_address: 'test-address',
            display_name: 'Test User',
          })
          .expect(401);
      });

      it('should reject invalid data', async () => {
        return request(app.getHttpServer())
          .post('/api/users')
          .set(apiHeaders)
          .send({
            username: 'ab', // Too short
            aptos_address: 'test-address',
            display_name: 'Test User',
          })
          .expect(400);
      });
    });

    describe('/api/users (GET)', () => {
      beforeEach(async () => {
        const testUser = await prismaService.user.create({
          data: {
            username: 'getuser',
            aptos_address: 'get-user-address',
            display_name: 'Get User',
          },
        });
        testUserId = testUser.id;
      });

      it('should get user by aptos_address', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users?aptos_address=get-user-address')
          .set(apiHeaders)
          .expect(200);

        expect(response.body.username).toBe('getuser');
        expect(response.body.aptos_address).toBe('get-user-address');
        expect(response.body).toHaveProperty('posts');
        expect(response.body).toHaveProperty('_count');
      });

      it('should return 404 for non-existent user', async () => {
        return request(app.getHttpServer())
          .get('/api/users?aptos_address=non-existent')
          .set(apiHeaders)
          .expect(404);
      });

      it('should require aptos_address parameter', async () => {
        return request(app.getHttpServer())
          .get('/api/users')
          .set(apiHeaders)
          .expect(500); // Will throw error about missing parameter
      });
    });

    describe('/api/users/increment-points (POST)', () => {
      beforeEach(async () => {
        const testUser = await prismaService.user.create({
          data: {
            username: 'pointsuser',
            aptos_address: 'points-user-address',
            display_name: 'Points User',
            activity_points: 10,
          },
        });
        testUserId = testUser.id;
      });

      it('should increment user points', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/users/increment-points')
          .set(apiHeaders)
          .send({
            aptos_address: 'points-user-address',
            points: 5,
          })
          .expect(201);

        expect(response.body.activity_points).toBe(15);
      });

      it('should reject invalid points value', async () => {
        return request(app.getHttpServer())
          .post('/api/users/increment-points')
          .set(apiHeaders)
          .send({
            aptos_address: 'points-user-address',
            points: 0, // Must be at least 1
          })
          .expect(400);
      });
    });

    describe('/api/users/decrement-points (POST)', () => {
      beforeEach(async () => {
        const testUser = await prismaService.user.create({
          data: {
            username: 'decrementuser',
            aptos_address: 'decrement-user-address',
            display_name: 'Decrement User',
            activity_points: 10,
          },
        });
        testUserId = testUser.id;
      });

      it('should decrement user points', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/users/decrement-points')
          .set(apiHeaders)
          .send({
            aptos_address: 'decrement-user-address',
            points: 3,
          })
          .expect(201);

        expect(response.body.activity_points).toBe(7);
      });

      it('should not go below zero points', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/users/decrement-points')
          .set(apiHeaders)
          .send({
            aptos_address: 'decrement-user-address',
            points: 15, // More than current points
          })
          .expect(201);

        expect(response.body.activity_points).toBe(0);
      });
    });
  });

  describe('Posts API', () => {
    const apiHeaders = { 'CB-API-KEY': 'test-api-key' };

    beforeEach(async () => {
      const testUser = await prismaService.user.create({
        data: {
          username: 'postuser',
          aptos_address: 'post-user-address',
          display_name: 'Post User',
        },
      });
      testUserId = testUser.id;
    });

    describe('/api/posts (POST)', () => {
      it('should create a new post', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/posts')
          .set(apiHeaders)
          .send({
            aptos_address: 'post-user-address',
            content: 'This is a test post',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toBe('This is a test post');
        expect(response.body.like_count).toBe(0);
        expect(response.body.comment_count).toBe(0);
        expect(response.body).toHaveProperty('user');
        
        testPostId = response.body.id;
      });

      it('should reject post from non-existent user', async () => {
        return request(app.getHttpServer())
          .post('/api/posts')
          .set(apiHeaders)
          .send({
            aptos_address: 'non-existent-address',
            content: 'This should fail',
          })
          .expect(404);
      });

      it('should reject empty content', async () => {
        return request(app.getHttpServer())
          .post('/api/posts')
          .set(apiHeaders)
          .send({
            aptos_address: 'post-user-address',
            content: '',
          })
          .expect(400);
      });
    });

    describe('/api/posts/feed (GET)', () => {
      beforeEach(async () => {
        // Create a post for the feed
        const post = await prismaService.post.create({
          data: {
            user_id: testUserId,
            content: 'Feed post content',
          },
        });
        testPostId = post.id;
      });

      it('should get user feed', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/posts/feed?aptos_address=post-user-address&take=10&skip=0')
          .set(apiHeaders)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(0);
        
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('id');
          expect(response.body[0]).toHaveProperty('content');
          expect(response.body[0]).toHaveProperty('user');
        }
      });

      it('should handle pagination parameters', async () => {
        return request(app.getHttpServer())
          .get('/api/posts/feed?aptos_address=post-user-address&take=5&skip=0')
          .set(apiHeaders)
          .expect(200);
      });
    });

    describe('/api/posts/:id/like (POST)', () => {
      beforeEach(async () => {
        const post = await prismaService.post.create({
          data: {
            user_id: testUserId,
            content: 'Post to like',
          },
        });
        testPostId = post.id;
      });

      it('should like a post', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/posts/${testPostId}/like`)
          .set(apiHeaders)
          .send({
            aptos_address: 'post-user-address',
          })
          .expect(201);

        expect(response.body).toHaveProperty('liked', true);
      });

      it('should unlike a post', async () => {
        // First like the post
        await request(app.getHttpServer())
          .post(`/api/posts/${testPostId}/like`)
          .set(apiHeaders)
          .send({
            aptos_address: 'post-user-address',
          });

        // Then unlike it
        const response = await request(app.getHttpServer())
          .post(`/api/posts/${testPostId}/like`)
          .set(apiHeaders)
          .send({
            aptos_address: 'post-user-address',
          })
          .expect(201);

        expect(response.body).toHaveProperty('liked', false);
      });
    });
  });

  describe('Admin API', () => {
    beforeEach(async () => {
      // Create admin user and get JWT token
      const adminUser = await prismaService.user.create({
        data: {
          username: 'adminuser',
          aptos_address: 'admin-user-address',
          display_name: 'Admin User',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          aptos_address: 'admin-user-address',
          password: 'test-admin-password',
        });

      jwtToken = loginResponse.body.access_token;
    });

    describe('/api/admin/access-logs (GET)', () => {
      it('should get access logs with JWT authentication', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/admin/access-logs')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should reject requests without JWT', async () => {
        return request(app.getHttpServer())
          .get('/api/admin/access-logs')
          .expect(401);
      });

      it('should accept filter parameters', async () => {
        return request(app.getHttpServer())
          .get('/api/admin/access-logs?startDate=2023-01-01&endDate=2023-12-31')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);
      });
    });

    describe('/api/admin/error-logs (GET)', () => {
      it('should get error logs with JWT authentication', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/admin/error-logs')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('/api/admin/stats (GET)', () => {
      it('should get system stats', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${jwtToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
      });
    });
  });
});
