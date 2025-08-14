import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Global error handling to prevent crashes
const logger = new Logger('Main');

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit the process for Redis connection errors
  if (
    error.message?.includes('ECONNRESET') ||
    error.message?.includes('Redis')
  ) {
    logger.warn('Redis connection error caught, continuing without Redis');
    return;
  }
  // For other critical errors, exit gracefully
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (like mobile apps or Postman) in development
      if (!origin && nodeEnv === 'development') {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (
        allowedOrigins.includes(origin || '') ||
        allowedOrigins.includes('*')
      ) {
        return callback(null, true);
      }

      // Reject origin
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('CandyBlinks Backend API')
    .setDescription(
      'A production-ready backend for CandyBlinks socialfi platform',
    )
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .addTag('posts', 'Post management endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('admin', 'Admin-only endpoints')
    .addTag('files', 'File upload endpoints')
    .addTag('collections', 'NFT collections endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'CB-API-KEY',
        in: 'header',
        description: 'API key for non-admin endpoints',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'CandyBlinks API Documentation',
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  const port = configService.get<number>('PORT', 3000);

  const startServer = async (retryCount = 0) => {
    try {
      await app.listen(port);
      logger.log(`🚀 Application is running on: http://localhost:${port}`);
      logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
      logger.log(`🌍 Environment: ${nodeEnv}`);
      logger.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'EADDRINUSE' &&
        retryCount < 5
      ) {
        logger.warn(
          `Port ${port} is busy. Retrying in 5 seconds... (${
            retryCount + 1
          }/5)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await startServer(retryCount + 1);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : '';
        logger.error(`Failed to start server: ${message}`, stack);
        process.exit(1);
      }
    }
  };

  await startServer();
}

void bootstrap();
