import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

export class TestDatabase {
  private static prisma: PrismaClient;

  /**
   * Setup test database - run migrations and seed data if needed
   */
  static async setup(): Promise<void> {
    const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/test_social_media';
    
    // Set the database URL for Prisma
    process.env.DATABASE_URL = DATABASE_URL;
    
    this.prisma = new PrismaClient();
    
    try {
      // Apply migrations
      console.log('Setting up test database...');
      execSync('npx prisma db push --force-reset', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL }
      });
      
      console.log('Test database setup complete');
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  /**
   * Cleanup test database - truncate all tables
   */
  static async cleanup(): Promise<void> {
    if (!this.prisma) return;

    try {
      // Truncate all tables in the correct order (considering foreign keys)
      await this.prisma.$executeRaw`TRUNCATE TABLE "Like" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Follow" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Post" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "Collection" CASCADE;`;
      await this.prisma.$executeRaw`TRUNCATE TABLE "ProcessorStatus" CASCADE;`;
    } catch (error) {
      console.error('Failed to cleanup test database:', error);
    }
  }

  /**
   * Close database connections
   */
  static async teardown(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get Prisma client instance
   */
  static getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Check if test database is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const testPrisma = new PrismaClient();
      await testPrisma.$queryRaw`SELECT 1`;
      await testPrisma.$disconnect();
      return true;
    } catch (error) {
      return false;
    }
  }
} 