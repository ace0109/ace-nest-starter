#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting ACE Nest Starter Development Environment${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Stop and remove existing containers if they exist
echo -e "${YELLOW}📦 Cleaning up existing containers...${NC}"
docker stop ace-postgres-dev ace-redis-dev ace-redis-commander 2>/dev/null || true
docker rm ace-postgres-dev ace-redis-dev ace-redis-commander 2>/dev/null || true

# Start services using docker-compose
echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if docker exec ace-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
fi

# Check Redis
echo -n "Checking Redis... "
if docker exec ace-redis-dev redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis is not ready${NC}"
fi

echo ""
echo -e "${GREEN}📌 Services Information:${NC}"
echo "  PostgreSQL: localhost:5432"
echo "  Redis:      localhost:6379"
echo "  Redis Commander: http://localhost:8081"
echo ""
echo -e "${GREEN}📚 Connection Details:${NC}"
echo "  PostgreSQL:"
echo "    - Database: ace_nest_db"
echo "    - Username: postgres"
echo "    - Password: postgres123"
echo "  Redis:"
echo "    - No authentication required for development"
echo ""
echo -e "${YELLOW}💡 To stop services, run: docker-compose -f docker-compose.dev.yml down${NC}"
echo -e "${YELLOW}💡 To view logs, run: docker-compose -f docker-compose.dev.yml logs -f${NC}"
echo ""

# Run database migrations if needed
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${YELLOW}🔄 Running database migrations...${NC}"
    npx prisma migrate dev || pnpm prisma migrate dev || true
fi

echo -e "${GREEN}✨ Development environment is ready!${NC}"