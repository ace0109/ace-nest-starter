import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service
 * 管理 Prisma Client 连接生命周期
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'info' },
      ],
      errorFormat: 'colorless',
    });
  }

  /**
   * 模块初始化时连接数据库
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * 模块销毁时断开数据库连接
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * 清理数据库 (仅用于测试环境)
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    const models = Reflect.ownKeys(this).filter((key) => {
      if (typeof key === 'symbol') return false;
      return key[0] !== '_' && key !== 'constructor';
    });

    await Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof typeof this];
        if (typeof model === 'object' && model !== null && 'deleteMany' in model) {
          return (model as { deleteMany: () => Promise<unknown> }).deleteMany();
        }
        return Promise.resolve();
      }),
    );

    this.logger.warn('⚠️  Database cleaned (test mode only)');
  }
}
