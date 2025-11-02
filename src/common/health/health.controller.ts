import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
} from '@nestjs/terminus';
import { Public } from '../decorators/auth.decorators';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { DiskHealthIndicator } from './indicators/disk.health';
import * as os from 'os';

/**
 * 健康检查控制器
 */
@ApiTags('health')
@Controller('health')
@Public() // 健康检查接口通常是公开的
@SkipThrottle() // 跳过限流
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private redisHealth: RedisHealthIndicator,
    private memoryHealth: MemoryHealthIndicator,
    private diskHealth: DiskHealthIndicator,
  ) {}

  /**
   * 基础健康检查
   * 用于负载均衡器快速检查
   */
  @Get('ping')
  @ApiOperation({ summary: '基础健康检查' })
  @ApiResponse({
    status: 200,
    description: '服务正常',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
      },
    },
  })
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 完整健康检查
   * 检查所有依赖服务
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: '完整系统健康检查' })
  @ApiResponse({
    status: 200,
    description: '所有服务正常',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: { type: 'object' },
            redis: { type: 'object' },
            memory: { type: 'object' },
            disk: { type: 'object' },
          },
        },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: '某些服务不可用',
  })
  async check(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.prismaHealth.isHealthy('database'),
        () => this.redisHealth.isHealthy('redis'),
        () => this.memoryHealth.isHealthy('memory'),
        () => this.diskHealth.isHealthy('disk'),
      ]);
    } catch (error) {
      throw new ServiceUnavailableException(error);
    }
  }

  /**
   * 活跃性探针
   * Kubernetes liveness probe
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: '活跃性探针' })
  @ApiResponse({
    status: 200,
    description: '服务活跃',
  })
  @ApiResponse({
    status: 503,
    description: '服务不活跃',
  })
  async checkLiveness(): Promise<HealthCheckResult> {
    // 只检查应用本身是否活跃
    return await this.health.check([
      () => this.memoryHealth.isHealthy('memory'),
    ]);
  }

  /**
   * 就绪性探针
   * Kubernetes readiness probe
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: '就绪性探针' })
  @ApiResponse({
    status: 200,
    description: '服务就绪',
  })
  @ApiResponse({
    status: 503,
    description: '服务未就绪',
  })
  async checkReadiness(): Promise<HealthCheckResult> {
    // 检查所有必要的依赖服务
    return await this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  /**
   * 数据库健康检查
   */
  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: '数据库健康检查' })
  @ApiResponse({
    status: 200,
    description: '数据库连接正常',
  })
  @ApiResponse({
    status: 503,
    description: '数据库连接异常',
  })
  async checkDatabase(): Promise<HealthCheckResult> {
    return await this.health.check([
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }

  /**
   * Redis 健康检查
   */
  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis 健康检查' })
  @ApiResponse({
    status: 200,
    description: 'Redis 连接正常',
  })
  @ApiResponse({
    status: 503,
    description: 'Redis 连接异常',
  })
  async checkRedis(): Promise<HealthCheckResult> {
    return await this.health.check([() => this.redisHealth.isHealthy('redis')]);
  }

  /**
   * 系统资源健康检查
   */
  @Get('system')
  @HealthCheck()
  @ApiOperation({ summary: '系统资源健康检查' })
  @ApiResponse({
    status: 200,
    description: '系统资源正常',
  })
  @ApiResponse({
    status: 503,
    description: '系统资源异常',
  })
  async checkSystem(): Promise<HealthCheckResult> {
    return await this.health.check([
      () => this.memoryHealth.isHealthy('memory'),
      () => this.diskHealth.isHealthy('disk'),
    ]);
  }

  /**
   * 获取系统详细信息
   */
  @Get('info')
  @ApiOperation({ summary: '获取系统详细信息' })
  @ApiResponse({
    status: 200,
    description: '系统信息',
    schema: {
      type: 'object',
      properties: {
        app: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            environment: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
        system: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            arch: { type: 'string' },
            nodeVersion: { type: 'string' },
            memory: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                free: { type: 'number' },
                used: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  getSystemInfo() {
    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      app: {
        name: process.env.npm_package_name || 'ace-nest-starter',
        version: process.env.npm_package_version || '0.0.1',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.floor(uptimeSeconds),
        uptimeHuman: this.formatUptime(uptimeSeconds),
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        memory: {
          total: totalMemory,
          free: freeMemory,
          used: totalMemory - freeMemory,
          usage: `${((1 - freeMemory / totalMemory) * 100).toFixed(2)}%`,
        },
        process: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
