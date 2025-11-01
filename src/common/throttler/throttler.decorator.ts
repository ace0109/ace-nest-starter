import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * 自定义限流装饰器
 * 提供预设的限流配置
 */

/**
 * 认证接口限流装饰器
 * 适用于登录、注册等认证接口
 * 默认: 60秒内最多5次请求
 */
export const AuthThrottle = (limit = 5, ttl = 60) =>
  Throttle({ default: { limit, ttl } });

/**
 * API接口限流装饰器
 * 适用于普通业务接口
 * 默认: 60秒内最多50次请求
 */
export const ApiThrottle = (limit = 50, ttl = 60) =>
  Throttle({ default: { limit, ttl } });

/**
 * 严格限流装饰器
 * 适用于敏感操作接口
 * 默认: 60秒内最多3次请求
 */
export const StrictThrottle = (limit = 3, ttl = 60) =>
  Throttle({ default: { limit, ttl } });

/**
 * 跳过限流装饰器
 * 用于标记不需要限流的接口
 */
export const SkipThrottle = () => SetMetadata('skipThrottle', true);

/**
 * 自定义限流键装饰器
 * 用于设置自定义的限流键生成逻辑
 */
export const ThrottleKey = (key: string) => SetMetadata('throttleKey', key);
