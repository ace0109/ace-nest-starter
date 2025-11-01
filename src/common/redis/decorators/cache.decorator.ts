/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache decorator to cache method results
 * Note: This decorator uses 'any' types for compatibility with various class instances
 * and method signatures. The decorator pattern in TypeScript requires some type flexibility.
 */
export function Cacheable(
  key?: string | ((...args: any[]) => string),
  ttl = 300,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const cacheManager = this.cacheManager || this.redisService?.cacheManager;

      if (!cacheManager) {
        console.warn(
          'Cache manager not found, executing method without caching',
        );
        return originalMethod.apply(this, args);
      }

      let cacheKey: string;
      if (typeof key === 'function') {
        cacheKey = key(...args);
      } else if (key) {
        cacheKey = key;
      } else {
        const className = target.constructor.name;
        const argsKey = JSON.stringify(args);
        cacheKey = `${className}:${propertyName}:${argsKey}`;
      }

      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);

      if (result !== undefined && result !== null) {
        await cacheManager.set(cacheKey, result, ttl * 1000);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator to evict cache entries
 */
export function CacheEvict(
  key?: string | ((...args: any[]) => string) | string[],
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const cacheManager = this.cacheManager || this.redisService?.cacheManager;

      if (!cacheManager) {
        console.warn('Cache manager not found, cannot evict cache');
        return result;
      }

      let cacheKeys: string[] = [];

      if (Array.isArray(key)) {
        cacheKeys = key;
      } else if (typeof key === 'function') {
        const generatedKey = key(...args);
        cacheKeys = Array.isArray(generatedKey) ? generatedKey : [generatedKey];
      } else if (key) {
        cacheKeys = [key];
      } else {
        const className = target.constructor.name;
        const argsKey = JSON.stringify(args);
        cacheKeys = [`${className}:${propertyName}:${argsKey}`];
      }

      await Promise.all(cacheKeys.map((k) => cacheManager.del(k)));

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator to cache at class level (all methods)
 */
export function CacheClass(ttl = 300) {
  return function (target: any) {
    const propertyNames = Object.getOwnPropertyNames(target.prototype);

    propertyNames.forEach((propertyName) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        target.prototype,
        propertyName,
      );

      if (
        descriptor &&
        typeof descriptor.value === 'function' &&
        propertyName !== 'constructor'
      ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: any[]) {
          const cacheManager =
            this.cacheManager || this.redisService?.cacheManager;

          if (!cacheManager) {
            return originalMethod.apply(this, args);
          }

          const className = target.name;
          const argsKey = JSON.stringify(args);
          const cacheKey = `${className}:${propertyName}:${argsKey}`;

          const cachedResult = await cacheManager.get(cacheKey);
          if (cachedResult !== undefined && cachedResult !== null) {
            return cachedResult;
          }

          const result = await originalMethod.apply(this, args);

          if (result !== undefined && result !== null) {
            await cacheManager.set(cacheKey, result, ttl * 1000);
          }

          return result;
        };

        Object.defineProperty(target.prototype, propertyName, descriptor);
      }
    });
  };
}

/**
 * Decorator to set cache configuration metadata
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Combined cache decorator with multiple options
 */
export interface CacheOptions {
  key?: string | ((...args: any[]) => string);
  ttl?: number;
  condition?: (...args: any[]) => boolean;
}

export function Cache(options: CacheOptions = {}) {
  const { key, ttl = 300, condition } = options;

  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      if (condition && !condition(...args)) {
        return originalMethod.apply(this, args);
      }

      const cacheManager = this.cacheManager || this.redisService?.cacheManager;

      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }

      let cacheKey: string;
      if (typeof key === 'function') {
        cacheKey = key(...args);
      } else if (key) {
        cacheKey = key;
      } else {
        const className = target.constructor.name;
        const argsKey = JSON.stringify(args);
        cacheKey = `${className}:${propertyName}:${argsKey}`;
      }

      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);

      if (result !== undefined && result !== null) {
        await cacheManager.set(cacheKey, result, ttl * 1000);
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator for pattern-based cache eviction
 */
export function CacheEvictPattern(
  pattern: string | ((...args: any[]) => string),
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const redisService = this.redisService;
      if (!redisService) {
        console.warn('Redis service not found, cannot evict cache by pattern');
        return result;
      }

      const evictPattern =
        typeof pattern === 'function' ? pattern(...args) : pattern;

      console.warn(
        `Pattern-based cache eviction for pattern: ${evictPattern} - requires SCAN implementation`,
      );

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator to use method parameter as cache key
 */
export function CacheParam(paramIndex: number, prefix?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const cacheManager = this.cacheManager || this.redisService?.cacheManager;

      if (!cacheManager) {
        return originalMethod.apply(this, args);
      }

      const paramValue = args[paramIndex];
      const cacheKey = prefix
        ? `${prefix}:${paramValue}`
        : `${target.constructor.name}:${propertyName}:${paramValue}`;

      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult !== undefined && cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);

      if (result !== undefined && result !== null) {
        await cacheManager.set(cacheKey, result, 300 * 1000);
      }

      return result;
    };

    return descriptor;
  };
}
