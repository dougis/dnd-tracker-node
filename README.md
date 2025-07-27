# D&D Encounter Tracker

A Node.js/React full-stack web application for Dungeon Masters to manage combat encounters with initiative tracking, HP/AC management, character management, and lair actions support.

## Quick Start with Docker

The fastest way to get started is using Docker Compose, which provides all required services out of the box.

### Prerequisites

- Docker Engine v28.2.1+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose v2.0+ (included with Docker Desktop)
- Node.js v22.15.0+ LTS (for local development)
- npm v10.0.0+

### 🚀 One-Command Setup

```bash
# Clone the repository
git clone https://github.com/dougis/dnd-tracker-node.git
cd dnd-tracker-node

# Start all services
npm run docker:up

# Access the application
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - MongoDB Admin: http://localhost:8081
# - Redis Admin: http://localhost:8082
```

## Docker Development Environment

### Services Overview

The Docker Compose setup includes the following services:

| Service | Description | Port | Admin Interface |
|---------|-------------|------|-----------------|
| **MongoDB 8.0** | Primary database with replica set | 27017 | <http://localhost:8081> |
| **Redis 8.0** | Cache and session store | 6379 | <http://localhost:8082> |
| **Mongo Express** | MongoDB admin interface | 8081 | admin/dnd_tracker_mongo_admin |
| **Redis Commander** | Redis admin interface | 8082 | admin/dnd_tracker_redis_admin |
| **App Server** | Node.js Express backend | 3000 | - |
| **App Client** | React frontend | 5173 | - |

### Docker Commands

#### Essential Commands

```bash
# Start all services (databases + admin interfaces)
npm run docker:up

# Start only databases (for local development)
npm run docker:services

# Start with development tools
npm run docker:dev

# View logs from all services
npm run docker:logs

# Stop all services
npm run docker:down

# Reset everything (removes all data)
npm run docker:reset
```

#### Advanced Commands

```bash
# Start full application stack
npm run docker:full

# Build Docker images
npm run docker:build

# Pull latest images
npm run docker:pull

# Show running containers
npm run docker:ps

# Restart services
npm run docker:restart

# Clean up everything
npm run docker:clean

# Run test suite for Docker setup
npm run docker:test
```

#### Direct Service Access

```bash
# Connect to MongoDB shell
npm run docker:mongo

# Connect to Redis CLI
npm run docker:redis

# View specific service logs
docker-compose logs -f mongodb
docker-compose logs -f redis
```

### Environment Configuration

Docker services use environment variables from `.env.docker`:

```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=dnd_tracker_password_2024
MONGO_DB_NAME=dnd_tracker
MONGO_PORT=27017

# Cache Configuration  
REDIS_PORT=6379

# Admin Interface Ports
MONGO_EXPRESS_PORT=8081
REDIS_COMMANDER_PORT=8082

# Application Ports
SERVER_PORT=3000
CLIENT_PORT=5173
```

### Data Persistence

All data is persisted in Docker volumes:

- **mongodb_data**: Database files
- **mongodb_config**: MongoDB configuration
- **redis_data**: Redis snapshots and AOF files

Data survives container restarts but is removed with `npm run docker:reset`.

### Health Checks

All services include health checks:

- **MongoDB**: Replica set initialization and ping test
- **Redis**: Connection and ping test
- **Admin interfaces**: Dependency on healthy backend services

Services wait for dependencies before starting:

```
mongo-express → mongodb (healthy)
redis-commander → redis (healthy)
server → mongodb + redis (healthy)
client → server (running)
```

## Local Development

### With Docker Services

Recommended approach for development:

```bash
# 1. Start only database services
npm run docker:services

# 2. Install dependencies
npm install

# 3. Start local development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### Connection Configuration

Local development automatically connects to Docker services:

```javascript
// packages/server/src/config/index.ts
const config = {
  database: {
    url: 'mongodb://admin:dnd_tracker_password_2024@localhost:27017/dnd_tracker?authSource=admin&replicaSet=rs0'
  },
  redis: {
    url: 'redis://localhost:6379'
  }
}
```

### Database Management

#### Viewing Data

```bash
# MongoDB Admin Interface
open http://localhost:8081
# Login: admin / dnd_tracker_mongo_admin

