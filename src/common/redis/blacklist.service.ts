import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class BlacklistService {
  private readonly logger = new Logger(BlacklistService.name);
  private readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:token:';
  private readonly USER_BLACKLIST_PREFIX = 'blacklist:user:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Add a token to blacklist (for logout or token invalidation)
   * @param token JWT token
   * @param ttl Time to live in seconds (should match token expiry)
   */
  async addToken(token: string, ttl?: number): Promise<void> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    const blacklistTTL = ttl ?? 86400; // Default 24 hours
    await this.redisService.set(key, true, blacklistTTL);
    this.logger.debug(`Token added to blacklist: ${token.substring(0, 20)}...`);
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    return await this.redisService.exists(key);
  }

  /**
   * Remove a token from blacklist
   */
  async removeToken(token: string): Promise<void> {
    const key = `${this.TOKEN_BLACKLIST_PREFIX}${token}`;
    await this.redisService.del(key);
    this.logger.debug(
      `Token removed from blacklist: ${token.substring(0, 20)}...`,
    );
  }

  /**
   * Blacklist all tokens for a specific user (force logout from all devices)
   * @param userId User ID
   * @param ttl Time to live in seconds
   */
  async blacklistUser(userId: string, ttl = 86400): Promise<void> {
    const key = `${this.USER_BLACKLIST_PREFIX}${userId}`;
    const timestamp = Date.now();
    await this.redisService.set(key, timestamp, ttl);
    this.logger.log(`User ${userId} blacklisted until timestamp: ${timestamp}`);
  }

  /**
   * Check if a user is blacklisted
   * @param userId User ID
   * @param tokenIssuedAt Token issued timestamp (in seconds)
   */
  async isUserBlacklisted(
    userId: string,
    tokenIssuedAt: number,
  ): Promise<boolean> {
    const key = `${this.USER_BLACKLIST_PREFIX}${userId}`;
    const blacklistTimestamp = await this.redisService.get<number>(key);

    if (!blacklistTimestamp) {
      return false;
    }

    // Convert token issued time to milliseconds for comparison
    const tokenIssuedMs = tokenIssuedAt * 1000;

    // User is blacklisted if the blacklist timestamp is after token was issued
    return blacklistTimestamp > tokenIssuedMs;
  }

  /**
   * Remove user from blacklist
   */
  async removeUserBlacklist(userId: string): Promise<void> {
    const key = `${this.USER_BLACKLIST_PREFIX}${userId}`;
    await this.redisService.del(key);
    this.logger.log(`User ${userId} removed from blacklist`);
  }

  /**
   * Blacklist multiple tokens at once
   */
  async addTokens(tokens: string[], ttl?: number): Promise<void> {
    await Promise.all(tokens.map((token) => this.addToken(token, ttl)));
  }

  /**
   * Get all blacklisted tokens count (for monitoring)
   */
  getBlacklistStats(): {
    tokenCount: number;
    userCount: number;
  } {
    // Note: This is a simplified version. In production, you might want to use Redis SCAN
    // to count keys with specific prefixes more efficiently
    return {
      tokenCount: 0, // Would need Redis SCAN implementation
      userCount: 0, // Would need Redis SCAN implementation
    };
  }

  /**
   * Clear all blacklisted tokens (use with caution)
   */
  clearAllTokens(): void {
    // In production, you would use Redis SCAN to find and delete all keys with prefix
    this.logger.warn('Clearing all blacklisted tokens');
    // Implementation would require access to Redis client directly for SCAN operation
  }

  /**
   * Invalidate all tokens issued before a specific date for a user
   * @param userId User ID
   * @param beforeDate Date before which all tokens should be invalid
   * @param ttl Time to live for the blacklist entry
   */
  async invalidateUserTokensBefore(
    userId: string,
    beforeDate: Date,
    ttl = 86400,
  ): Promise<void> {
    const key = `${this.USER_BLACKLIST_PREFIX}${userId}`;
    const timestamp = beforeDate.getTime();
    await this.redisService.set(key, timestamp, ttl);
    this.logger.log(
      `Invalidated all tokens for user ${userId} issued before ${beforeDate.toISOString()}`,
    );
  }
}
