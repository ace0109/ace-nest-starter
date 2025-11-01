#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}   ACE Nest Starter 环境测试${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Test PostgreSQL
echo -e "${YELLOW}1. 测试 PostgreSQL 连接...${NC}"
if docker exec ace-postgres-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ PostgreSQL 运行正常${NC}"
    echo -e "   📍 地址: localhost:5432"
    echo -e "   🔑 用户: postgres / postgres123"
else
    echo -e "${RED}   ❌ PostgreSQL 连接失败${NC}"
fi
echo ""

# Test Redis
echo -e "${YELLOW}2. 测试 Redis 连接...${NC}"
if docker exec ace-redis-dev redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Redis 运行正常${NC}"
    echo -e "   📍 地址: localhost:6379"

    # Set a test value
    docker exec ace-redis-dev redis-cli SET test:key "Hello from ACE!" > /dev/null 2>&1
    VALUE=$(docker exec ace-redis-dev redis-cli GET test:key 2>/dev/null | tr -d '"')
    echo -e "   📝 测试值: ${VALUE}"

    # Clean up
    docker exec ace-redis-dev redis-cli DEL test:key > /dev/null 2>&1
else
    echo -e "${RED}   ❌ Redis 连接失败${NC}"
fi
echo ""

# Test Redis Commander
echo -e "${YELLOW}3. 测试 Redis Commander...${NC}"
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Redis Commander 运行正常${NC}"
    echo -e "   🌐 访问地址: ${BLUE}http://localhost:8081${NC}"
else
    echo -e "${RED}   ❌ Redis Commander 无法访问${NC}"
fi
echo ""

# Show available commands
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}   可用的快捷命令${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo -e "${YELLOW}Docker 管理:${NC}"
echo -e "  pnpm docker:up     - 启动所有服务"
echo -e "  pnpm docker:down   - 停止并删除容器"
echo -e "  pnpm docker:stop   - 暂停服务"
echo -e "  pnpm docker:logs   - 查看日志"
echo -e "  pnpm docker:clean  - 清理所有数据"
echo ""
echo -e "${YELLOW}开发流程:${NC}"
echo -e "  pnpm dev:setup     - 初始化环境"
echo -e "  pnpm dev:start     - 开始开发"
echo -e "  pnpm dev:stop      - 暂停开发"
echo ""
echo -e "${YELLOW}数据库工具:${NC}"
echo -e "  pnpm prisma:studio - 打开数据库 Web UI"
echo -e "  pnpm prisma:migrate - 运行数据库迁移"
echo ""
echo -e "${BLUE}==================================${NC}"