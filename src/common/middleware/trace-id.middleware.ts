import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// 扩展 Request 接口以包含 traceId
// Pino 已经添加了 id 属性，所以我们只需要添加 traceId
interface ExtendedRequest extends Request {
  traceId?: string;
}

// 全局扩展 Express Request 类型
declare module 'express' {
  interface Request {
    traceId?: string;
  }
}

/**
 * TraceID 中间件
 * 为每个请求生成唯一的 TraceID，用于全链路日志追踪
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: ExtendedRequest, res: Response, next: NextFunction): void {
    // 优先从请求头获取 TraceID（支持分布式追踪）
    const headerTraceId =
      req.headers['x-trace-id'] || req.headers['x-request-id'];

    // 获取 Pino 生成的 ID（如果有）
    const pinoId = req.id as string | undefined;
    const traceId = headerTraceId || pinoId || uuidv4();

    // 将 TraceID 添加到请求对象
    req.traceId = String(traceId);

    // 如果 Pino 没有生成 ID，手动设置（保持一致性）
    if (!pinoId) {
      req.id = req.traceId;
    }

    // 将 TraceID 添加到响应头（方便调试和追踪）
    res.setHeader('X-Trace-Id', req.traceId);

    next();
  }
}

/**
 * 获取请求的 TraceID
 * @param req Express Request 对象
 * @returns TraceID 字符串
 */
export function getTraceId(req: Request): string {
  const extReq = req as ExtendedRequest;
  const pinoId = req.id as string | undefined;
  return extReq.traceId || pinoId || 'unknown';
}
