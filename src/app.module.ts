import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CollectionsController } from './collections/collections.controller';
import { CollectionsService } from './collections/collections.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // File upload configuration
    MulterModule.register({
      storage: 'memory', // Store files in memory as buffers
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    AdminModule,
    FilesModule,
    NotificationsModule,
  ],
  controllers: [AppController, CollectionsController],
  providers: [AppService, CollectionsService],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // No middleware configuration needed
  }
}
