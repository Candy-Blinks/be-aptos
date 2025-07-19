import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';
import { LoggingModule } from './logging/logging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { LoggingMiddleware } from './logging/logging.middleware';
import { CollectionsController } from './collections/collections.controller';
import { CollectionsService } from './collections/collections.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
    LoggingModule,
    NotificationsModule,
  ],
  controllers: [AppController, CollectionsController],
  providers: [AppService, CollectionsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logging middleware to all routes
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
