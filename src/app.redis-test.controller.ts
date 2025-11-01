import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/auth.decorators';
import { RedisService, BlacklistService, CaptchaService } from './common/redis';
import {
  Cache,
  Cacheable,
  CacheEvict,
} from './common/redis/decorators/cache.decorator';

@ApiTags('Redis Test')
@Controller('test/redis')
@Public() // Public endpoints for testing
export class RedisTestController {
  constructor(
    private readonly redisService: RedisService,
    private readonly blacklistService: BlacklistService,
    private readonly captchaService: CaptchaService,
  ) {}

  // Basic Redis operations
  @Post('set')
  @ApiOperation({ summary: 'Set a value in Redis' })
  async setValue(@Body() body: { key: string; value: any; ttl?: number }) {
    await this.redisService.set(body.key, body.value, body.ttl);
    return { success: true, message: 'Value set successfully' };
  }

  @Get('get/:key')
  @ApiOperation({ summary: 'Get a value from Redis' })
  async getValue(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    return { key, value };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a key from Redis' })
  async deleteKey(@Param('key') key: string) {
    await this.redisService.del(key);
    return { success: true, message: 'Key deleted successfully' };
  }

  // Token blacklist operations
  @Post('blacklist/token')
  @ApiOperation({ summary: 'Add token to blacklist' })
  async blacklistToken(@Body() body: { token: string; ttl?: number }) {
    await this.blacklistService.addToken(body.token, body.ttl);
    return { success: true, message: 'Token blacklisted' };
  }

  @Get('blacklist/token/:token')
  @ApiOperation({ summary: 'Check if token is blacklisted' })
  async checkToken(@Param('token') token: string) {
    const isBlacklisted = await this.blacklistService.isTokenBlacklisted(token);
    return { token, isBlacklisted };
  }

  @Post('blacklist/user')
  @ApiOperation({ summary: 'Blacklist a user' })
  async blacklistUser(@Body() body: { userId: string; ttl?: number }) {
    await this.blacklistService.blacklistUser(body.userId, body.ttl);
    return { success: true, message: 'User blacklisted' };
  }

  // Captcha operations
  @Post('captcha/create')
  @ApiOperation({ summary: 'Create a captcha' })
  async createCaptcha(
    @Body()
    body: {
      key: string;
      type?: 'email' | 'sms' | 'image';
      ttl?: number;
    },
  ) {
    const code = await this.captchaService.create(
      body.key,
      body.type ?? 'email',
      body.ttl,
    );
    return { success: true, code, message: 'Captcha created' };
  }

  @Post('captcha/verify')
  @ApiOperation({ summary: 'Verify a captcha' })
  async verifyCaptcha(
    @Body()
    body: {
      key: string;
      code: string;
      type?: 'email' | 'sms' | 'image';
    },
  ) {
    const isValid = await this.captchaService.verify(
      body.key,
      body.code,
      body.type ?? 'email',
    );
    return {
      success: isValid,
      message: isValid ? 'Captcha valid' : 'Invalid captcha',
    };
  }

  @Get('captcha/remaining/:key')
  @ApiOperation({ summary: 'Get remaining captcha attempts' })
  async getRemainingAttempts(@Param('key') key: string) {
    const attempts = await this.captchaService.getRemainingAttempts(key);
    return { key, remainingAttempts: attempts };
  }

  // Cache decorator test
  @Get('cache/test/:id')
  @ApiOperation({ summary: 'Test cache decorator' })
  @Cacheable((id: string) => `test:cache:${id}`, 60)
  async testCache(@Param('id') id: string) {
    // Simulate expensive operation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      id,
      data: `Cached data for ${id}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('cache/test/:id')
  @ApiOperation({ summary: 'Clear cache for test' })
  @CacheEvict((id: string) => `test:cache:${id}`)
  clearCache(@Param('id') id: string) {
    return { success: true, message: `Cache cleared for ${id}` };
  }

  // Increment/Decrement operations
  @Post('incr/:key')
  @ApiOperation({ summary: 'Increment a counter' })
  async increment(@Param('key') key: string) {
    const value = await this.redisService.incr(key);
    return { key, value };
  }

  @Post('decr/:key')
  @ApiOperation({ summary: 'Decrement a counter' })
  async decrement(@Param('key') key: string) {
    const value = await this.redisService.decr(key);
    return { key, value };
  }

  // Set operations
  @Post('set-add')
  @ApiOperation({ summary: 'Add member to set' })
  async setAdd(@Body() body: { key: string; member: string; ttl?: number }) {
    await this.redisService.sadd(body.key, body.member, body.ttl);
    return { success: true, message: 'Member added to set' };
  }

  @Get('set-members/:key')
  @ApiOperation({ summary: 'Get all set members' })
  async setMembers(@Param('key') key: string) {
    const members = await this.redisService.smembers(key);
    return { key, members };
  }

  // Hash operations
  @Post('hash-set')
  @ApiOperation({ summary: 'Set hash field' })
  async hashSet(
    @Body() body: { key: string; field: string; value: any; ttl?: number },
  ) {
    await this.redisService.hset(body.key, body.field, body.value, body.ttl);
    return { success: true, message: 'Hash field set' };
  }

  @Get('hash-get/:key/:field')
  @ApiOperation({ summary: 'Get hash field value' })
  async hashGet(@Param('key') key: string, @Param('field') field: string) {
    const value = await this.redisService.hget(key, field);
    return { key, field, value };
  }

  @Get('hash-getall/:key')
  @ApiOperation({ summary: 'Get all hash fields' })
  async hashGetAll(@Param('key') key: string) {
    const hash = await this.redisService.hgetall(key);
    return { key, hash };
  }

  // Clear all cache (use with caution)
  @Delete('cache/clear-all')
  @ApiOperation({ summary: 'Clear all cache (DANGEROUS)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  clearAllCache() {
    this.redisService.clear();
    return { success: true, message: 'All cache cleared' };
  }
}