# Redis Admin Interface  
open http://localhost:8082
# Login: admin / dnd_tracker_redis_admin
```

#### Direct Database Access

```bash
# MongoDB Shell
npm run docker:mongo
# Or: docker-compose exec mongodb mongosh -u admin -p dnd_tracker_password_2024 --authenticationDatabase admin

# Redis CLI
npm run docker:redis
# Or: docker-compose exec redis redis-cli
```

#### Database Initialization

The MongoDB container automatically runs initialization scripts:

- Creates application and development users
- Sets up collections with schema validation
- Creates performance indexes
- Inserts seed data for development

```javascript
// Collections created:
// - users (email validation, unique indexes)
// - characters (level validation, user association)
// - encounters (status validation, user association)
// - sessions (TTL index for automatic cleanup)
// - userStats (user metrics and analytics)
```

## Testing

### Docker Integration Tests

Run comprehensive tests for the Docker setup:

```bash
# Full test suite
npm run docker:test

# Individual test categories
npm run test:server    # Backend integration tests
npm run test:client    # Frontend component tests
npm run test:ci        # CI/CD test suite
```

### Test Coverage

Tests verify:

- ✅ Docker Compose configuration validity
- ✅ Service startup and health checks
- ✅ Database connectivity and operations
- ✅ Redis connectivity and operations  
- ✅ Inter-service networking
- ✅ Data persistence across restarts
- ✅ Environment variable configuration
- ✅ Admin interface accessibility

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check what's using the ports
lsof -i :27017  # MongoDB
lsof -i :6379   # Redis
lsof -i :8081   # Mongo Express
lsof -i :8082   # Redis Commander

# Change ports in .env.docker if needed
```

#### Permission Issues

```bash
# Fix Docker permissions (Linux/WSL)
sudo usermod -aG docker $USER
newgrp docker

# Reset Docker volumes
npm run docker:clean
```

#### Service Startup Issues

```bash
# Check service logs
docker-compose logs mongodb
docker-compose logs redis

# Restart specific service
docker-compose restart mongodb

# Rebuild and restart
npm run docker:build
npm run docker:up
```

#### Database Connection Issues

```bash
# Verify MongoDB replica set
npm run docker:mongo
rs.status()

# Check Redis connectivity
npm run docker:redis
ping
```

### Getting Help

1. **Check service logs**: `npm run docker:logs`
2. **Verify configuration**: `docker-compose config`
3. **Run health checks**: `npm run docker:test`
4. **Reset environment**: `npm run docker:reset`

## Architecture

### Technology Stack

**Backend:**

- Node.js v22.15.0 LTS with Express.js 4.x
- MongoDB 8.0.x with Prisma ORM 6.12.0
- Redis 8.0.x for caching and rate limiting
- TypeScript with ES modules

**Frontend:**

- React v19.1.0 with React Compiler
- Vite v7.0.6 build tool
- TanStack Router v1.129.8 for routing
- TanStack Query v5.83.0 for data management
- Zustand v5.0.6 for state management

**Development:**

- Docker Engine v28.2.1 for containerization
- Vitest 3.2.4 for testing
- ESLint 9.32.0 for code quality

### Project Structure

```
dnd-tracker-node/
├── packages/
│   ├── server/         # Express backend
│   ├── client/         # React frontend  
│   └── shared/         # Shared types/utilities
├── scripts/
│   ├── mongo-init.js   # Database initialization
│   └── test-docker-setup.sh # Docker test suite
├── config/
│   └── redis.conf      # Redis configuration
├── docker-compose.yml  # Docker services
├── .env.docker        # Environment variables
└── README.md          # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Start Docker services: `npm run docker:services`
4. Make your changes and test locally
5. Run tests: `npm run test && npm run docker:test`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

## License

MIT License - see LICENSE file for details.
