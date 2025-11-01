import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

// 扩展 Request 接口以包含 id 属性
interface RequestWithTraceId extends Request {
  id: string;
}

/**
 * 统一成功响应格式
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  code: number;
  message: string;
  data: T;
  timestamp: number;
  traceId: string;
  path?: string;
  method?: string;
}

/**
 * 响应转换拦截器
 * 将所有成功的响应转换为统一格式
 */
@Injectable()
export class ResponseTransformInterceptor<T = unknown>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId = (request as RequestWithTraceId).id ?? 'unknown';

    return next.handle().pipe(
      map((data) => {
        // 如果响应已经是格式化的格式（比如分页响应），保持原样但添加元数据
        if (this.isFormattedResponse(data)) {
          const formatted = data as unknown as Partial<SuccessResponse<T>>;
          return {
            success: true,
            code: formatted.code ?? 200,
            message: formatted.message ?? 'Success',
            data: formatted.data ?? data,
            timestamp: Date.now(),
            traceId,
            path: request.path,
            method: request.method,
          };
        }

        // 标准响应格式
        return {
          success: true,
          code: 200,
          message: 'Success',
          data,
          timestamp: Date.now(),
          traceId,
          path: request.path,
          method: request.method,
        };
      }),
    );
  }

  /**
   * 检查响应是否已经是格式化的格式
   */
  private isFormattedResponse(data: unknown): boolean {
    return (
      data !== null &&
      typeof data === 'object' &&
      'code' in data &&
      'message' in data &&
      'data' in data
    );
  }
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * 创建格式化的成功响应
 * 用于需要自定义消息或代码的场景
 */
export function createSuccessResponse<T>(
  data: T,
  message = 'Success',
  code = 200,
): Partial<SuccessResponse<T>> {
  return {
    code,
    message,
    data,
  };
}
