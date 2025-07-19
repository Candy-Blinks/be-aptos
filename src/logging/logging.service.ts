import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AccessLogData {
  userId?: string;
  username?: string;
  aptosAddress?: string;
  ipAddress: string;
  endpoint: string;
  method: string;
  status: number;
  requestBody?: any;
  responseBody?: any;
}

export interface ErrorLogData {
  userId?: string;
  username?: string;
  aptosAddress?: string;
  ipAddress: string;
  endpoint: string;
  method: string;
  errorMessage: string;
  stackTrace?: string;
}

@Injectable()
export class LoggingService {
  constructor(private prisma: PrismaService) {}

  async logAccess(data: AccessLogData): Promise<void> {
    try {
      await this.prisma.accessLog.create({
        data: {
          user_id: data.userId || null,
          username: data.username || null,
          aptos_address: data.aptosAddress || null,
          ip_address: data.ipAddress,
          endpoint: data.endpoint,
          method: data.method,
          status: data.status,
          request_body: data.requestBody || null,
          response_body: data.responseBody || null,
        },
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Failed to log access:', error);
    }
  }

  async logError(data: ErrorLogData): Promise<void> {
    try {
      await this.prisma.errorLog.create({
        data: {
          user_id: data.userId || null,
          username: data.username || null,
          aptos_address: data.aptosAddress || null,
          ip_address: data.ipAddress,
          endpoint: data.endpoint,
          method: data.method,
          error_message: data.errorMessage,
          stack_trace: data.stackTrace || null,
        },
      });
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Failed to log error:', error);
    }
  }

  async getAccessLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    aptosAddress?: string;
    endpoint?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    if (filters?.aptosAddress) {
      where.aptos_address = filters.aptosAddress;
    }

    if (filters?.endpoint) {
      where.endpoint = {
        contains: filters.endpoint,
        mode: 'insensitive',
      };
    }

    return this.prisma.accessLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: filters?.skip || 0,
      take: filters?.take || 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            aptos_address: true,
          },
        },
      },
    });
  }

  async getErrorLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    aptosAddress?: string;
    endpoint?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.created_at = {};
      if (filters.startDate) {
        where.created_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.created_at.lte = filters.endDate;
      }
    }

    if (filters?.aptosAddress) {
      where.aptos_address = filters.aptosAddress;
    }

    if (filters?.endpoint) {
      where.endpoint = {
        contains: filters.endpoint,
        mode: 'insensitive',
      };
    }

    return this.prisma.errorLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: filters?.skip || 0,
      take: filters?.take || 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            aptos_address: true,
          },
        },
      },
    });
  }
} 