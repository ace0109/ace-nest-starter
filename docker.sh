#!/bin/bash

# Docker utility script for ACE NestJS Starter
# Usage: ./docker.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ace-nest-starter"
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.dev.yml"

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Function to create .env file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created. Please update it with your configuration."
    fi
}

# Main commands
case "$1" in
    # Development commands
    dev:up)
        print_info "Starting development environment..."
        setup_env
        docker-compose -f $COMPOSE_DEV_FILE up -d
        print_success "Development environment started!"
        print_info "Services available at:"
        echo "  - PostgreSQL: localhost:5432"
        echo "  - Redis: localhost:6379"
        echo "  - pgAdmin: http://localhost:5050"
        echo "  - Redis Commander: http://localhost:8081"
        echo "  - Mailhog: http://localhost:8025"
        ;;

    dev:down)
        print_info "Stopping development environment..."
        docker-compose -f $COMPOSE_DEV_FILE down
        print_success "Development environment stopped!"
        ;;

    dev:restart)
        print_info "Restarting development environment..."
        docker-compose -f $COMPOSE_DEV_FILE restart
        print_success "Development environment restarted!"
        ;;

    dev:logs)
        docker-compose -f $COMPOSE_DEV_FILE logs -f ${2:-}
        ;;

    dev:clean)
        print_warning "This will remove all containers, volumes, and networks!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f $COMPOSE_DEV_FILE down -v
            print_success "Development environment cleaned!"
        fi
        ;;

    # Production commands
    build)
        print_info "Building production image..."
        setup_env
        docker build -t $PROJECT_NAME:latest .
        print_success "Production image built!"
        ;;

    up)
        print_info "Starting production environment..."
        setup_env
        docker-compose -f $COMPOSE_FILE up -d
        print_success "Production environment started!"
        print_info "Application available at: http://localhost:3000"
        ;;

    down)
        print_info "Stopping production environment..."
        docker-compose -f $COMPOSE_FILE down
        print_success "Production environment stopped!"
        ;;

    restart)
        print_info "Restarting production environment..."
        docker-compose -f $COMPOSE_FILE restart app
        print_success "Application restarted!"
        ;;

    logs)
        docker-compose -f $COMPOSE_FILE logs -f ${2:-app}
        ;;

    # Database commands
    db:migrate)
        print_info "Running database migrations..."
        docker-compose -f ${2:-$COMPOSE_FILE} exec app npx prisma migrate deploy
        print_success "Migrations completed!"
        ;;

    db:seed)
        print_info "Seeding database..."
        docker-compose -f ${2:-$COMPOSE_FILE} exec app npx prisma db seed
        print_success "Database seeded!"
        ;;

    db:reset)
        print_warning "This will reset your database!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f ${2:-$COMPOSE_FILE} exec app npx prisma migrate reset --force
            print_success "Database reset!"
        fi
        ;;

    # Utility commands
    shell)
        print_info "Opening shell in app container..."
        docker-compose -f ${2:-$COMPOSE_FILE} exec app sh
        ;;

    test)
        print_info "Running tests..."
        docker-compose -f ${2:-$COMPOSE_FILE} exec app pnpm test
        ;;

    test:e2e)
        print_info "Running E2E tests..."
        docker-compose -f ${2:-$COMPOSE_FILE} exec app pnpm test:e2e
        ;;

    status)
        print_info "Checking container status..."
        docker-compose -f ${2:-$COMPOSE_FILE} ps
        ;;

    health)
        print_info "Checking health status..."
        curl -s http://localhost:3000/health | jq '.' || print_error "Health check failed"
        ;;

    help|*)
        echo "Docker utility script for $PROJECT_NAME"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Development Commands:"
        echo "  dev:up         Start development environment"
        echo "  dev:down       Stop development environment"
        echo "  dev:restart    Restart development environment"
        echo "  dev:logs       View development logs"
        echo "  dev:clean      Remove all development containers and volumes"
        echo ""
        echo "Production Commands:"
        echo "  build          Build production Docker image"
        echo "  up             Start production environment"
        echo "  down           Stop production environment"
        echo "  restart        Restart application container"
        echo "  logs [service] View production logs"
        echo ""
        echo "Database Commands:"
        echo "  db:migrate     Run database migrations"
        echo "  db:seed        Seed database with initial data"
        echo "  db:reset       Reset database (WARNING: Destructive)"
        echo ""
        echo "Utility Commands:"
        echo "  shell          Open shell in app container"
        echo "  test           Run unit tests"
        echo "  test:e2e       Run E2E tests"
        echo "  status         Check container status"
        echo "  health         Check application health"
        echo "  help           Show this help message"
        ;;
esac