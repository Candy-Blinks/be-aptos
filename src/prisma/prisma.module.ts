// src/prisma/prisma.module.ts
import { Global, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Global() // Makes this module available globally
@Module({
  providers: [PrismaClient],
  exports: [PrismaClient], // Allows any service to inject PrismaClient
})
export class PrismaModule
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect(); // Connect to DB on startup
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Close connection on shutdown
  }
}
