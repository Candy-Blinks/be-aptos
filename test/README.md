# Testing Guide

This document explains how to test all the routes and endpoints in your Social Media Backend API.

## 🧪 Test Types

### 1. Unit Tests (`*.spec.ts`)
Test individual components in isolation with mocked dependencies.

### 2. Integration Tests (`*.e2e-spec.ts`)  
Test complete API flows with real HTTP requests and database operations.

## 🗄️ Test Database Setup

### Option 1: Docker (Recommended)
```bash
# Start test database (PostgreSQL + Redis)
npm run test:db:up

# Stop test database
npm run test:db:down

# Reset test database (clear all data and volumes)
npm run test:db:reset
```

The Docker setup provides:
- **PostgreSQL**: localhost:5433, database: `test_social_media`, user: `test`, password: `test`
- **Redis**: localhost:6380

### Option 2: Manual Setup
If you prefer manual setup, ensure you have:
- PostgreSQL running on localhost:5433 with database `test_social_media`
- Redis running on localhost:6380 (optional)

## 🚀 Running Tests

### Quick Start
```bash
# Run all unit tests (no database required)
npm run test:unit

# Run E2E tests (requires test database)
npm run test:e2e

# Run all tests with automatic database setup/teardown
npm run test:with:db

# Run E2E tests with database management
npm run test:e2e:full

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Detailed Commands
```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests with coverage
npm run test:e2e:coverage

# Database management
npm run test:db:up      # Start test database
npm run test:db:down    # Stop test database
npm run test:db:reset   # Reset database with fresh data

# Run specific test file
npm test users.service.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="create user"

# Debug tests
npm run test:debug
```

## 📋 Test Coverage

### ✅ Users Module
- **Service**: Create, find, increment/decrement points
- **Controller**: All endpoint validations
- **E2E**: API key authentication, data validation, error handling

### ✅ Posts Module  
- **Service**: Create posts, get feed, like/unlike posts
- **Controller**: File upload handling, pagination
- **E2E**: Media uploads, feed filtering, engagement features

### ✅ Auth Module
- **Service**: Login validation, API key validation
- **Controller**: JWT token generation
- **E2E**: Admin authentication flow

### ✅ Admin Module
- **Service**: Log filtering and retrieval
- **Controller**: JWT protection
- **E2E**: Protected admin endpoints

## 🔧 Test Setup

### Environment Variables
Tests use these default values:
```env
NODE_ENV=test
API_KEY=test-api-key
API_KEY_DEV=test-dev-api-key
JWT_SECRET=test-jwt-secret
ADMIN_PASSWORD=test-admin-password
```

### Database
- Tests use mocked PrismaService for unit tests
- E2E tests can use a real test database
- Automatic cleanup after each test

## 📝 Test Examples

### Manual API Testing with curl

#### 1. Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "X-API-KEY: dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "aptos_address": "test-address-123",
    "display_name": "Test User"
  }'
```

#### 2. Get User
```bash
curl -X GET "http://localhost:3000/api/users?aptos_address=test-address-123" \
  -H "X-API-KEY: dev-api-key-12345"
```

#### 3. Create Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "X-API-KEY: dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "aptos_address": "test-address-123",
    "content": "My first post!"
  }'
```

#### 4. Login (Admin)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "aptos_address": "test-address-123",
    "password": "admin123"
  }'
```

#### 5. Get Admin Logs (with JWT)
```bash
curl -X GET http://localhost:3000/api/admin/access-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Using Postman

#### Collection Setup
1. **Create Environment Variables**:
   - `api_key`: `dev-api-key-12345`
   - `base_url`: `http://localhost:3000`
   - `jwt_token`: (set after login)

2. **Pre-request Scripts** (for auth endpoints):
   ```javascript
   pm.request.headers.add({
     key: 'X-API-KEY',
     value: pm.environment.get('api_key')
   });
   ```

3. **Test Scripts** (save JWT token):
   ```javascript
   if (pm.response.code === 200) {
     const response = pm.response.json();
     pm.environment.set('jwt_token', response.access_token);
   }
   ```

### Test Data Examples

#### Valid User Data
```json
{
  "username": "johndoe",
  "aptos_address": "0x1234567890abcdef",
  "display_name": "John Doe",
  "bio": "Software developer",
  "socials": {
    "website": "https://johndoe.dev",
    "x": "@johndoe"
  }
}
```

#### Valid Post Data
```json
{
  "aptos_address": "0x1234567890abcdef",
  "content": "This is my first post! #hello #world"
}
```

#### Points Update Data
```json
{
  "aptos_address": "0x1234567890abcdef",
  "points": 10
}
```

## 🐛 Error Testing

### Test Invalid API Keys
```bash
# Missing API key (401)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "test"}'

# Invalid API key (401)  
curl -X POST http://localhost:3000/api/users \
  -H "X-API-KEY: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"username": "test"}'
```

### Test Validation Errors
```bash
# Username too short (400)
curl -X POST http://localhost:3000/api/users \
  -H "X-API-KEY: dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "aptos_address": "test-address",
    "display_name": "Test"
  }'
```

### Test Duplicate Data (409)
```bash
# Create user twice with same username
curl -X POST http://localhost:3000/api/users \
  -H "X-API-KEY: dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"username": "duplicate", "aptos_address": "addr1", "display_name": "User 1"}'

curl -X POST http://localhost:3000/api/users \
  -H "X-API-KEY: dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{"username": "duplicate", "aptos_address": "addr2", "display_name": "User 2"}'
```

## 📊 Test Reporting

### Coverage Reports
After running `pnpm test:coverage`, view coverage at:
- `coverage/lcov-report/index.html`

### E2E Test Results
- Tests automatically clean up data
- View detailed request/response logs
- Check API response times

## 🔒 Security Testing

### API Key Validation
- ✅ Missing API key rejected
- ✅ Invalid API key rejected  
- ✅ Development vs production keys
- ✅ Environment-based validation

### JWT Authentication
- ✅ Missing JWT rejected on admin routes
- ✅ Invalid JWT rejected
- ✅ Token expiration handling
- ✅ Proper user context in JWT

### Input Validation
- ✅ Required fields validation
- ✅ Data type validation
- ✅ String length limits
- ✅ Sanitization of inputs

## 📈 Performance Testing

### Load Testing Example (using `autocannon`)
```bash
# Install autocannon
npm install -g autocannon

# Test user creation endpoint
autocannon -c 10 -d 30 -m POST \
  -H "X-API-KEY: dev-api-key-12345" \
  -H "Content-Type: application/json" \
  -b '{"username":"load-test-user","aptos_address":"load-test-addr","display_name":"Load Test"}' \
  http://localhost:3000/api/users
```

## 🎯 Test Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Tests clean up their own data
3. **Mocking**: Unit tests use mocks for external dependencies
4. **Real Data**: E2E tests use real (but test) data
5. **Error Cases**: Test both success and failure scenarios
6. **Edge Cases**: Test boundary conditions and limits

## 🚨 Common Issues

### Test Database
- Ensure test database is separate from development
- Tests should not affect development data
- Use transactions for test isolation when possible

### Environment Variables
- Tests override production environment variables
- Sensitive credentials should be mocked
- Use test-specific configuration

### Async Operations
- Always await async operations in tests
- Use proper timeouts for slow operations
- Mock external API calls

This comprehensive testing setup ensures your social media backend is robust, secure, and ready for production! 🎉 