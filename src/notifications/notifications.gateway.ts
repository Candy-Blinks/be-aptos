import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private redis: Redis | null = null;
  private pubSubRedis: Redis | null = null;
  private connectedUsers = new Map<string, string>(); // socketId -> aptosAddress
  private redisEnabled = false;

  constructor(private configService: ConfigService) {
    // Initialize Redis asynchronously (non-blocking)
    this.initializeRedis().catch((error) => {
      this.logger.warn('Redis initialization failed during construction:', error.message);
    });
  }

  private async initializeRedis() {
    try {
      // Check if Redis is enabled via configuration
      const redisEnabled = this.configService.get<string>('REDIS_ENABLED', 'false').toLowerCase();
      if (redisEnabled === 'false' || redisEnabled === '0' || redisEnabled === 'disabled') {
        this.logger.log('Redis is disabled via REDIS_ENABLED configuration. Running without Redis support.');
        this.redisEnabled = false;
        return;
      }

      const redisHost = this.configService.get<string>('REDIS_HOST');
      const redisPort = this.configService.get<string>('REDIS_PORT');
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

      // Skip Redis initialization if environment variables are not set, empty, or contain placeholder values
      if (!redisHost || !redisPort || 
          redisHost.trim() === '' || redisPort.trim() === '' ||
          redisHost.includes('your-') || redisPort.includes('your-') ||
          redisHost === 'undefined' || redisPort === 'undefined') {
        this.logger.log('Redis configuration not found. Running without Redis support.');
        this.redisEnabled = false;
        return;
      }

      const portNumber = parseInt(redisPort, 10);
      if (isNaN(portNumber) || portNumber <= 0 || portNumber >= 65536) {
        this.logger.warn('Invalid Redis port. Running without Redis support.');
        this.redisEnabled = false;
        return;
      }

      const redisConfig = {
        host: redisHost,
        port: portNumber,
        password: redisPassword || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        commandTimeout: 5000,
        // Enable TLS for Upstash Redis
        tls: redisHost.includes('upstash.io') ? {} : undefined,
        // Additional Upstash-specific settings
        family: 4, // Use IPv4
        keepAlive: 30000, // Keep connection alive for 30 seconds
      };

      this.logger.log(`Attempting to connect to Redis at ${redisHost}:${portNumber}`);

      this.redis = new Redis(redisConfig);
      this.pubSubRedis = new Redis(redisConfig);

      // Handle Redis connection events with proper error handling
      if (this.redis) {
        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
          this.redisEnabled = true;
        });

        this.redis.on('error', (error) => {
          this.logger.warn('Redis connection error (continuing without Redis):', error.message);
          this.redisEnabled = false;
        });

        this.redis.on('close', () => {
          this.logger.warn('Redis connection closed');
          this.redisEnabled = false;
        });

        this.redis.on('reconnecting', () => {
          this.logger.log('Redis reconnecting...');
        });
      }

      // Handle pub/sub Redis events
      if (this.pubSubRedis) {
        this.pubSubRedis.on('connect', () => {
          if (this.pubSubRedis) {
            this.pubSubRedis.subscribe('new_post', 'user_follow', 'post_like')
              .then(() => {
                this.logger.log('Subscribed to Redis pub/sub channels');
              })
              .catch((error) => {
                this.logger.warn('Failed to subscribe to Redis channels:', error.message);
              });
          }
        });

        this.pubSubRedis.on('error', (error) => {
          this.logger.warn('Redis pub/sub connection error (continuing without Redis):', error.message);
        });

        this.pubSubRedis.on('close', () => {
          this.logger.warn('Redis pub/sub connection closed');
        });

        this.pubSubRedis.on('message', (channel, message) => {
          this.handleRedisMessage(channel, message);
        });
      }

      // Connect to Redis with timeout and error handling
      const connectPromises: Promise<void>[] = [];

      if (this.redis) {
        connectPromises.push(
          this.redis.connect().catch((error) => {
            this.logger.warn('Failed to connect to Redis (continuing without Redis):', error.message);
            this.redisEnabled = false;
            this.redis = null;
          })
        );
      }

      if (this.pubSubRedis) {
        connectPromises.push(
          this.pubSubRedis.connect().catch((error) => {
            this.logger.warn('Failed to connect to Redis pub/sub (continuing without Redis):', error.message);
            this.pubSubRedis = null;
          })
        );
      }

      // Wait for connections with timeout
      await Promise.allSettled(connectPromises);

    } catch (error) {
      this.logger.warn('Redis initialization failed (continuing without Redis):', error.message);
      this.redisEnabled = false;
      this.redis = null;
      this.pubSubRedis = null;
    }
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const aptosAddress = this.connectedUsers.get(client.id);
    if (aptosAddress) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`User ${aptosAddress} disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { aptosAddress: string },
  ) {
    try {
      if (!data.aptosAddress) {
        client.emit('auth_error', { message: 'Aptos address required' });
        return;
      }

      // Store user connection
      this.connectedUsers.set(client.id, data.aptosAddress);
      
      // Join user to their personal room
      client.join(`user:${data.aptosAddress}`);
      
      this.logger.log(`User authenticated: ${data.aptosAddress} (${client.id})`);
      client.emit('authenticated', { status: 'success', redisEnabled: this.redisEnabled });
    } catch (error) {
      this.logger.error('Authentication error:', error);
      client.emit('auth_error', { message: 'Authentication failed' });
    }
  }

  @SubscribeMessage('join_feed')
  async handleJoinFeed(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { aptosAddress: string },
  ) {
    try {
      // Join user to their feed room
      client.join(`feed:${data.aptosAddress}`);
      this.logger.log(`User joined feed: ${data.aptosAddress}`);
      client.emit('feed_joined', { status: 'success' });
    } catch (error) {
      this.logger.error('Join feed error:', error);
    }
  }

  private async handleRedisMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);

      switch (channel) {
        case 'new_post':
          await this.handleNewPost(data);
          break;
        case 'user_follow':
          await this.handleUserFollow(data);
          break;
        case 'post_like':
          await this.handlePostLike(data);
          break;
      }
    } catch (error) {
      this.logger.error(`Error handling Redis message on ${channel}:`, error);
    }
  }

  private async handleNewPost(data: {
    postId: string;
    authorAptosAddress: string;
    followerIds: string[];
    post: any;
  }) {
    // Notify all followers about the new post
    data.followerIds.forEach((followerId) => {
      this.server.to(`feed:${followerId}`).emit('new_post', {
        type: 'new_post',
        post: data.post,
        author: data.authorAptosAddress,
        timestamp: new Date().toISOString(),
      });
    });

    this.logger.log(`New post notification sent to ${data.followerIds.length} followers`);
  }

  private async handleUserFollow(data: {
    followerId: string;
    followingId: string;
  }) {
    // Notify the user who was followed
    this.server.to(`user:${data.followingId}`).emit('new_follower', {
      type: 'new_follower',
      follower: data.followerId,
      timestamp: new Date().toISOString(),
    });
  }

  private async handlePostLike(data: {
    postId: string;
    likerAptosAddress: string;
    postAuthorAptosAddress: string;
  }) {
    // Notify the post author about the like
    this.server.to(`user:${data.postAuthorAptosAddress}`).emit('post_liked', {
      type: 'post_liked',
      postId: data.postId,
      liker: data.likerAptosAddress,
      timestamp: new Date().toISOString(),
    });
  }

  // Public methods for other services to trigger notifications
  async notifyNewPost(postData: {
    postId: string;
    authorAptosAddress: string;
    followerIds: string[];
    post: any;
  }) {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping notification publish');
      return;
    }
    
    try {
      await this.redis.publish('new_post', JSON.stringify(postData));
    } catch (error) {
      this.logger.error('Failed to publish new post notification:', error);
    }
  }

  async notifyUserFollow(followData: {
    followerId: string;
    followingId: string;
  }) {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping notification publish');
      return;
    }

    try {
      await this.redis.publish('user_follow', JSON.stringify(followData));
    } catch (error) {
      this.logger.error('Failed to publish user follow notification:', error);
    }
  }

  async notifyPostLike(likeData: {
    postId: string;
    likerAptosAddress: string;
    postAuthorAptosAddress: string;
  }) {
    if (!this.redisEnabled || !this.redis) {
      this.logger.warn('Redis not available, skipping notification publish');
      return;
    }

    try {
      await this.redis.publish('post_like', JSON.stringify(likeData));
    } catch (error) {
      this.logger.error('Failed to publish post like notification:', error);
    }
  }
} 