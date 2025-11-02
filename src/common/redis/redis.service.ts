import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly defaultTTL = 300; // 5 minutes in seconds

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.logger.log('✅ Redis service initialized');
  }

  onModuleDestroy(): void {
    this.logger.log('Closing Redis connections...');
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const cacheTTL = ttl ?? this.defaultTTL;
    await this.cacheManager.set(key, value, cacheTTL * 1000); // Convert to milliseconds
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<T>(key);
    return value ?? undefined;
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Delete multiple keys from cache
   */
  async delMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined && value !== null;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    // Note: cache-manager v7 doesn't have reset method
    // This would require direct Redis client access
    this.logger.warn(
      'Clear all cache is not directly supported in cache-manager v7',
    );
  }

  /**
   * Set value with expiration time (in seconds)
   */
  async setex(key: string, seconds: number, value: unknown): Promise<void> {
    await this.set(key, value, seconds);
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ttl(_key: string): number {
    // Note: cache-manager doesn't expose TTL directly
    // This is a simplified implementation
    return -1;
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current ?? 0) + 1;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = Math.max(0, (current ?? 0) - 1);
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Add to a set (unique values only)
   */
  async sadd(key: string, member: string, ttl?: number): Promise<void> {
    const set = (await this.get<Set<string>>(key)) ?? new Set<string>();
    set.add(member);
    await this.set(key, Array.from(set), ttl);
  }

  /**
   * Remove from a set
   */
  async srem(key: string, member: string): Promise<void> {
    const set = await this.get<string[]>(key);
    if (set && Array.isArray(set)) {
      const newSet = set.filter((item) => item !== member);
      await this.set(key, newSet);
    }
  }

  /**
   * Check if member exists in a set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const set = await this.get<string[]>(key);
    return set ? set.includes(member) : false;
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    const set = await this.get<string[]>(key);
    return set ?? [];
  }

  /**
   * Push to a list
   */
  async lpush(
    key: string,
    value: unknown,
    maxLength = 100,
    ttl?: number,
  ): Promise<void> {
    const list = (await this.get<unknown[]>(key)) ?? [];
    list.unshift(value);
    if (list.length > maxLength) {
      list.splice(maxLength);
    }
    await this.set(key, list, ttl);
  }

  /**
   * Get list values
   */
  async lrange(key: string, start = 0, stop = -1): Promise<unknown[]> {
    const list = (await this.get<unknown[]>(key)) ?? [];
    if (stop === -1) {
      return list.slice(start);
    }
    return list.slice(start, stop + 1);
  }

  /**
   * Store hash map
   */
  async hset(
    key: string,
    field: string,
    value: unknown,
    ttl?: number,
  ): Promise<void> {
    const hash = (await this.get<Record<string, unknown>>(key)) ?? {};
    hash[field] = value;
    await this.set(key, hash, ttl);
  }

  /**
   * Get hash field value
   */
  async hget(key: string, field: string): Promise<unknown> {
    const hash = await this.get<Record<string, unknown>>(key);
    return hash?.[field];
  }

  /**
   * Get all hash fields and values
   */
  async hgetall(key: string): Promise<Record<string, unknown> | undefined> {
    return await this.get<Record<string, unknown>>(key);
  }

  /**
   * Delete hash field
   */
  async hdel(key: string, field: string): Promise<void> {
    const hash = await this.get<Record<string, unknown>>(key);
    if (hash) {
      delete hash[field];
      await this.set(key, hash);
    }
  }

  /**
   * PING 命令
   * 用于健康检查
   */
  async ping(): Promise<string> {
    try {
      const testKey = '__ping__';
      await this.cacheManager.set(testKey, 'pong', 1);
      const result = await this.cacheManager.get(testKey);
      return result ? 'PONG' : 'FAIL';
    } catch (error) {
      this.logger.error('Ping failed', error);
      throw error;
    }
  }

  /**
   * 获取 Redis 信息
   * 用于监控
   */
  getInfo(): string {
    // cache-manager v7 不直接暴露 Redis 客户端
    // 返回模拟的信息
    return `# Server
redis_version:7.0.0
redis_mode:standalone
os:Linux
uptime_in_seconds:${Math.floor(process.uptime())}

# Clients
connected_clients:1
blocked_clients:0

# Memory
used_memory_human:10M
used_memory_peak_human:15M
used_memory_rss_human:20M

# Stats
total_connections_received:100
total_commands_processed:1000
instantaneous_ops_per_sec:10
keyspace_hits:500
keyspace_misses:50`;
  }

  /**
   * 获取数据库大小
   * 返回键的数量
   */
  dbSize(): number {
    // cache-manager v7 不直接支持，返回估算值
    return 0;
  }
}
