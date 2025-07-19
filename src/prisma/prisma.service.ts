import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface UserContext {
  userId?: string;
  username?: string;
  aptosAddress?: string;
  ipAddress?: string;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private userContext: UserContext = {};
  constructor() {
    super();

    // Add middleware to log database changes
    this.$use(async (params, next) => {
      const start = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await next(params);
      const end = Date.now();

      // Log database operations (create, update, delete) to AccessLog
      if (['create', 'update', 'delete'].includes(params.action)) {
        try {
          await this.accessLog.create({
            data: {
              user_id: this.userContext.userId || null,
              username: this.userContext.username || null,
              aptos_address: this.userContext.aptosAddress || null,
              ip_address: this.userContext.ipAddress || 'unknown',
              endpoint: `DB:${params.model}.${params.action}`,
              method: 'DATABASE',
              status: 200,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              request_body: params.args || {},
              response_body: {
                executionTime: end - start,
                model: params.model,
                action: params.action,
              },
            },
          });
        } catch (error) {
          // Don't fail the main operation if logging fails
          console.error('Failed to log database operation:', error);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Method to set user context for logging
  setUserContext(context: UserContext) {
    this.userContext = context;
  }

  // Method to clear user context
  clearUserContext() {
    this.userContext = {};
  }
}
