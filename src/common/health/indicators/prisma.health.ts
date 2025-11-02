import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma';

/**
 * Prisma 数据库健康指标
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 检查数据库连接健康状态
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // 执行简单的数据库查询
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      // 如果响应时间超过 5 秒，认为数据库响应缓慢
      if (responseTime > 5000) {
        const result = this.getStatus(key, false, {
          message: 'Database response is slow',
          responseTime: `${responseTime}ms`,
        });
        throw new HealthCheckError('Database is slow', result);
      }

      // 返回健康状态
      return this.getStatus(key, true, {
        message: 'Database is healthy',
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      this.logger.error('Database health check failed', error);

      // 返回不健康状态
      const result = this.getStatus(key, false, {
        message: 'Database is not available',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new HealthCheckError('Database check failed', result);
    }
  }

  /**
   * 检查数据库连接池状态
   */
  async checkConnectionPool(key: string): Promise<HealthIndicatorResult> {
    try {
      // Prisma $metrics 需要在 schema 中启用 metrics
      // 这里简化处理，只检查连接是否正常
      await this.prisma.$queryRaw`SELECT 1`;

      return this.getStatus(key, true, {
        message: 'Connection pool is healthy',
        note: 'Detailed metrics require enabling Prisma metrics feature',
      });
    } catch (error) {
      this.logger.error('Failed to check connection pool', error);

      return this.getStatus(key, false, {
        message: 'Unable to check connection pool',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 执行详细的数据库诊断
   */
  async diagnose(): Promise<Record<string, any>> {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };

    try {
      // 测试基本连接
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      diagnostics.connectionTime = `${Date.now() - startTime}ms`;
      diagnostics.connectionStatus = 'connected';

      // 获取数据库版本
      const versionResult = await this.prisma.$queryRaw<
        { version: string }[]
      >`SELECT version()`;
      diagnostics.databaseVersion = versionResult[0]?.version;

      // 获取数据库大小
      const sizeResult = await this.prisma.$queryRaw<
        { database_size: string }[]
      >`SELECT pg_size_pretty(pg_database_size(current_database())) as database_size`;
      diagnostics.databaseSize = sizeResult[0]?.database_size;

      // 获取表数量
      const tableCount = await this.prisma.$queryRaw<
        { count: bigint }[]
      >`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'`;
      diagnostics.tableCount = Number(tableCount[0]?.count);

      // 获取活跃连接数
      const activeConnections = await this.prisma.$queryRaw<
        { count: bigint }[]
      >`SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'`;
      diagnostics.activeConnections = Number(activeConnections[0]?.count);

      diagnostics.status = 'healthy';
    } catch (error) {
      diagnostics.status = 'unhealthy';
      diagnostics.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Database diagnosis failed', error);
    }

    return diagnostics;
  }
}
