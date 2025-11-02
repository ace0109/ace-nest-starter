# 数据库 (Prisma)

## 概述

ACE NestJS Starter 使用 Prisma ORM 作为数据库访问层，提供类型安全的数据库操作、自动迁移管理和强大的查询构建器。

## 核心特性

- **类型安全**: 自动生成 TypeScript 类型
- **数据库无关**: 支持 PostgreSQL、MySQL、SQLite、SQL Server
- **迁移管理**: 声明式模式定义和版本控制
- **性能优化**: 查询优化和连接池管理
- **开发体验**: Prisma Studio 可视化数据管理

## 快速开始

### 1. 配置数据库连接

在 `.env` 文件中设置数据库 URL：

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 2. 定义数据模型

编辑 `prisma/schema.prisma`：

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  role      Role     @default(USER)
  profile   Profile?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([username])
}

model Profile {
  id       String  @id @default(cuid())
  bio      String?
  avatar   String?
  userId   String  @unique
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  tags      Tag[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  posts Post[]
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### 3. 生成 Prisma Client

```bash
# 生成类型定义和客户端
pnpm prisma:generate
```

### 4. 运行迁移

```bash
# 创建并应用迁移
pnpm prisma:migrate

# 或者在开发环境快速同步
pnpm prisma:push
```

## Prisma 服务配置

### 模块设置

```typescript
// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### 服务实现

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('database.url'),
        },
      },
      log:
        configService.get('app.env') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDb() {
    if (this.configService.get('app.env') !== 'test') {
      throw new Error('cleanDb is only allowed in test environment');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key[0] !== '$',
    );

    for (const model of models) {
      await this[model].deleteMany();
    }
  }
}
```

## CRUD 操作示例

### 创建数据

```typescript
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: await bcrypt.hash(data.password, 10),
        profile: {
          create: {
            bio: data.bio,
            avatar: data.avatar,
          },
        },
      },
      include: {
        profile: true,
      },
    });
  }
}
```

### 查询数据

```typescript
// 单条记录
async findOne(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      posts: {
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

// 列表查询
async findMany(params: {
  skip?: number;
  take?: number;
  where?: Prisma.UserWhereInput;
  orderBy?: Prisma.UserOrderByWithRelationInput;
}) {
  const { skip, take, where, orderBy } = params;

  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        _count: {
          select: { posts: true },
        },
      },
    }),
    this.prisma.user.count({ where }),
  ]);

  return {
    data,
    total,
    page: Math.floor(skip / take) + 1,
    pageSize: take,
  };
}
```

### 更新数据

```typescript
async updateUser(id: string, data: UpdateUserDto) {
  return this.prisma.user.update({
    where: { id },
    data: {
      username: data.username,
      profile: {
        update: {
          bio: data.bio,
          avatar: data.avatar,
        },
      },
    },
    include: {
      profile: true,
    },
  });
}

// 批量更新
async updateMany(ids: string[], data: Partial<User>) {
  return this.prisma.user.updateMany({
    where: {
      id: { in: ids },
    },
    data,
  });
}
```

### 删除数据

```typescript
async deleteUser(id: string) {
  // 级联删除（需要在 schema 中设置 onDelete: Cascade）
  return this.prisma.user.delete({
    where: { id },
  });
}

// 软删除
async softDelete(id: string) {
  return this.prisma.user.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  });
}
```

## 高级查询

### 事务处理

```typescript
async transferPoints(fromUserId: string, toUserId: string, points: number) {
  return this.prisma.$transaction(async (tx) => {
    // 扣除积分
    const sender = await tx.user.update({
      where: { id: fromUserId },
      data: { points: { decrement: points } },
    });

    if (sender.points < 0) {
      throw new Error('Insufficient points');
    }

    // 增加积分
    const receiver = await tx.user.update({
      where: { id: toUserId },
      data: { points: { increment: points } },
    });

    // 记录交易
    await tx.transaction.create({
      data: {
        fromUserId,
        toUserId,
        amount: points,
        type: 'TRANSFER',
      },
    });

    return { sender, receiver };
  });
}
```

### 聚合查询

```typescript
async getStatistics() {
  const stats = await this.prisma.user.aggregate({
    _count: true,
    _avg: {
      age: true,
    },
    _min: {
      createdAt: true,
    },
    _max: {
      createdAt: true,
    },
  });

  const roleDistribution = await this.prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  return {
    totalUsers: stats._count,
    averageAge: stats._avg.age,
    oldestUser: stats._min.createdAt,
    newestUser: stats._max.createdAt,
    roleDistribution,
  };
}
```

### 全文搜索

```typescript
async searchPosts(query: string) {
  return this.prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
        { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
      ],
    },
    include: {
      author: true,
      tags: true,
    },
  });
}
```

### 原始 SQL 查询

```typescript
async complexQuery() {
  // 类型安全的查询
  const result = await this.prisma.$queryRaw<Array<{
    id: string;
    email: string;
    postCount: number;
  }>>`
    SELECT u.id, u.email, COUNT(p.id) as "postCount"
    FROM "User" u
    LEFT JOIN "Post" p ON u.id = p."authorId"
    GROUP BY u.id
    HAVING COUNT(p.id) > 5
    ORDER BY "postCount" DESC
  `;

  return result;
}

// 执行命令
async vacuum() {
  await this.prisma.$executeRaw`VACUUM ANALYZE`;
}
```

## 迁移管理

### 创建迁移

```bash
# 创建新迁移
pnpm prisma migrate dev --name add_user_table

# 查看迁移状态
pnpm prisma migrate status

# 应用迁移到生产
pnpm prisma migrate deploy
```

### 迁移文件结构

```
prisma/
├── schema.prisma           # 数据模型定义
├── migrations/            # 迁移历史
│   ├── 20240101000000_init/
│   │   └── migration.sql
│   ├── 20240102000000_add_user_table/
│   │   └── migration.sql
│   └── migration_lock.toml
└── seed.ts                # 种子数据脚本
```

### 种子数据

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 创建管理员用户
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      profile: {
        create: {
          bio: 'System Administrator',
        },
      },
    },
  });

  // 创建测试用户
  const users = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          username: `user${i}`,
          password: await bcrypt.hash('password', 10),
          role: 'USER',
        },
      }),
    ),
  );

  console.log('Seed data created:', { admin, users: users.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

运行种子数据：

```bash
pnpm prisma:seed
```

## 性能优化

### 查询优化

```typescript
// 使用 select 减少数据传输
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    username: true,
  },
});

// 使用 include 谨慎
// ❌ 不好：加载所有关系
const user = await this.prisma.user.findUnique({
  where: { id },
  include: {
    profile: true,
    posts: true,
    comments: true,
    followers: true,
    following: true,
  },
});

// ✅ 好：只加载需要的关系
const user = await this.prisma.user.findUnique({
  where: { id },
  include: {
    profile: true,
    posts: {
      where: { published: true },
      take: 5,
    },
  },
});
```

### 索引优化

```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  username String @unique
  role     Role   @default(USER)

  // 单字段索引
  @@index([email])
  @@index([username])

  // 复合索引
  @@index([role, createdAt])
}
```

### 连接池配置

```typescript
new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  // 连接池配置
  connection_limit: 10, // 最大连接数
  pool_timeout: 10, // 连接超时（秒）
});
```

## Prisma Studio

可视化数据管理工具：

```bash
# 启动 Prisma Studio
pnpm prisma:studio
```

访问 http://localhost:5555 查看和编辑数据。

## 测试策略

### 单元测试

```typescript
describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const user = { id: '1', email: 'test@example.com' };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(user as any);

    const result = await service.createUser({
      email: 'test@example.com',
      username: 'test',
      password: 'password',
    });

    expect(result).toEqual(user);
  });
});
```

### 集成测试

```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    await prisma.cleanDb();
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@example.com',
        username: 'test',
        password: 'password',
      })
      .expect(201);
  });
});
```

## 常见问题

### 1. 连接池耗尽

```typescript
// 增加连接池大小
DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?connection_limit=20';
```

### 2. N+1 查询问题

```typescript
// ❌ N+1 问题
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}

// ✅ 解决方案
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});
```

### 3. 迁移冲突

```bash
# 重置数据库（开发环境）
pnpm prisma migrate reset

# 基线迁移（生产环境）
pnpm prisma migrate resolve --applied "20240101000000_init"
```

## 下一步

- [认证系统](./authentication.md) - JWT 认证实现
- [API 开发](./validation.md) - 数据验证和 DTO
- [测试策略](./testing.md) - 数据库测试最佳实践
