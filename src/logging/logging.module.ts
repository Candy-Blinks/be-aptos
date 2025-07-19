import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingMiddleware } from './logging.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LoggingService, LoggingMiddleware],
  exports: [LoggingService, LoggingMiddleware],
})
export class LoggingModule {} 