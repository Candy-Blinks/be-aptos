import { ConfigService } from '@nestjs/config';
import { TestDatabase } from './test-database';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/test_social_media';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.API_KEY = 'test-api-key';
  process.env.API_KEY_DEV = 'test-dev-api-key';
  process.env.ADMIN_PASSWORD = 'test-admin-password';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-api-key';
  process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';

  // Check if test database is available
  const isAvailable = await TestDatabase.isAvailable();
  if (!isAvailable) {
    console.warn('\n⚠️  Test database not available. To run E2E tests:');
    console.warn('   1. Run: docker-compose -f docker-compose.test.yml up -d');
    console.warn('   2. Or set up PostgreSQL at: postgresql://test:test@localhost:5433/test_social_media\n');
  }
}, 30000);

// Global teardown
afterAll(async () => {
  await TestDatabase.teardown();
});

// Mock console methods to reduce noise during testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress console noise during tests
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Extend Jest matchers
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && typeof received === 'object' && received.constructor === Object;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response object`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
    }
  }
} 