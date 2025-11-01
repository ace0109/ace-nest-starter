import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './common/decorators/auth.decorators';
import {
  AuthThrottle,
  ApiThrottle,
  StrictThrottle,
  ThrottlerService,
} from './common/throttler';

/**
 * 限流功能测试控制器
 * 用于验证限流功能是否正常工作
 */
@ApiTags('throttler-test')
@Controller('test/throttler')
@Public() // 跳过 JWT 认证
export class ThrottlerTestController {
  constructor(private readonly throttlerService: ThrottlerService) {}

  /**
   * 测试默认限流
   * 使用全局配置: 60秒内最多100次
   */
  @Get('default')
  @ApiOperation({ summary: '测试默认限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  testDefaultThrottle() {
    return {
      success: true,
      message: '默认限流测试 (60秒内最多100次)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试认证接口限流
   * 60秒内最多5次
   */
  @Post('auth')
  @AuthThrottle()
  @ApiOperation({ summary: '测试认证接口限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  testAuthThrottle() {
    return {
      success: true,
      message: '认证限流测试 (60秒内最多5次)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试API接口限流
   * 60秒内最多50次
   */
  @Get('api')
  @ApiThrottle()
  @ApiOperation({ summary: '测试API接口限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  testApiThrottle() {
    return {
      success: true,
      message: 'API限流测试 (60秒内最多50次)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试严格限流
   * 60秒内最多3次
   */
  @Post('strict')
  @StrictThrottle()
  @ApiOperation({ summary: '测试严格限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  testStrictThrottle() {
    return {
      success: true,
      message: '严格限流测试 (60秒内最多3次)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 测试跳过限流
   * 该接口不受限流影响
   */
  @Get('skip')
  @SkipThrottle()
  @ApiOperation({ summary: '测试跳过限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  testSkipThrottle() {
    return {
      success: true,
      message: '跳过限流测试 (无限制)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 自定义限���测试
   * 30秒内最多2次
   */
  @Get('custom')
  @AuthThrottle(2, 30)
  @ApiOperation({ summary: '测试自定义限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  testCustomThrottle() {
    return {
      success: true,
      message: '自定义限流测试 (30秒内最多2次)',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取限流状态
   */
  @Get('stats/:key')
  @SkipThrottle()
  @ApiOperation({ summary: '获取限流状态' })
  @ApiResponse({
    status: 200,
    description: '限流状态信息',
    schema: {
      type: 'object',
      properties: {
        current: { type: 'number', description: '当前请求次数' },
        limit: { type: 'number', description: '限制次数' },
        remaining: { type: 'number', description: '剩余请求次数' },
        resetIn: { type: 'number', description: '重置时间（秒）' },
        isThrottled: { type: 'boolean', description: '是否被限流' },
      },
    },
  })
  async getThrottleStats(@Param('key') key: string) {
    const stats = await this.throttlerService.getThrottleStats(
      `throttle:${key}`,
      100, // 默认限制
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 重置限流计数
   */
  @Delete('reset/:key')
  @SkipThrottle()
  @ApiOperation({ summary: '重置限流计数' })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetThrottle(@Param('key') key: string) {
    await this.throttlerService.resetThrottle(`throttle:${key}`);

    return {
      success: true,
      message: `限流计数已重置: ${key}`,
    };
  }

  /**
   * 批量重置限流
   */
  @Delete('reset-pattern')
  @SkipThrottle()
  @ApiOperation({ summary: '批量��置限流' })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetThrottleByPattern(@Body() body: { pattern: string }) {
    const count = await this.throttlerService.resetThrottleByPattern(
      body.pattern,
    );

    return {
      success: true,
      message: `已重置 ${count} 个限流键`,
    };
  }

  /**
   * 测试并发请求
   * 用于模拟高并发场景
   */
  @Post('concurrent')
  @ApiThrottle(10, 10) // 10秒内最多10次
  @ApiOperation({ summary: '测试并发请求限流' })
  @ApiResponse({ status: 200, description: '请求成功' })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  async testConcurrentThrottle() {
    // 模拟处理延迟
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      message: '并发限流测试 (10秒内最多10次)',
      timestamp: new Date().toISOString(),
      processId: process.pid,
    };
  }
}
