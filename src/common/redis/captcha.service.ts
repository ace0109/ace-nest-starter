import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { randomInt } from 'crypto';

export interface CaptchaData {
  code: string;
  type: 'email' | 'sms' | 'image';
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly CAPTCHA_PREFIX = 'captcha:';
  private readonly MAX_ATTEMPTS = 5;
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private readonly RATE_LIMIT_PREFIX = 'captcha:rate:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generate a random verification code
   */
  generateCode(length = 6, numeric = true): string {
    if (numeric) {
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return randomInt(min, max).toString();
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[randomInt(0, chars.length)];
    }
    return code;
  }

  /**
   * Store a verification code
   * @param key Unique identifier (email, phone, or session ID)
   * @param type Type of captcha
   * @param ttl Time to live in seconds
   */
  async create(
    key: string,
    type: 'email' | 'sms' | 'image' = 'email',
    ttl = this.DEFAULT_TTL,
  ): Promise<string> {
    // Check rate limit
    if (await this.isRateLimited(key)) {
      throw new Error('Too many captcha requests. Please try again later.');
    }

    const code = this.generateCode();
    const captchaKey = `${this.CAPTCHA_PREFIX}${type}:${key}`;

    const data: CaptchaData = {
      code,
      type,
      attempts: 0,
      createdAt: new Date(),
    };

    await this.redisService.set(captchaKey, data, ttl);
    await this.incrementRateLimit(key);

    this.logger.debug(`Captcha created for ${type}:${key}: ${code}`);
    return code;
  }

  /**
   * Create an image captcha with custom text
   */
  async createImageCaptcha(
    sessionId: string,
    customCode?: string,
    ttl = this.DEFAULT_TTL,
  ): Promise<string> {
    const code = customCode ?? this.generateCode(6, false);
    const captchaKey = `${this.CAPTCHA_PREFIX}image:${sessionId}`;

    const data: CaptchaData = {
      code: code.toUpperCase(),
      type: 'image',
      attempts: 0,
      createdAt: new Date(),
    };

    await this.redisService.set(captchaKey, data, ttl);
    this.logger.debug(`Image captcha created for session ${sessionId}`);
    return code;
  }

  /**
   * Verify a captcha code
   * @param key Unique identifier
   * @param code User provided code
   * @param type Type of captcha
   * @param deleteAfterVerify Delete the captcha after successful verification
   */
  async verify(
    key: string,
    code: string,
    type: 'email' | 'sms' | 'image' = 'email',
    deleteAfterVerify = true,
  ): Promise<boolean> {
    const captchaKey = `${this.CAPTCHA_PREFIX}${type}:${key}`;
    const data = await this.redisService.get<CaptchaData>(captchaKey);

    if (!data) {
      this.logger.warn(`Captcha not found for ${type}:${key}`);
      return false;
    }

    // Check if max attempts exceeded
    if (data.attempts >= this.MAX_ATTEMPTS) {
      await this.redisService.del(captchaKey);
      this.logger.warn(`Max attempts exceeded for ${type}:${key}`);
      return false;
    }

    // Increment attempts
    data.attempts++;
    await this.redisService.set(captchaKey, data);

    // Verify code (case-insensitive for image captcha)
    const isValid =
      type === 'image'
        ? code.toUpperCase() === data.code.toUpperCase()
        : code === data.code;

    if (isValid && deleteAfterVerify) {
      await this.redisService.del(captchaKey);
      this.logger.debug(`Captcha verified and deleted for ${type}:${key}`);
    } else if (!isValid) {
      this.logger.warn(
        `Invalid captcha attempt ${data.attempts}/${this.MAX_ATTEMPTS} for ${type}:${key}`,
      );
    }

    return isValid;
  }

  /**
   * Get remaining attempts for a captcha
   */
  async getRemainingAttempts(
    key: string,
    type: 'email' | 'sms' | 'image' = 'email',
  ): Promise<number> {
    const captchaKey = `${this.CAPTCHA_PREFIX}${type}:${key}`;
    const data = await this.redisService.get<CaptchaData>(captchaKey);

    if (!data) {
      return 0;
    }

    return Math.max(0, this.MAX_ATTEMPTS - data.attempts);
  }

  /**
   * Delete a captcha
   */
  async delete(
    key: string,
    type: 'email' | 'sms' | 'image' = 'email',
  ): Promise<void> {
    const captchaKey = `${this.CAPTCHA_PREFIX}${type}:${key}`;
    await this.redisService.del(captchaKey);
    this.logger.debug(`Captcha deleted for ${type}:${key}`);
  }

  /**
   * Check if a key is rate limited
   */
  private async isRateLimited(key: string): Promise<boolean> {
    const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    const count = await this.redisService.get<number>(rateLimitKey);
    return count !== undefined && count >= 10; // Max 10 captchas per hour
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(key: string): Promise<void> {
    const rateLimitKey = `${this.RATE_LIMIT_PREFIX}${key}`;
    const count = (await this.redisService.get<number>(rateLimitKey)) ?? 0;
    await this.redisService.set(rateLimitKey, count + 1, 3600); // 1 hour TTL
  }

  /**
   * Get captcha info (for debugging/admin purposes)
   */
  async getCaptchaInfo(
    key: string,
    type: 'email' | 'sms' | 'image' = 'email',
  ): Promise<CaptchaData | undefined> {
    const captchaKey = `${this.CAPTCHA_PREFIX}${type}:${key}`;
    return await this.redisService.get<CaptchaData>(captchaKey);
  }

  /**
   * Batch create captchas (useful for testing)
   */
  async batchCreate(
    keys: string[],
    type: 'email' | 'sms' | 'image' = 'email',
    ttl = this.DEFAULT_TTL,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const key of keys) {
      try {
        const code = await this.create(key, type, ttl);
        results.set(key, code);
      } catch (error) {
        this.logger.error(`Failed to create captcha for ${key}:`, error);
      }
    }

    return results;
  }

  /**
   * Clear all captchas for a specific type (use with caution)
   */
  clearByType(type: 'email' | 'sms' | 'image'): void {
    // In production, this would use Redis SCAN to find and delete keys
    this.logger.warn(`Clearing all ${type} captchas`);
    // Implementation would require access to Redis client directly
  }
}
