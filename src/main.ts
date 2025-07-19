import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

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
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

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
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
}

void bootstrap();
