import { Injectable, ExecutionContext } from '@nestjs/common';
import {
  ThrottlerGuard as BaseThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';

/**
 * 自定义限流守卫
 * 扩展默认的 ThrottlerGuard
 */
@Injectable()
export class CustomThrottlerGuard extends BaseThrottlerGuard {
  /**
   * 获取追踪标识
   * 可以根据需要自定义，例如基于 IP + User ID
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 优先使用用户 ID，其次使用 IP
    if (req.user && (req.user as { id?: string }).id) {
      return Promise.resolve(`user-${(req.user as { id: string }).id}`);
    }

    // 获取真实 IP (考虑代理)
    const headers = req.headers as Record<
      string,
      string | string[] | undefined
    >;
    const forwardedFor = headers['x-forwarded-for'];
    const realIp = headers['x-real-ip'];
    const ipFromHeaders =
      typeof forwardedFor === 'string'
        ? forwardedFor
        : typeof realIp === 'string'
          ? realIp
          : undefined;

    const ip =
      ipFromHeaders ||
      (req.connection as { remoteAddress?: string } | undefined)
        ?.remoteAddress ||
      (req.ip as string | undefined) ||
      'unknown';

    return Promise.resolve(`ip-${ip}`);
  }

  /**
   * 生成限流响应消息
   */
  protected async throwThrottlingException(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ExecutionContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    return Promise.reject(
      new Error('请求过于频繁，请稍后再试 (Too Many Requests)'),
    );
  }
}
