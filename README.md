# Social Media Backend - X.com Clone

A production-ready NestJS backend for a Twitter/X.com-like social media platform with real-time notifications, comprehensive logging, and scalable architecture.

## 🚀 Features

### Core Functionality
- **User Management**: Create users with Aptos blockchain addresses
- **Posts**: Create posts with text and image uploads (Cloudinary)
- **Social Feed**: Get personalized feeds from followed users
- **Activity Points**: Increment/decrement user activity points
- **Real-time Notifications**: WebSocket-based notifications via Socket.io
- **Image Storage**: Cloudinary integration for media uploads

### Security & Authentication
- **API Key Authentication**: Protect all endpoints with API keys
- **JWT Authentication**: Secure admin routes with JWT tokens
- **CORS Protection**: Environment-based origin restrictions
- **Rate Limiting**: Configurable request throttling

### Logging & Monitoring
- **Access Logging**: Log all API requests to database
- **Error Logging**: Comprehensive error tracking with stack traces
- **Database Logging**: Track all database operations via Prisma middleware
- **Admin Dashboard**: JWT-protected endpoints to view logs

### Scalability & Performance
- **Redis Caching**: Redis integration for caching and pub/sub
- **Database**: PostgreSQL with Prisma ORM using CUIDs
- **Docker Support**: Full containerization with docker-compose
- **Nginx Proxy**: Production-ready reverse proxy configuration

## 📋 Prerequisites

- Node.js 18+ 
- pnpm
- PostgreSQL (Neon recommended)
- Redis (Upstash recommended)
- Cloudinary account
- Docker & Docker Compose (for production)

## 🛠️ Installation

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Environment Setup
Copy the environment file and configure:
```bash
cp env.example .env
```

Configure your `.env` file:
```env
# Database
DATABASE_URL=postgresql://user:password@your-neon-host/dbname

# Redis (Upstash)
REDIS_HOST=your-upstash-host
REDIS_PORT=your-upstash-port
REDIS_PASSWORD=your-upstash-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# API Keys
API_KEY=your-secure-api-key
API_KEY_DEV=your-dev-api-key

# JWT
JWT_SECRET=your-jwt-secret

# Admin
ADMIN_PASSWORD=admin123

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000,http://localhost:3001

# Environment
NODE_ENV=development
PORT=3000
```

### 3. Database Setup
```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# (Optional) Seed database
pnpm prisma db seed
```

### 4. Development
```bash
# Start development server
pnpm start:dev

# Watch mode
pnpm start:debug
```

## 🐳 Production Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Manual Production Build
```bash
# Build application
pnpm build

# Start production server
pnpm start:prod
```

## 📡 API Endpoints

### Authentication
- `POST /auth/login` - Admin login (returns JWT)

### Users
- `POST /api/users` - Create user (requires API key)
- `GET /api/users?aptos_address=<address>` - Get user details (requires API key)
- `POST /api/users/increment-points` - Increment activity points (requires API key)
- `POST /api/users/decrement-points` - Decrement activity points (requires API key)

### Posts
- `POST /api/posts` - Create post with optional images (requires API key)
- `GET /api/posts/feed?aptos_address=<address>&take=<number>&skip=<number>` - Get feed (requires API key)
- `GET /api/posts/:id` - Get post by ID (requires API key)
- `POST /api/posts/:id/like` - Toggle like on post (requires API key)

### Admin (JWT Protected)
- `GET /api/admin/access-logs` - Get access logs with filters (requires JWT)
- `GET /api/admin/error-logs` - Get error logs with filters (requires JWT)
- `GET /api/admin/stats` - Get system statistics (requires JWT)

### Health Check
- `GET /health` - Health check endpoint

## 🔌 Real-time Notifications

### WebSocket Connection
Connect to WebSocket endpoint:
```javascript
const socket = io('http://localhost:3000');

// Authenticate user
socket.emit('authenticate', { aptosAddress: 'user_aptos_address' });

// Join feed for real-time updates
socket.emit('join_feed', { aptosAddress: 'user_aptos_address' });

// Listen for new posts
socket.on('new_post', (data) => {
  console.log('New post:', data);
});

// Listen for new followers
socket.on('new_follower', (data) => {
  console.log('New follower:', data);
});

// Listen for post likes
socket.on('post_liked', (data) => {
  console.log('Post liked:', data);
});
```

## 📊 Database Schema

### Key Models
- **User**: User profiles with Aptos addresses, activity points, social links
- **Post**: Posts with content, media URLs, engagement counts
- **Comment**: Comments on posts
- **Like**: Post likes with unique constraints
- **Follower**: User follow relationships
- **Share**: Post shares
- **AccessLog**: API request logging
- **ErrorLog**: Error tracking
- **Collection**: NFT collection data
- **ProcessorStatus**: Blockchain processing status

## 🔧 Architecture

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis (Upstash)
- **File Storage**: Cloudinary
- **Real-time**: Socket.io with Redis pub/sub
- **Authentication**: API Keys + JWT
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx with SSL

### Security Features
- API key validation for all endpoints
- JWT authentication for admin routes
- Environment-based CORS configuration
- Request rate limiting
- Input validation and sanitization
- Comprehensive logging and monitoring

### Scalability Considerations
- Redis for horizontal scaling of real-time features
- Stateless application design
- Docker containerization
- Load balancer ready (Nginx)
- Database indexing on frequently queried fields
- Optimized queries with Prisma

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 📝 Development Notes

### Adding New Features
1. Create module using NestJS CLI: `nest g module feature-name`
2. Add service: `nest g service feature-name`
3. Add controller: `nest g controller feature-name`
4. Update database schema in `prisma/schema.prisma`
5. Run migration: `pnpm prisma migrate dev`

### Environment Variables
- Development: Uses `.env` file
- Production: Set environment variables in deployment platform
- Docker: Uses `docker-compose.yml` environment section

### Logging
- All API requests are logged to `AccessLog` table
- Errors are logged to `ErrorLog` table
- Database operations are logged via Prisma middleware
- Admin can view logs via `/api/admin/access-logs` and `/api/admin/error-logs`

## 🚀 Future Enhancements

- [ ] Replace placeholder admin password with Aptos wallet signature verification
- [ ] Implement comment system for posts
- [ ] Add user follow/unfollow endpoints
- [ ] Implement post sharing functionality
- [ ] Add search functionality
- [ ] Implement trending topics
- [ ] Add direct messaging
- [ ] Implement notification preferences
- [ ] Add content moderation
- [ ] Implement analytics dashboard

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.
