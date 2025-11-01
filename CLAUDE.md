# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ACE NestJS Starter** - A production-ready, opinionated NestJS scaffolding project designed for rapid backend API development.

**Project Goal**: Create an out-of-the-box, production-ready backend starter with best practices baked in.

**Key Principles**:
- Type-safe configuration using Zod (not Joi)
- Modular architecture with clear separation of concerns
- Environment-specific validation (loose dev, strict prod)
- All configurations centralized in `src/config/`

## Development Workflow Rules

**CRITICAL**: This project follows a strict iterative development and validation workflow:

1. **One Task at a Time** - Only develop ONE subsection at a time (e.g., 1.1, 1.2, 1.3...)
2. **Provide Verification Steps** - After completing a task, provide detailed testing/verification steps to the user
3. **Wait for Validation** - DO NOT proceed to the next task automatically
4. **Wait for Explicit Instruction** - Only start the next task when the user explicitly confirms validation passed and instructs to continue
5. **Update DEVELOPMENT_PLAN.md** - Mark completed tasks with ✅ and add detailed verification steps in the document

**Current Development Status**: Check `DEVELOPMENT_PLAN.md` for the latest completed tasks and next task to work on.

## Code Quality Standards

**TypeScript Type Safety**:
- ❌ **NEVER use `any` type** - Always use proper TypeScript types
- ✅ Define explicit interfaces/types for function parameters and return values
- ✅ Use type inference when types are obvious
- ✅ For third-party library types, import proper type definitions
- ✅ Use `unknown` instead of `any` when type is truly unknown, then narrow it with type guards

## Development Commands

```bash
# Development
pnpm install          # Install dependencies
pnpm start:dev        # Run in watch mode (primary dev command)
pnpm start:debug      # Run with debugger

# Build & Production
pnpm build           # Compile TypeScript
pnpm start:prod      # Run production build

# Code Quality
pnpm lint            # Run ESLint with auto-fix
pnpm format          # Format code with Prettier

# Testing
pnpm test            # Run unit tests
pnpm test:watch      # Run tests in watch mode
pnpm test:cov        # Generate coverage report
pnpm test:e2e        # Run end-to-end tests
```

## Architecture & Design Decisions

### Configuration System

The project uses a **centralized configuration approach** with Zod validation:

- **Location**: All config files in `src/config/`
- **Main files**:
  - `configuration.ts` - Defines all config modules using `registerAs()`
  - `env.validation.ts` - Zod schemas for environment variable validation
  - `index.ts` - Barrel export for clean imports

**Configuration modules** (all defined in `configuration.ts`):
- `app` - Application settings (port, env, CORS origins)
- `database` - Database URL (using Prisma-style DATABASE_URL)
- `jwt` - Access + Refresh token configuration
- `redis` - Cache/session storage settings
- `smtp` - Email service configuration
- `log` - Pino logging levels
- `oauth` - Social login (Google, GitHub, WeChat)

**Environment Validation Strategy**:
- **Development**: Loose validation - shows warnings but continues with defaults
- **Production**: Strict validation - fails fast if required vars missing
- **Production-specific rules**: JWT secrets must be 64+ characters (enforced in `productionEnvSchema`)

### Type Safety

The project uses **Zod for schema-first type safety**:
```typescript
// Schema automatically infers TypeScript types
export const envSchema = z.object({...});
export type Env = z.infer<typeof envSchema>;
```

This pattern should be followed for all validation schemas - never manually define types that duplicate schema definitions.

### Module Organization

```
src/
├── config/          # Centralized configuration (Zod validation)
├── app.module.ts    # Root module with ConfigModule.forRoot()
├── app.controller.ts
├── app.service.ts
└── main.ts          # Bootstrap file
```

The `ConfigModule` is configured as **global** in `app.module.ts`, meaning all modules can inject `ConfigService` without importing `ConfigModule`.

### Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | NestJS 11.x | Latest version |
| Language | TypeScript 5.7+ | Strict mode enabled |
| Validation | Zod 4.x | Preferred over Joi for type inference |
| Logging | Pino (nestjs-pino) | Installed, pending full configuration |
| Package Manager | pnpm | Enforced in this project |
| ORM | **TBD** (Prisma vs TypeORM) | Decision pending |
| Database | **TBD** (PostgreSQL vs MySQL) | Decision pending |

### TypeScript Configuration

- **Module system**: `nodenext` (native ESM support)
- **Target**: ES2023
- **Strict mode**: Enabled with `strictNullChecks`, `noImplicitAny`, `strictBindCallApply`
- **Decorators**: Enabled (required for NestJS)
- **baseUrl**: `./` for path resolution

## Development Workflow

### Adding New Configuration

1. Add env variable to `.env.example` with comments
2. Add Zod schema to `env.validation.ts` in the appropriate section
3. Add config module to `configuration.ts` using `registerAs()`
4. Export from `src/config/index.ts` if needed
5. Type will be automatically inferred - no manual interface needed

### Environment Variables

- **Required for all environments**: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- **Production-only requirements**: 64-char JWT secrets, SMTP configuration
- **Development defaults**: Check `env.validation.ts` `validateEnvLoose()` function

### Project Phases

Refer to `DEVELOPMENT_PLAN.md` for detailed task breakdown. The project follows a 7-phase approach:

1. **Phase 1** (Current): Infrastructure (config, logging, DB, error handling)
2. **Phase 2**: Authentication & Authorization (JWT, RBAC)
3. **Phase 3**: API Documentation & Validation (Swagger, DTOs)
4. **Phase 4**: Performance & Security (Redis, rate limiting, health checks)
5. **Phase 5**: Business Features (email, uploads, i18n, WebSocket, scheduling, OAuth)
6. **Phase 6**: DevOps (Docker, E2E tests, Git hooks)
7. **Phase 7**: Documentation & Delivery

**Current Status**: Phase 1.1 (Configuration Module) completed

### Documentation Files

- `REQUIREMENTS_DETAIL.md` - Complete technical specification
- `DEVELOPMENT_PLAN.md` - Phase-by-phase task breakdown with checklists
- `TECH_RESEARCH_SUMMARY.md` - Technology selection rationale
- `.env.example` - Environment variable template with detailed comments

## Important Patterns

### Response Format (Planned)

All API responses will follow a unified format:
```typescript
// Success
{ success: true, code: 200, message: string, data: any, timestamp: number, traceId: string }

// Error
{ success: false, code: number, message: string, statusCode: number, timestamp: number, traceId: string, path: string, errors?: any[] }
```

### Error Code Design (Planned)

Mixed approach: HTTP status code + business error code
- `1xxxx` - System errors
- `2xxxx` - Auth/Authorization errors
- `3xxxx` - User-related errors
- `4xxxx` - Business logic errors
- `5xxxx` - Third-party service errors

### RBAC Permission Format (Planned)

Format: `resource:action` (e.g., `user:create`, `post:read`, `comment:delete`)
Special: `*:*` for admin, `resource:*` for all actions on resource

## Testing Strategy

- **Unit tests**: Co-located with source files (`*.spec.ts`)
- **E2E tests**: In `test/` directory
- **Test database**: Separate configuration (to be added)
- **Coverage**: Configured to collect from all `src/**/*.ts` files

## Key Constraints

- **No generic development practices in docs** - Keep documentation focused on project-specific architecture
- **Type safety first** - Use Zod's type inference, avoid manual type definitions
- **Configuration centralization** - All env vars go through validation
- **Production-ready mindset** - Strict validation and security checks in prod mode
